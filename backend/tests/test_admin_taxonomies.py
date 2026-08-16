import pytest

from app.core.security import hash_password
from app.models import Company, IndustrialPark, Job, JobCategory, Province, User
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
def base(db_session):
    province = Province(code="30", name="Hải Dương", type="Tỉnh", is_active=True)
    db_session.add(province)
    db_session.flush()

    park = IndustrialPark(slug="dai-an", name="KCN Đại An", province_code="30")
    category = JobCategory(slug="sx", name="Sản xuất – Lắp ráp", sort_order=1, is_active=True)
    company = Company(slug="cong-ty-test", name="Công ty Test", is_partner=True)
    db_session.add_all([park, category, company])
    db_session.commit()
    return {"province": province, "park": park, "category": category, "company": company}


def _make_job(db_session, base, **overrides) -> Job:
    job = Job(
        slug=overrides.pop("slug", "cong-nhan-test"),
        title="Công nhân test",
        company_id=base["company"].id,
        category_id=base["category"].id,
        industrial_park_id=base["park"].id,
        province_code=base["province"].code,
        quantity=1,
        status=JobStatus.DRAFT,
        **overrides,
    )
    db_session.add(job)
    db_session.commit()
    return job


# ---------------------------------------------------------------------------
# RBAC — 3 role × 3 danh mục (list/create/delete)
# ---------------------------------------------------------------------------

ENDPOINTS = {
    "job-categories": {
        "list": "/api/admin/job-categories",
        "payload": lambda: {"name": "Ngành nghề RBAC test"},
    },
    "industrial-parks": {
        "list": "/api/admin/industrial-parks",
        "payload": lambda: {"name": "KCN RBAC test", "province_code": "30"},
    },
    "provinces": {
        "list": "/api/admin/provinces",
        "payload": lambda: {"code": "99", "name": "Tỉnh RBAC test", "type": "Tỉnh"},
    },
}


@pytest.mark.parametrize("resource", ["job-categories", "industrial-parks", "provinces"])
def test_staff_can_list_but_not_create(client, users, base, resource):
    _login(client, users["staff"])
    ep = ENDPOINTS[resource]
    assert client.get(ep["list"]).status_code == 200

    resp = client.post(ep["list"], json=ep["payload"]())
    assert resp.status_code == 403


@pytest.mark.parametrize("resource", ["job-categories", "industrial-parks", "provinces"])
def test_manager_can_create_but_not_delete(client, users, base, resource):
    ep = ENDPOINTS[resource]
    _login(client, users["manager"])
    created = client.post(ep["list"], json=ep["payload"]())
    assert created.status_code == 201
    body = created.json()
    item_id = body.get("id") or body.get("code")

    resp = client.delete(f"{ep['list']}/{item_id}")
    assert resp.status_code == 403


@pytest.mark.parametrize("resource", ["job-categories", "industrial-parks", "provinces"])
def test_admin_can_create_and_delete(client, users, base, resource):
    ep = ENDPOINTS[resource]
    _login(client, users["admin"])
    created = client.post(ep["list"], json=ep["payload"]())
    assert created.status_code == 201
    body = created.json()
    item_id = body.get("id") or body.get("code")

    resp = client.delete(f"{ep['list']}/{item_id}")
    assert resp.status_code == 204


# ---------------------------------------------------------------------------
# 409 khi có tham chiếu / xoá được khi không tham chiếu
# ---------------------------------------------------------------------------


def test_delete_job_category_with_job_returns_409_with_count(client, users, base, db_session):
    _make_job(db_session, base)
    _login(client, users["admin"])
    resp = client.delete(f"/api/admin/job-categories/{base['category'].id}")
    assert resp.status_code == 409
    assert "1" in resp.json()["error"]["message"]


def test_delete_job_category_without_job_succeeds(client, users, base):
    _login(client, users["admin"])
    resp = client.delete(f"/api/admin/job-categories/{base['category'].id}")
    assert resp.status_code == 204


def test_delete_industrial_park_with_job_returns_409(client, users, base, db_session):
    _make_job(db_session, base)
    _login(client, users["admin"])
    resp = client.delete(f"/api/admin/industrial-parks/{base['park'].id}")
    assert resp.status_code == 409
    assert "1" in resp.json()["error"]["message"]


def test_delete_province_with_job_returns_409_mentions_job_count(client, users, base, db_session):
    _make_job(db_session, base)
    _login(client, users["admin"])
    resp = client.delete(f"/api/admin/provinces/{base['province'].code}")
    assert resp.status_code == 409
    assert "tin tuyển dụng" in resp.json()["error"]["message"]


def test_delete_province_with_industrial_park_returns_409_mentions_park_count(
    client, users, base
):
    # Không có job nào, nhưng industrial_parks.province_code vẫn tham chiếu tới.
    _login(client, users["admin"])
    resp = client.delete(f"/api/admin/provinces/{base['province'].code}")
    assert resp.status_code == 409
    assert "khu công nghiệp" in resp.json()["error"]["message"]


# ---------------------------------------------------------------------------
# Slug dài bị cắt đúng (job_categories.slug là String(30))
# ---------------------------------------------------------------------------


def test_job_category_slug_truncated_to_column_limit(client, users):
    _login(client, users["admin"])
    long_name = "Ngành nghề có tên rất là dài để kiểm tra việc cắt slug đúng giới hạn cột"
    resp = client.post("/api/admin/job-categories", json={"name": long_name})
    assert resp.status_code == 201
    assert len(resp.json()["slug"]) <= 30


def test_job_category_slug_collision_still_fits_column_limit(client, users, db_session):
    _login(client, users["admin"])
    long_name = "Ngành nghề có tên rất là dài để kiểm tra việc cắt slug đúng giới hạn cột"
    first = client.post("/api/admin/job-categories", json={"name": long_name})
    second = client.post("/api/admin/job-categories", json={"name": long_name})
    assert first.status_code == second.status_code == 201
    assert first.json()["slug"] != second.json()["slug"]
    assert len(second.json()["slug"]) <= 30


# ---------------------------------------------------------------------------
# is_active=false biến mất khỏi API công khai
# ---------------------------------------------------------------------------


def test_inactive_job_category_hidden_from_public_api(client, users, base):
    _login(client, users["admin"])
    resp = client.patch(
        f"/api/admin/job-categories/{base['category'].id}", json={"is_active": False}
    )
    assert resp.status_code == 200

    public = client.get("/api/job-categories").json()
    assert base["category"].slug not in [c["slug"] for c in public]


def test_inactive_province_hidden_from_public_api(client, users, base):
    _login(client, users["admin"])
    resp = client.patch(f"/api/admin/provinces/{base['province'].code}", json={"is_active": False})
    assert resp.status_code == 200

    public = client.get("/api/provinces").json()
    assert base["province"].code not in [p["code"] for p in public]


# ---------------------------------------------------------------------------
# Slug/mã bất biến sau khi tạo
# ---------------------------------------------------------------------------


def test_update_job_category_does_not_change_slug(client, users, base):
    _login(client, users["admin"])
    resp = client.patch(
        f"/api/admin/job-categories/{base['category'].id}", json={"name": "Tên đã đổi"}
    )
    assert resp.status_code == 200
    assert resp.json()["slug"] == base["category"].slug
    assert resp.json()["name"] == "Tên đã đổi"


def test_create_province_with_duplicate_code_returns_409(client, users, base):
    _login(client, users["admin"])
    resp = client.post(
        "/api/admin/provinces", json={"code": "30", "name": "Trùng mã", "type": "Tỉnh"}
    )
    assert resp.status_code == 409
