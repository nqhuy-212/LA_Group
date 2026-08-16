from slugify import slugify
from sqlalchemy import select
from sqlalchemy.orm import Session


def generate_unique_slug(
    db: Session,
    model: type,
    text: str,
    *,
    exclude_id: int | None = None,
    max_length: int | None = None,
) -> str:
    """Sinh slug từ `text` (python-slugify: bỏ dấu, đ→d) và tự thêm hậu tố số nếu trùng.

    Constraint unique ở DB chỉ chặn được trùng lặp ở tầng ghi cuối cùng (500
    IntegrityError khó hiểu với nhân viên đăng tin) — hàm này chủ động dò trước và
    tự chọn slug rảnh, thân thiện SEO hơn là chặn lại bắt người dùng tự sửa.

    `max_length`: một số cột slug hẹp hơn 200 ký tự mặc định (VD `job_categories.slug`
    chỉ `String(30)`) — cắt `base` TRƯỚC khi nối hậu tố số, để candidate luôn nằm
    trong giới hạn cột, không ném `IntegrityError` khó hiểu lúc ghi.
    """
    base = slugify(text)
    if max_length is not None and len(base) > max_length:
        base = base[:max_length].rstrip("-")
    candidate = base
    suffix = 2
    while True:
        query = select(model.id).where(model.slug == candidate)
        if exclude_id is not None:
            query = query.where(model.id != exclude_id)
        if db.execute(query).scalar_one_or_none() is None:
            return candidate
        suffix_str = f"-{suffix}"
        if max_length is not None and len(base) + len(suffix_str) > max_length:
            candidate = base[: max_length - len(suffix_str)].rstrip("-") + suffix_str
        else:
            candidate = f"{base}{suffix_str}"
        suffix += 1
