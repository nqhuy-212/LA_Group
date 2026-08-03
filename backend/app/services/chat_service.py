import json
import logging
from collections.abc import AsyncIterator
from datetime import date

import anthropic
from sqlalchemy import select
from sqlalchemy.orm import Session
from starlette.concurrency import run_in_threadpool

from app.core.config import settings
from app.core.search import unaccent_ilike
from app.db.session import SessionLocal
from app.models import IndustrialPark, Job, JobCategory, Province
from app.models.enums import JobStatus
from app.schemas.chat import ChatMessageIn

logger = logging.getLogger("app.chat")

SEARCH_RESULT_LIMIT = 8
MAX_TOOL_TURNS = 4  # chặn vòng lặp tool-use bất tận nếu model liên tục gọi tool

SYSTEM_PROMPT = """Bạn là trợ lý tư vấn việc làm của LA Group (LAHR) — công ty cung ứng \
nhân lực tại Hải Dương. Nhiệm vụ DUY NHẤT của bạn là giúp người lao động tìm việc làm phù \
hợp dựa trên dữ liệu tin tuyển dụng thật của LA Group.

QUY TẮC BẮT BUỘC:
- Luôn dùng tool `search_jobs` để tra dữ liệu thật trước khi trả lời câu hỏi về việc làm, \
mức lương, hoặc công ty tuyển dụng. KHÔNG được tự bịa tên công ty, mức lương, hay tin \
tuyển dụng không có trong kết quả tool trả về.
- Nếu tool không tìm thấy tin phù hợp, nói rõ là hiện chưa có, gợi ý người dùng thử từ khoá \
khác hoặc để lại thông tin liên hệ qua hotline 0922.86.99.66.
- Nếu người dùng hỏi ngoài phạm vi việc làm/tuyển dụng/chính sách của LA Group (VD: hỏi về \
chủ đề chung, kỹ thuật, giải trí...), từ chối lịch sự và hướng họ quay lại chủ đề việc làm.
- Trả lời ngắn gọn, thân thiện, bằng tiếng Việt, dễ hiểu với lao động phổ thông. Khi giới \
thiệu tin tuyển dụng, luôn kèm đường link (`url`) để người dùng bấm vào xem chi tiết.
- Mức lương trong dữ liệu là số nguyên VNĐ/tháng — hãy diễn đạt tự nhiên (VD: "8 - 10 triệu")."""

SEARCH_JOBS_TOOL: dict = {
    "name": "search_jobs",
    "description": (
        "Tìm tin tuyển dụng ĐANG CÒN HIỆU LỰC trong cơ sở dữ liệu thật của LA Group theo "
        "từ khoá vị trí, khu vực/khu công nghiệp, ngành nghề, và mức lương tối thiểu mong "
        "muốn. Luôn gọi tool này trước khi trả lời bất kỳ câu hỏi nào về việc làm cụ thể."
    ),
    "input_schema": {
        "type": "object",
        "properties": {
            "keyword": {
                "type": "string",
                "description": "Từ khoá tên vị trí/công việc, VD 'công nhân lắp ráp'",
            },
            "province": {
                "type": "string",
                "description": "Tên tỉnh/thành hoặc khu công nghiệp, VD 'Đại An', 'Hải Dương'",
            },
            "category": {
                "type": "string",
                "description": "Tên ngành nghề, VD 'Sản xuất', 'Kho vận'",
            },
            "salary_min": {
                "type": "integer",
                "description": "Mức lương tối thiểu mong muốn, đơn vị VNĐ/tháng",
            },
        },
    },
}


def _search_jobs_sync(
    db: Session,
    keyword: str | None,
    province: str | None,
    category: str | None,
    salary_min: int | None,
) -> dict:
    """Tách khỏi việc tự mở session để test được trực tiếp bằng `db_session` fixture
    (xem `tests/test_chat.py`) — hàm mở session riêng (`_search_jobs_with_own_session`)
    chỉ dùng ở luồng thật, chạy trong threadpool vì endpoint chat là async def duy
    nhất trong hệ thống (D1), không được đụng DB đồng bộ trực tiếp trong coroutine."""
    conditions = [Job.status == JobStatus.PUBLISHED]
    if keyword:
        conditions.append(unaccent_ilike(Job.title, keyword))
    if province:
        conditions.append(
            Job.province.has(unaccent_ilike(Province.name, province))
            | Job.industrial_park.has(unaccent_ilike(IndustrialPark.name, province))
        )
    if category:
        conditions.append(Job.category.has(unaccent_ilike(JobCategory.name, category)))
    if salary_min:
        conditions.append(Job.salary_max >= salary_min)

    jobs = db.execute(
        select(Job)
        .where(*conditions)
        .order_by(Job.is_hot.desc(), Job.published_at.desc())
        .limit(SEARCH_RESULT_LIMIT)
    ).scalars().all()

    return {
        "count": len(jobs),
        "jobs": [
            {
                "title": job.title,
                "company": job.company.display_name_public or job.company.name,
                "category": job.category.name,
                "industrial_park": (
                    job.industrial_park.name if job.industrial_park else None
                ),
                "province": job.province.name,
                "salary_min": job.salary_min,
                "salary_max": job.salary_max,
                "salary_negotiable": job.salary_negotiable,
                "deadline": job.deadline.isoformat() if job.deadline else None,
                "url": f"{settings.public_site_url}/viec-lam/{job.slug}",
            }
            for job in jobs
        ],
    }


def _search_jobs_with_own_session(
    keyword: str | None, province: str | None, category: str | None, salary_min: int | None
) -> dict:
    with SessionLocal() as db:
        return _search_jobs_sync(db, keyword, province, category, salary_min)


async def _run_search_jobs_tool(tool_input: dict) -> dict:
    return await run_in_threadpool(
        _search_jobs_with_own_session,
        tool_input.get("keyword"),
        tool_input.get("province"),
        tool_input.get("category"),
        tool_input.get("salary_min"),
    )


# Trần chi tiêu ngày (D-P8): đếm token gần đúng ở tiến trình FastAPI đơn (một
# worker/VPS 4GB — xem tech-stack.md), KHÔNG cần bảng DB riêng cho một soft-cap
# MVP. Reset tự nhiên theo ngày UTC+7 xấp xỉ bằng date.today() của server.
_usage_date: date | None = None
_usage_tokens = 0


def has_budget() -> bool:
    global _usage_date, _usage_tokens
    today = date.today()
    if _usage_date != today:
        _usage_date = today
        _usage_tokens = 0
    return _usage_tokens < settings.chat_daily_token_budget


def _record_usage(input_tokens: int, output_tokens: int) -> None:
    global _usage_tokens
    _usage_tokens += input_tokens + output_tokens


def _sse(event_type: str, **data) -> str:
    return f"data: {json.dumps({'type': event_type, **data}, ensure_ascii=False)}\n\n"


async def fallback_stream() -> AsyncIterator[str]:
    yield _sse(
        "token",
        text=(
            "Xin lỗi, hệ thống tư vấn đang tạm quá tải. Bạn vui lòng gọi hotline "
            "0922.86.99.66 để được hỗ trợ trực tiếp nhé."
        ),
    )
    yield _sse("done")


def _build_messages(message: str, history: list[ChatMessageIn]) -> list[dict]:
    messages = [{"role": h.role, "content": h.content} for h in history]
    messages.append({"role": "user", "content": message})
    return messages


async def stream_chat(message: str, history: list[ChatMessageIn]) -> AsyncIterator[str]:
    client = anthropic.AsyncAnthropic(api_key=settings.anthropic_api_key)
    messages = _build_messages(message, history)

    try:
        for _ in range(MAX_TOOL_TURNS):
            async with client.messages.stream(
                model=settings.chat_model,
                max_tokens=1024,
                system=SYSTEM_PROMPT,
                tools=[SEARCH_JOBS_TOOL],
                messages=messages,
            ) as stream:
                async for text in stream.text_stream:
                    yield _sse("token", text=text)
                final_message = await stream.get_final_message()

            _record_usage(final_message.usage.input_tokens, final_message.usage.output_tokens)

            if final_message.stop_reason != "tool_use":
                break

            tool_use_block = next(
                block for block in final_message.content if block.type == "tool_use"
            )
            tool_result = await _run_search_jobs_tool(tool_use_block.input)
            messages.append({"role": "assistant", "content": final_message.content})
            messages.append(
                {
                    "role": "user",
                    "content": [
                        {
                            "type": "tool_result",
                            "tool_use_id": tool_use_block.id,
                            "content": json.dumps(tool_result, ensure_ascii=False),
                        }
                    ],
                }
            )
        yield _sse("done")
    except anthropic.APIError:
        logger.exception("Lỗi gọi Anthropic API")
        yield _sse(
            "error",
            message="Xin lỗi, có lỗi xảy ra. Bạn vui lòng thử lại hoặc gọi hotline 0922.86.99.66.",
        )
