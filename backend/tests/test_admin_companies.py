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


def _company_payload(**overrides) -> dict:
    payload = {"name": "Công ty TNHH Điện tử Việt Phát"}
    payload.update(overrides)
    return payload


def test_staff_can_list_companies_but_not_create(client, users):
    _login(client, users["staff"])
    assert client.get("/api/admin/companies").status_code == 200

    resp = client.post("/api/admin/companies", json=_company_payload())
    assert resp.status_code == 403


def test_manager_can_create_company(client, users):
    _login(client, users["manager"])
    resp = client.post("/api/admin/companies", json=_company_payload())
    assert resp.status_code == 201
    assert resp.json()["slug"] == "cong-ty-tnhh-dien-tu-viet-phat"


def test_manager_forbidden_to_delete_company(client, users):
    _login(client, users["admin"])
    created = client.post("/api/admin/companies", json=_company_payload()).json()

    _login(client, users["manager"])
    resp = client.delete(f"/api/admin/companies/{created['id']}")
    assert resp.status_code == 403


def test_admin_can_delete_company(client, users):
    _login(client, users["admin"])
    created = client.post("/api/admin/companies", json=_company_payload()).json()
    resp = client.delete(f"/api/admin/companies/{created['id']}")
    assert resp.status_code == 204


def test_create_company_writes_audit_log(client, users, db_session):
    _login(client, users["admin"])
    created = client.post("/api/admin/companies", json=_company_payload()).json()

    log = db_session.query(AuditLog).filter_by(
        entity_type="company", entity_id=created["id"]
    ).one()
    assert log.action == "create"
    assert log.user_id == users["admin"].id


def test_update_company_does_not_change_slug(client, users):
    _login(client, users["admin"])
    created = client.post("/api/admin/companies", json=_company_payload()).json()
    updated = client.patch(
        f"/api/admin/companies/{created['id']}", json={"name": "Tên công ty đã đổi"}
    ).json()
    assert updated["slug"] == created["slug"]
    assert updated["name"] == "Tên công ty đã đổi"
