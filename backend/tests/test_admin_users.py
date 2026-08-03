from app.core.security import hash_password
from app.models import User
from app.models.enums import UserRole


def test_list_users_requires_auth(client):
    resp = client.get("/api/admin/users")
    assert resp.status_code == 401


def test_staff_can_list_active_users_only(client, db_session):
    active = User(
        email="active@lahr.vn", hashed_password=hash_password("MatKhauTester123"),
        role=UserRole.STAFF,
    )
    inactive = User(
        email="inactive@lahr.vn", hashed_password=hash_password("MatKhauTester123"),
        role=UserRole.STAFF, is_active=False,
    )
    db_session.add_all([active, inactive])
    db_session.commit()
    client.post("/api/auth/login", json={"email": active.email, "password": "MatKhauTester123"})

    resp = client.get("/api/admin/users")
    assert resp.status_code == 200
    emails = {u["email"] for u in resp.json()}
    assert "active@lahr.vn" in emails
    assert "inactive@lahr.vn" not in emails
