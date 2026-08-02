from slowapi import Limiter
from slowapi.util import get_remote_address
from starlette.requests import Request

from app.core.config import settings


def get_client_ip(request: Request) -> str:
    """Địa chỉ IP dùng làm khoá rate-limit.

    Cạm bẫy (xem docs/PLAN.md PHASE 2): sau khi qua Nginx ở production,
    `request.client.host` luôn là IP nội bộ của Nginx, không phải IP khách hàng thật
    — phải đọc IP thật từ header `X-Forwarded-For` do chính Nginx set. Nhưng CHỈ được
    tin header này khi chắc chắn request đi qua Nginx: theo kiến trúc đã chốt ở
    tech-stack.md, FastAPI không bao giờ được expose trực tiếp ra ngoài (chỉ giao tiếp
    qua Docker network nội bộ), nên ở `environment == "prod"` header này đáng tin.
    Ở dev/staging (chưa có Nginx đứng trước), một client bất kỳ có thể tự set header
    này để giả IP — vì vậy KHÔNG được tin, phải dùng thẳng IP kết nối trực tiếp.
    """
    if settings.environment == "prod":
        forwarded_for = request.headers.get("x-forwarded-for")
        if forwarded_for:
            return forwarded_for.split(",")[0].strip()
    return get_remote_address(request)


limiter = Limiter(key_func=get_client_ip)
