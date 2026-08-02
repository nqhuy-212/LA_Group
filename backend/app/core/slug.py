from slugify import slugify
from sqlalchemy import select
from sqlalchemy.orm import Session


def generate_unique_slug(
    db: Session, model: type, text: str, *, exclude_id: int | None = None
) -> str:
    """Sinh slug từ `text` (python-slugify: bỏ dấu, đ→d) và tự thêm hậu tố số nếu trùng.

    Constraint unique ở DB chỉ chặn được trùng lặp ở tầng ghi cuối cùng (500
    IntegrityError khó hiểu với nhân viên đăng tin) — hàm này chủ động dò trước và
    tự chọn slug rảnh, thân thiện SEO hơn là chặn lại bắt người dùng tự sửa.
    """
    base = slugify(text)
    candidate = base
    suffix = 2
    while True:
        query = select(model.id).where(model.slug == candidate)
        if exclude_id is not None:
            query = query.where(model.id != exclude_id)
        if db.execute(query).scalar_one_or_none() is None:
            return candidate
        candidate = f"{base}-{suffix}"
        suffix += 1
