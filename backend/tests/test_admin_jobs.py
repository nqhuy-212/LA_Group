import pytest

from app.core.security import hash_password
from app.models import AuditLog, Company, IndustrialPark, Job, JobCategory, Province, User
from app.models.enums import JobStatus, UserRole

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


@pytest.fixture
def taxonomy(db_session):
    province = Province(code="30", name="Hải Dương", type="Tỉnh", is_active=True)
    db_session.add(province)
    db_session.flush()

    park = IndustrialPark(slug="dai-an", name="KCN Đại An", province_code="30")
    category = JobCategory(slug="sx", name="Sản xuất – Lắp ráp", sort_order=1, is_active=True)
    company = Company(slug="cong-ty-test", name="Công ty Test", is_partner=True)
    db_session.add_all([park, category, company])
    db_session.commit()
    return {"province": province, "park": park, "category": category, "company": company}


def _job_payload(taxonomy, **overrides) -> dict:
    payload = {
        "title": "Công nhân lắp ráp điện tử",
        "company_slug": taxonomy["company"].slug,
        "category_slug": taxonomy["category"].slug,
        "industrial_park_slug": taxonomy["park"].slug,
        "province_code": taxonomy["province"].code,
        "quantity": 5,
    }
    payload.update(overrides)
    return payload


def test_create_job_without_cookie_returns_401(client, taxonomy):
    resp = client.post("/api/admin/jobs", json=_job_payload(taxonomy))
    assert resp.status_code == 401


def test_staff_can_create_job(client, users, taxonomy):
    _login(client, users["staff"])
    resp = client.post("/api/admin/jobs", json=_job_payload(taxonomy))
    assert resp.status_code == 201
    body = resp.json()
    assert body["slug"] == "cong-nhan-lap-rap-dien-tu"
    assert body["status"] == "draft"
    assert body["company_slug"] == taxonomy["company"].slug


def test_staff_forbidden_to_delete_job(client, users, taxonomy):
    _login(client, users["admin"])
    created = client.post("/api/admin/jobs", json=_job_payload(taxonomy)).json()

    _login(client, users["staff"])
    resp = client.delete(f"/api/admin/jobs/{created['id']}")
    assert resp.status_code == 403


def test_manager_can_delete_job(client, users, taxonomy):
    _login(client, users["staff"])
    created = client.post("/api/admin/jobs", json=_job_payload(taxonomy)).json()

    _login(client, users["manager"])
    resp = client.delete(f"/api/admin/jobs/{created['id']}")
    assert resp.status_code == 204


def test_create_job_writes_audit_log(client, users, taxonomy, db_session):
    _login(client, users["admin"])
    created = client.post("/api/admin/jobs", json=_job_payload(taxonomy)).json()

    log = db_session.query(AuditLog).filter_by(entity_type="job", entity_id=created["id"]).one()
    assert log.action == "create"
    assert log.user_id == users["admin"].id


def test_duplicate_title_gets_deduped_slug(client, users, taxonomy):
    _login(client, users["admin"])
    first = client.post("/api/admin/jobs", json=_job_payload(taxonomy)).json()
    second = client.post("/api/admin/jobs", json=_job_payload(taxonomy)).json()
    assert first["slug"] == "cong-nhan-lap-rap-dien-tu"
    assert second["slug"] == "cong-nhan-lap-rap-dien-tu-2"


def test_slug_immutable_after_publish(client, users, taxonomy):
    _login(client, users["admin"])
    created = client.post(
        "/api/admin/jobs", json=_job_payload(taxonomy, status="published")
    ).json()
    assert created["published_at"] is not None

    updated = client.patch(
        f"/api/admin/jobs/{created['id']}", json={"title": "Tên vị trí đã đổi hoàn toàn"}
    ).json()
    assert updated["slug"] == created["slug"]
    assert updated["title"] == "Tên vị trí đã đổi hoàn toàn"


def test_slug_regenerates_while_still_draft(client, users, taxonomy):
    _login(client, users["admin"])
    created = client.post("/api/admin/jobs", json=_job_payload(taxonomy)).json()
    assert created["status"] == "draft"

    updated = client.patch(
        f"/api/admin/jobs/{created['id']}", json={"title": "Tên vị trí mới hoàn toàn"}
    ).json()
    assert updated["slug"] != created["slug"]
    assert updated["slug"].startswith("ten-vi-tri-moi-hoan-toan")


def test_create_job_with_unknown_company_slug_returns_422(client, users, taxonomy):
    _login(client, users["admin"])
    resp = client.post(
        "/api/admin/jobs", json=_job_payload(taxonomy, company_slug="khong-ton-tai")
    )
    assert resp.status_code == 422


def test_salary_max_less_than_min_rejected(client, users, taxonomy):
    _login(client, users["admin"])
    resp = client.post(
        "/api/admin/jobs",
        json=_job_payload(taxonomy, salary_min=10_000_000, salary_max=5_000_000),
    )
    assert resp.status_code == 422


def test_admin_list_includes_draft_jobs(client, users, taxonomy, db_session):
    job = Job(
        slug="tin-nhap",
        title="Tin nháp",
        company_id=taxonomy["company"].id,
        category_id=taxonomy["category"].id,
        province_code=taxonomy["province"].code,
        status=JobStatus.DRAFT,
    )
    db_session.add(job)
    db_session.commit()

    _login(client, users["staff"])
    resp = client.get("/api/admin/jobs")
    assert resp.status_code == 200
    slugs = [item["slug"] for item in resp.json()["items"]]
    assert "tin-nhap" in slugs
