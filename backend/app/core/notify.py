import json
import logging
import urllib.request
from urllib.error import URLError

from app.core.config import settings

logger = logging.getLogger("app.notify")


def notify_new_application(
    *, reference_code: str, job_title: str | None, full_name: str, phone: str
) -> None:
    """Bắn webhook n8n khi có ứng viên mới — no-op nếu chưa cấu hình
    (n8n là tích hợp tuỳ chọn, không phải core dependency, xem tech-stack.md).
    Chạy trong BackgroundTask (sau khi đã trả response), lỗi ở đây chỉ log, không
    bao giờ được làm hỏng luồng nộp hồ sơ chính đã thành công.
    """
    if not settings.n8n_webhook_url:
        return

    payload = json.dumps(
        {
            "reference_code": reference_code,
            "job_title": job_title,
            "full_name": full_name,
            "phone": phone,
        }
    ).encode("utf-8")
    request = urllib.request.Request(
        settings.n8n_webhook_url,
        data=payload,
        headers={"Content-Type": "application/json"},
        method="POST",
    )
    try:
        urllib.request.urlopen(request, timeout=5)  # noqa: S310 (URL đến từ .env nội bộ, không phải user input)
    except URLError:
        logger.exception("Không gửi được webhook n8n cho ứng viên %s", reference_code)
