import re

from pydantic import BaseModel

# Khớp "Cập nhật lần cuối" ở frontend/app/(public)/chinh-sach-bao-mat/page.tsx — cố
# định ở server, KHÔNG nhận từ client, vì client không đáng tin để tự khai báo đã
# đọc đúng phiên bản chính sách nào.
CONSENT_VERSION = "2026-08-02"

PHONE_REGEX = re.compile(r"^(0|\+84)(3|5|7|8|9)\d{8}$")

_HTML_TAG_RE = re.compile(r"<[^>]*>")


def strip_html(value: str) -> str:
    """Loại bỏ thẻ HTML thô khỏi input tự do (họ tên, quê quán) — phòng thủ thêm dù
    React đã tự escape khi render, tránh lưu HTML sống vào DB."""
    return _HTML_TAG_RE.sub("", value).strip()


def normalize_phone(value: str) -> str:
    normalized = value.strip()
    if not PHONE_REGEX.match(normalized):
        raise ValueError("Số điện thoại không hợp lệ (VD: 0912345678 hoặc +84912345678)")
    return normalized


class ApplicationCreateResponse(BaseModel):
    ok: bool
    reference_code: str
    duplicate: bool = False
    message: str | None = None
