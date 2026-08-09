import json
import logging
from collections.abc import AsyncIterator
from datetime import date

import openai
from sqlalchemy import select
from sqlalchemy.orm import Session
from starlette.concurrency import run_in_threadpool

from app.core.config import settings
from app.core.search import unaccent_ilike
from app.db.session import SessionLocal
from app.models import IndustrialPark, Job, JobCategory, Province
from app.models.enums import EmploymentType, JobStatus, SalaryPeriod
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
    "type": "function",
    "function": {
        "name": "search_jobs",
        "description": (
            "Tìm tin tuyển dụng ĐANG CÒN HIỆU LỰC trong cơ sở dữ liệu thật của LA Group theo "
            "từ khoá vị trí, khu vực/khu công nghiệp, ngành nghề, và mức lương tối thiểu mong "
            "muốn. Luôn gọi tool này trước khi trả lời bất kỳ câu hỏi nào về việc làm cụ thể."
        ),
        "parameters": {
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
                "employment_type": {
                    "type": "string",
                    "enum": ["official", "seasonal"],
                    "description": (
                        "Loại hình công việc: 'official' = chính thức, "
                        "'seasonal' = thời vụ"
                    ),
                },
                "salary_period": {
                    "type": "string",
                    "enum": ["weekly", "monthly"],
                    "description": (
                        "Kỳ trả lương: 'weekly' = lương tuần, 'monthly' = lương tháng"
                    ),
                },
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
    employment_type: str | None = None,
    salary_period: str | None = None,
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
    # Model đôi khi trả giá trị lạ ngoài enum sau nhiều lượt hội thoại dài dù JSON
    # schema đã ràng buộc "enum" — validate phòng thủ, bỏ qua điều kiện lọc thay vì
    # để lỗi so sánh SQLAlchemy enum làm sập cả request (không tin tuyệt đối LLM).
    if employment_type:
        try:
            conditions.append(Job.employment_type == EmploymentType(employment_type))
        except ValueError:
            pass
    if salary_period:
        try:
            conditions.append(Job.salary_period == SalaryPeriod(salary_period))
        except ValueError:
            pass

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
                "employment_type": job.employment_type.value if job.employment_type else None,
                "salary_period": job.salary_period.value if job.salary_period else None,
                "deadline": job.deadline.isoformat() if job.deadline else None,
                "url": f"{settings.public_site_url}/viec-lam/{job.slug}",
            }
            for job in jobs
        ],
    }


def _search_jobs_with_own_session(
    keyword: str | None,
    province: str | None,
    category: str | None,
    salary_min: int | None,
    employment_type: str | None,
    salary_period: str | None,
) -> dict:
    with SessionLocal() as db:
        return _search_jobs_sync(
            db, keyword, province, category, salary_min, employment_type, salary_period
        )


async def _run_search_jobs_tool(tool_input: dict) -> dict:
    return await run_in_threadpool(
        _search_jobs_with_own_session,
        tool_input.get("keyword"),
        tool_input.get("province"),
        tool_input.get("category"),
        tool_input.get("salary_min"),
        tool_input.get("employment_type"),
        tool_input.get("salary_period"),
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
    client = openai.AsyncOpenAI(api_key=settings.openai_api_key)
    messages: list[dict] = [
        {"role": "system", "content": SYSTEM_PROMPT},
        *_build_messages(message, history),
    ]

    try:
        for _ in range(MAX_TOOL_TURNS):
            stream = await client.chat.completions.create(
                model=settings.chat_model,
                messages=messages,
                tools=[SEARCH_JOBS_TOOL],
                # Chỉ có đúng 1 tool (search_jobs) — tắt gọi song song để giữ vòng
                # lặp đơn giản (1 tool call/lượt), khớp cấu trúc tool-use gốc.
                parallel_tool_calls=False,
                stream=True,
                stream_options={"include_usage": True},
            )

            content = ""
            tool_call_id: str | None = None
            tool_call_name: str | None = None
            tool_call_arguments = ""
            finish_reason: str | None = None
            usage = None

            async for chunk in stream:
                if chunk.usage:
                    usage = chunk.usage
                if not chunk.choices:
                    continue
                choice = chunk.choices[0]
                if choice.finish_reason:
                    finish_reason = choice.finish_reason
                delta = choice.delta
                if delta.content:
                    content += delta.content
                    yield _sse("token", text=delta.content)
                if delta.tool_calls:
                    call = delta.tool_calls[0]
                    if call.id:
                        tool_call_id = call.id
                    if call.function and call.function.name:
                        tool_call_name = call.function.name
                    if call.function and call.function.arguments:
                        tool_call_arguments += call.function.arguments

            if usage:
                _record_usage(usage.prompt_tokens, usage.completion_tokens)

            if finish_reason != "tool_calls" or tool_call_id is None:
                break

            tool_input = json.loads(tool_call_arguments) if tool_call_arguments else {}
            tool_result = await _run_search_jobs_tool(tool_input)
            messages.append(
                {
                    "role": "assistant",
                    "content": content or None,
                    "tool_calls": [
                        {
                            "id": tool_call_id,
                            "type": "function",
                            "function": {"name": tool_call_name, "arguments": tool_call_arguments},
                        }
                    ],
                }
            )
            messages.append(
                {
                    "role": "tool",
                    "tool_call_id": tool_call_id,
                    "content": json.dumps(tool_result, ensure_ascii=False),
                }
            )
        yield _sse("done")
    except openai.APIError:
        logger.exception("Lỗi gọi OpenAI API")
        yield _sse(
            "error",
            message="Xin lỗi, có lỗi xảy ra. Bạn vui lòng thử lại hoặc gọi hotline 0922.86.99.66.",
        )
