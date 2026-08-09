"""Logic chống spam dùng chung giữa `POST /api/applications` và `POST /api/leads`
— cả hai endpoint đều ghi vào bảng `applications`, nên dùng chung ngưỡng/hàm đếm
để giới hạn spam cộng dồn đúng theo số điện thoại, không đồng bộ 2 nơi (xem
CLAUDE.md §Quyết định kiến trúc, endpoint /api/leads tách riêng khỏi /api/applications).
"""

from datetime import UTC, datetime, timedelta

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models import Application

# D10: anti-spam bằng honeypot + timing, không dùng captcha ở MVP (chỉ thêm khi bị
# spam thật). Bot điền form tự động thường: (a) tự điền cả field ẩn, (b) submit gần
# như tức thời sau khi trang render — người thật luôn mất vài giây đọc + gõ.
MIN_HUMAN_ELAPSED_MS = 2000
PHONE_DAILY_LIMIT = 10


def is_bot(honeypot: str, form_rendered_at: str) -> bool:
    if honeypot.strip():
        return True
    try:
        rendered_at = datetime.fromisoformat(form_rendered_at.replace("Z", "+00:00"))
    except ValueError:
        return True  # field bị giả mạo/thiếu — coi như đáng ngờ, chặn cho an toàn
    elapsed_ms = (datetime.now(UTC) - rendered_at).total_seconds() * 1000
    return elapsed_ms < MIN_HUMAN_ELAPSED_MS


def count_recent_submissions_by_phone(db: Session, phone: str, *, hours: int = 24) -> int:
    since = datetime.now(UTC) - timedelta(hours=hours)
    return len(
        db.execute(
            select(Application.id).where(
                Application.phone == phone,
                Application.created_at >= since,
            )
        ).scalars().all()
    )
