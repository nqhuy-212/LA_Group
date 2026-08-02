import pytest

from app.core.security import hash_password
from app.models import AuditLog, User
from app.models.enums import UserRole

PASSWORD = "MatKhauDungCuaTester123"


def _make_user(db_session, role: UserRole, email: str) -> User:
    user = User(email=email, hashed_password=hash_password(PASSWORD), role=role)
    db_session.add(user)
    db_session.commit()
    db_session.refresh(user)
    return user


@pytest.fixture
def users(db_session) -> dict[str, User]:
    return {
        "admin": _make_user(db_session, UserRole.ADMIN, "admin@lahr.vn"),
        "manager": _make_user(db_session, UserRole.MANAGER, "manager@lahr.vn"),
        "staff": _make_user(db_session, UserRole.STAFF, "staff@lahr.vn"),
    }


def _login(client, user: User) -> None:
    resp = client.post("/api/auth/login", json={"email": user.email, "password": PASSWORD})
    assert resp.status_code == 200


def _post_payload(**overrides) -> dict:
    payload = {
        "title": "Chính sách bảo hiểm 2026",
        "type": "policy",
        "excerpt": "Tóm tắt chính sách",
        "content": "Nội dung đầy đủ",
    }
    payload.update(overrides)
    return payload


def test_create_post_without_cookie_returns_401(client):
    resp = client.post("/api/admin/posts", json=_post_payload())
    assert resp.status_code == 401


def test_staff_can_create_post(client, users):
    _login(client, users["staff"])
    resp = client.post("/api/admin/posts", json=_post_payload())
    assert resp.status_code == 201
    body = resp.json()
    assert body["slug"] == "chinh-sach-bao-hiem-2026"
    assert body["status"] == "draft"


def test_staff_forbidden_to_delete_post(client, users):
    _login(client, users["admin"])
    created = client.post("/api/admin/posts", json=_post_payload()).json()

    _login(client, users["staff"])
    resp = client.delete(f"/api/admin/posts/{created['id']}")
    assert resp.status_code == 403


def test_admin_can_delete_post(client, users):
    _login(client, users["admin"])
    created = client.post("/api/admin/posts", json=_post_payload()).json()
    resp = client.delete(f"/api/admin/posts/{created['id']}")
    assert resp.status_code == 204


def test_create_post_writes_audit_log(client, users, db_session):
    _login(client, users["staff"])
    created = client.post("/api/admin/posts", json=_post_payload()).json()

    log = db_session.query(AuditLog).filter_by(entity_type="post", entity_id=created["id"]).one()
    assert log.action == "create"
    assert log.user_id == users["staff"].id


def test_slug_immutable_after_publish(client, users):
    _login(client, users["admin"])
    created = client.post("/api/admin/posts", json=_post_payload(status="published")).json()
    assert created["published_at"] is not None

    updated = client.patch(
        f"/api/admin/posts/{created['id']}", json={"title": "Tiêu đề đã đổi hoàn toàn"}
    ).json()
    assert updated["slug"] == created["slug"]


def test_invalid_post_type_rejected(client, users):
    _login(client, users["admin"])
    resp = client.post("/api/admin/posts", json=_post_payload(type="khong-hop-le"))
    assert resp.status_code == 422
