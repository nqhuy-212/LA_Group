import secrets

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models import Application


def generate_reference_code(db: Session) -> str:
    """Mã hồ sơ ứng viên tự nhìn thấy được (khác `id` nội bộ) — random, không đoán
    được thứ tự/số lượng đơn đã nộp. Lặp dò trùng cho chắc dù xác suất đụng độ với
    8 hex char là rất nhỏ (khớp `applications.reference_code` unique)."""
    while True:
        candidate = "UV" + secrets.token_hex(4).upper()
        exists = db.execute(
            select(Application.id).where(Application.reference_code == candidate)
        ).scalar_one_or_none()
        if exists is None:
            return candidate
