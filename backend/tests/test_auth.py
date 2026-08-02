from datetime import UTC, datetime, timedelta

import pytest
from fastapi import HTTPException
from sqlalchemy import select

from app.api.deps import require_roles
from app.core.security import hash_password, hash_refresh_token
from app.models import RefreshToken, User
from app.models.enums import UserRole

PASSWORD = "MatKhauDungCuaTester123"


@pytest.fixture
def user(db_session):
    u = User(email="tester@lahr.vn", hashed_password=hash_password(PASSWORD), role=UserRole.STAFF)
    db_session.add(u)
    db_session.commit()
    db_session.refresh(u)
    return u


def _cookie_flags(resp, name: str) -> str:
    for raw in resp.headers.get_list("set-cookie"):
        if raw.startswith(f"{name}="):
            return raw
    raise AssertionError(f"Không thấy Set-Cookie cho {name}")


def test_login_success_sets_cookies_and_body_has_no_token(client, user):
    resp = client.post("/api/auth/login", json={"email": user.email, "password": PASSWORD})
    assert resp.status_code == 200
    assert resp.json() == {"ok": True}
    assert "access_token" in resp.cookies
    assert "refresh_token" in resp.cookies


def test_login_cookies_have_httponly_secure_samesite_strict(client, user):
    resp = client.post("/api/auth/login", json={"email": user.email, "password": PASSWORD})
    for name in ("access_token", "refresh_token"):
        raw = _cookie_flags(resp, name).lower()
        assert "httponly" in raw
        assert "secure" in raw
        assert "samesite=strict" in raw


def test_login_wrong_password_and_unknown_email_return_identical_error(client, user):
    wrong_password = client.post(
        "/api/auth/login", json={"email": user.email, "password": "sai-mat-khau"}
    )
    unknown_email = client.post(
        "/api/auth/login", json={"email": "khong-ton-tai@lahr.vn", "password": "sai-mat-khau"}
    )
    assert wrong_password.status_code == unknown_email.status_code == 401
    assert wrong_password.json() == unknown_email.json()


def test_login_locks_account_after_5_failures_6th_attempt_blocked(client, user, db_session):
    for _ in range(5):
        resp = client.post(
            "/api/auth/login", json={"email": user.email, "password": "sai-mat-khau"}
        )
        assert resp.status_code == 401

    db_session.refresh(user)
    assert user.failed_login_count == 5
    assert user.locked_until is not None

    # Lần thứ 6 dùng ĐÚNG mật khẩu vẫn phải bị chặn vì tài khoản đang khoá.
    resp = client.post("/api/auth/login", json={"email": user.email, "password": PASSWORD})
    assert resp.status_code == 401
    assert "access_token" not in resp.cookies


def test_ip_rate_limit_blocks_after_threshold(client):
    responses = [
        client.post(
            "/api/auth/login", json={"email": f"nobody{i}@lahr.vn", "password": "khong-quan-trong"}
        )
        for i in range(11)
    ]
    assert all(r.status_code == 401 for r in responses[:10])
    assert responses[10].status_code == 429


def test_me_requires_authentication(client):
    resp = client.get("/api/auth/me")
    assert resp.status_code == 401


def test_me_returns_current_user_after_login(client, user):
    client.post("/api/auth/login", json={"email": user.email, "password": PASSWORD})
    resp = client.get("/api/auth/me")
    assert resp.status_code == 200
    body = resp.json()
    assert body == {"id": user.id, "email": user.email, "role": "staff"}


def test_refresh_rotates_tokens_and_revokes_old_one(client, user, db_session):
    login_resp = client.post("/api/auth/login", json={"email": user.email, "password": PASSWORD})
    old_refresh_raw = login_resp.cookies["refresh_token"]

    refresh_resp = client.post("/api/auth/refresh")
    assert refresh_resp.status_code == 200
    new_refresh_raw = refresh_resp.cookies["refresh_token"]
    assert new_refresh_raw != old_refresh_raw

    old_row = db_session.execute(
        select(RefreshToken).filter_by(token_hash=hash_refresh_token(old_refresh_raw))
    ).scalar_one()
    assert old_row.revoked_at is not None


def test_refresh_reuse_of_revoked_token_revokes_all_sessions(client, user, db_session):
    login_resp = client.post("/api/auth/login", json={"email": user.email, "password": PASSWORD})
    stolen_old_refresh = login_resp.cookies["refresh_token"]

    # Refresh hợp lệ 1 lần -> stolen_old_refresh giờ đã bị revoke, có 1 token mới đang sống.
    client.post("/api/auth/refresh")

    # Kẻ tấn công phát lại token cũ đã bị revoke.
    client.cookies.set("refresh_token", stolen_old_refresh)
    reuse_resp = client.post("/api/auth/refresh")
    assert reuse_resp.status_code == 401

    # Toàn bộ refresh token của user này (kể cả token mới vừa cấp ở bước refresh hợp lệ)
    # phải bị revoke hết — coi như phiên đăng nhập đã bị xâm phạm.
    remaining_active = db_session.execute(
        select(RefreshToken).filter_by(user_id=user.id, revoked_at=None)
    ).scalars().all()
    assert remaining_active == []


def test_logout_clears_cookies_and_revokes_refresh_token(client, user, db_session):
    login_resp = client.post("/api/auth/login", json={"email": user.email, "password": PASSWORD})
    refresh_raw = login_resp.cookies["refresh_token"]

    logout_resp = client.post("/api/auth/logout")
    assert logout_resp.status_code == 200

    row = db_session.execute(
        select(RefreshToken).filter_by(token_hash=hash_refresh_token(refresh_raw))
    ).scalar_one()
    assert row.revoked_at is not None

    me_resp = client.get("/api/auth/me")
    assert me_resp.status_code == 401


def test_require_roles_dependency_allows_and_blocks_by_role():
    admin_user = User(id=1, email="a@lahr.vn", hashed_password="x", role=UserRole.ADMIN)
    staff_user = User(id=2, email="b@lahr.vn", hashed_password="x", role=UserRole.STAFF)

    only_admin = require_roles(UserRole.ADMIN)
    assert only_admin(user=admin_user) is admin_user
    with pytest.raises(HTTPException) as exc_info:
        only_admin(user=staff_user)
    assert exc_info.value.status_code == 403


def test_expired_refresh_token_rejected(client, user, db_session):
    login_resp = client.post("/api/auth/login", json={"email": user.email, "password": PASSWORD})
    refresh_raw = login_resp.cookies["refresh_token"]

    row = db_session.execute(
        select(RefreshToken).filter_by(token_hash=hash_refresh_token(refresh_raw))
    ).scalar_one()
    row.expires_at = datetime.now(UTC) - timedelta(days=1)
    db_session.commit()

    resp = client.post("/api/auth/refresh")
    assert resp.status_code == 401
