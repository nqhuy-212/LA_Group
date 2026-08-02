import hashlib
import secrets
from datetime import UTC, datetime, timedelta

import bcrypt
import jwt

from app.core.config import settings

MAX_PASSWORD_BYTES = 72  # D2: bcrypt cắt ở 72 byte — chặn ở đây + ở Pydantic schema (hàng rào kép)


class InvalidTokenError(Exception):
    pass


def hash_password(password: str) -> str:
    password_bytes = password.encode("utf-8")
    if len(password_bytes) > MAX_PASSWORD_BYTES:
        raise ValueError(f"Mật khẩu vượt quá {MAX_PASSWORD_BYTES} byte")
    return bcrypt.hashpw(password_bytes, bcrypt.gensalt()).decode("utf-8")


def verify_password(password: str, hashed_password: str) -> bool:
    try:
        return bcrypt.checkpw(password.encode("utf-8"), hashed_password.encode("utf-8"))
    except ValueError:
        # Mật khẩu >72 byte hoặc hash lưu trong DB sai định dạng — coi như không khớp,
        # không raise để tránh lộ khác biệt hành vi giữa 2 trường hợp lỗi.
        return False


def create_access_token(user_id: int, role: str) -> str:
    now = datetime.now(UTC)
    payload = {
        "sub": str(user_id),
        "role": role,
        "type": "access",
        "iat": now,
        "exp": now + timedelta(minutes=settings.access_token_expire_minutes),
    }
    return jwt.encode(payload, settings.jwt_secret_key, algorithm=settings.jwt_algorithm)


def decode_token(token: str) -> dict:
    try:
        return jwt.decode(token, settings.jwt_secret_key, algorithms=[settings.jwt_algorithm])
    except jwt.PyJWTError as exc:
        raise InvalidTokenError(str(exc)) from exc


def generate_refresh_token() -> str:
    return secrets.token_urlsafe(48)


def hash_refresh_token(raw_token: str) -> str:
    # Refresh token là chuỗi ngẫu nhiên ≥48 byte entropy (không phải mật khẩu người dùng
    # tự chọn) nên hash nhanh SHA-256 là đủ — không cần bcrypt (chỉ tổ chậm tra cứu DB
    # mà không tăng thêm bảo mật thực chất cho một secret vốn đã không thể brute-force).
    return hashlib.sha256(raw_token.encode("utf-8")).hexdigest()
