from datetime import UTC, datetime, timedelta

from fastapi import APIRouter, Cookie, Depends, HTTPException, Request, Response, status
from sqlalchemy import select, update
from sqlalchemy.orm import Session

from app.api.deps import ACCESS_TOKEN_COOKIE, get_current_user
from app.core.config import settings
from app.core.rate_limit import limiter
from app.core.security import (
    create_access_token,
    generate_refresh_token,
    hash_password,
    hash_refresh_token,
    verify_password,
)
from app.db.session import get_db
from app.models import RefreshToken, User
from app.schemas.auth import LoginRequest, MeResponse

router = APIRouter(prefix="/api/auth", tags=["auth"])

REFRESH_TOKEN_COOKIE = "refresh_token"
# Cờ gợi ý cho FRONTEND, cố ý KHÔNG httpOnly — chỉ chứa "1", không chứa token.
# Mục đích: TopBar site công khai đổi được nhãn "Đăng nhập" ↔ "Trang quản trị" mà
# KHÔNG phải gọi `cookies()` ở Server Component — đọc cookie ở đó sẽ ép cả nhánh
# public thành dynamic, mất static prerender của trang chủ (trả giá hiệu năng cho
# hàng nghìn khách vãng lai chỉ để phục vụ vài nhân viên nội bộ).
# Không dùng cờ này để phân quyền: hàng rào thật vẫn là JWT ở `get_current_user`.
SESSION_HINT_COOKIE = "has_session"
# Hai lớp chặn brute-force độc lập, ngưỡng khác nhau có chủ đích để không che lấp
# nhau: rate limit ở decorator phía trên chặn 1 IP dò nhiều email khác nhau; còn 2
# hằng số dưới đây khoá RIÊNG một email cụ thể dù request đến từ IP nào.
LOGIN_FAILURE_LIMIT = 5
LOGIN_LOCKOUT_MINUTES = 15
GENERIC_LOGIN_ERROR = "Email hoặc mật khẩu không đúng"

# Hash bcrypt thật (tính 1 lần lúc import) nhưng không ai biết plaintext — dùng để
# verify khi email không tồn tại, giữ thời gian phản hồi giống hệt trường hợp email
# có tồn tại (chống dò email qua timing side-channel).
_DUMMY_PASSWORD_HASH = hash_password("mat-khau-gia-khong-ai-doan-duoc-000000")


def _set_auth_cookies(response: Response, access_token: str, refresh_token: str) -> None:
    response.set_cookie(
        key=ACCESS_TOKEN_COOKIE,
        value=access_token,
        httponly=True,
        secure=True,
        samesite="strict",
        max_age=settings.access_token_expire_minutes * 60,
        path="/",
    )
    response.set_cookie(
        key=REFRESH_TOKEN_COOKIE,
        value=refresh_token,
        httponly=True,
        secure=True,
        samesite="strict",
        max_age=settings.refresh_token_expire_days * 24 * 3600,
        path="/api/auth",
    )
    response.set_cookie(
        key=SESSION_HINT_COOKIE,
        value="1",
        httponly=False,
        secure=True,
        samesite="strict",
        max_age=settings.refresh_token_expire_days * 24 * 3600,
        path="/",
    )


def _issue_tokens(response: Response, db: Session, user: User) -> None:
    access_token = create_access_token(user.id, user.role.value)
    raw_refresh = generate_refresh_token()
    db.add(
        RefreshToken(
            user_id=user.id,
            token_hash=hash_refresh_token(raw_refresh),
            expires_at=datetime.now(UTC)
            + timedelta(days=settings.refresh_token_expire_days),
        )
    )
    db.commit()
    _set_auth_cookies(response, access_token, raw_refresh)


@router.post("/login")
@limiter.limit("10/15minutes")  # chặn spray nhiều email từ 1 IP; khoá riêng từng email ở dưới
def login(
    request: Request,
    payload: LoginRequest,
    response: Response,
    db: Session = Depends(get_db),
) -> dict:
    user = db.execute(select(User).filter_by(email=payload.email)).scalar_one_or_none()
    now = datetime.now(UTC)

    if user is not None and user.locked_until is not None and user.locked_until > now:
        verify_password(payload.password, _DUMMY_PASSWORD_HASH)  # giữ thời gian phản hồi ổn định
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail=GENERIC_LOGIN_ERROR)

    hash_to_check = user.hashed_password if user is not None else _DUMMY_PASSWORD_HASH
    password_ok = verify_password(payload.password, hash_to_check)

    if user is None or not password_ok or not user.is_active:
        if user is not None:
            user.failed_login_count += 1
            if user.failed_login_count >= LOGIN_FAILURE_LIMIT:
                user.locked_until = now + timedelta(minutes=LOGIN_LOCKOUT_MINUTES)
            db.commit()
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail=GENERIC_LOGIN_ERROR)

    user.failed_login_count = 0
    user.locked_until = None
    db.commit()

    _issue_tokens(response, db, user)
    return {"ok": True}


@router.post("/refresh")
def refresh(
    response: Response,
    db: Session = Depends(get_db),
    refresh_token: str | None = Cookie(default=None, alias=REFRESH_TOKEN_COOKIE),
) -> dict:
    if refresh_token is None:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Thiếu refresh token")

    token_hash = hash_refresh_token(refresh_token)
    row = db.execute(select(RefreshToken).filter_by(token_hash=token_hash)).scalar_one_or_none()
    if row is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail="Refresh token không hợp lệ"
        )

    now = datetime.now(UTC)

    if row.revoked_at is not None:
        # Token đã bị revoke mà vẫn bị dùng lại => dấu hiệu bị đánh cắp — revoke
        # toàn bộ session còn hiệu lực của user này.
        db.execute(
            update(RefreshToken)
            .where(RefreshToken.user_id == row.user_id, RefreshToken.revoked_at.is_(None))
            .values(revoked_at=now)
        )
        db.commit()
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail="Phiên đăng nhập đã bị thu hồi"
        )

    if row.expires_at < now:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail="Refresh token đã hết hạn"
        )

    user = db.get(User, row.user_id)
    if user is None or not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail="Tài khoản không hợp lệ"
        )

    row.revoked_at = now
    db.commit()

    _issue_tokens(response, db, user)
    return {"ok": True}


@router.post("/logout")
def logout(
    response: Response,
    db: Session = Depends(get_db),
    refresh_token: str | None = Cookie(default=None, alias=REFRESH_TOKEN_COOKIE),
) -> dict:
    if refresh_token:
        token_hash = hash_refresh_token(refresh_token)
        row = db.execute(select(RefreshToken).filter_by(token_hash=token_hash)).scalar_one_or_none()
        if row is not None and row.revoked_at is None:
            row.revoked_at = datetime.now(UTC)
            db.commit()

    response.delete_cookie(ACCESS_TOKEN_COOKIE, path="/")
    response.delete_cookie(REFRESH_TOKEN_COOKIE, path="/api/auth")
    response.delete_cookie(SESSION_HINT_COOKIE, path="/")
    return {"ok": True}


@router.get("/me", response_model=MeResponse)
def me(current_user: User = Depends(get_current_user)) -> MeResponse:
    return MeResponse(id=current_user.id, email=current_user.email, role=current_user.role.value)
