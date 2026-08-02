from fastapi import Cookie, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.security import InvalidTokenError, decode_token
from app.db.session import get_db
from app.models import User
from app.models.enums import UserRole

ACCESS_TOKEN_COOKIE = "access_token"


def get_current_user(
    access_token: str | None = Cookie(default=None, alias=ACCESS_TOKEN_COOKIE),
    db: Session = Depends(get_db),
) -> User:
    if access_token is None:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Chưa đăng nhập")
    try:
        payload = decode_token(access_token)
    except InvalidTokenError as exc:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail="Phiên đăng nhập không hợp lệ"
        ) from exc
    if payload.get("type") != "access":
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Token không hợp lệ")

    user = db.get(User, int(payload["sub"]))
    if user is None or not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail="Tài khoản không hợp lệ"
        )
    return user


def require_roles(*roles: UserRole):
    def dependency(user: User = Depends(get_current_user)) -> User:
        if user.role not in roles:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Không đủ quyền")
        return user

    return dependency
