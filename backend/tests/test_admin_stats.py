from datetime import UTC, date, datetime, timedelta

import pytest

from app.core.security import hash_password
from app.models import (
    AddressMapping,
    Application,
    Company,
    IndustrialPark,
    Job,
    JobCategory,
    Province,
    User,
)
from app.models.enums import ApplicationStatus, JobStatus, UserRole


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

    job = Job(
        slug="cong-nhan-test",
        title="Công nhân kiểm thử",
        company_id=company.id,
        category_id=category.id,
        industrial_park_id=park.id,
        province_code="30",
        status=JobStatus.PUBLISHED,
        published_at=datetime.now(UTC),
        quantity=3,
    )
    db_session.add(job)
    db_session.commit()
    db_session.refresh(job)
    return {"province": province, "company": company, "job": job, "park": park}


def _login(client, db_session, role: UserRole, email: str) -> User:
    user = User(email=email, hashed_password=hash_password("MatKhauTester123"), role=role)
    db_session.add(user)
    db_session.commit()
    resp = client.post("/api/auth/login", json={"email": email, "password": "MatKhauTester123"})
    assert resp.status_code == 200
    return user


def _make_application(db_session, *, ref: str, **overrides) -> Application:
    defaults = dict(
        reference_code=ref,
        full_name="Nguyễn Văn A",
        phone="0912345678",
        status=ApplicationStatus.NEW,
    )
    defaults.update(overrides)
    application = Application(**defaults)
    db_session.add(application)
    db_session.commit()
    return application


def test_stats_endpoints_require_auth(client):
    for path in (
        "/api/admin/stats/overview",
        "/api/admin/stats/by-province",
        "/api/admin/stats/by-age-group",
        "/api/admin/stats/by-industrial-park",
    ):
        assert client.get(path).status_code == 401


def test_staff_can_view_overview(client, db_session, taxonomy):
    _make_application(db_session, ref="UV000001", job_id=taxonomy["job"].id)
    _make_application(
        db_session, ref="UV000002", job_id=taxonomy["job"].id, status=ApplicationStatus.HIRED
    )
    _login(client, db_session, UserRole.STAFF, "staff-overview@lahr.vn")

    resp = client.get("/api/admin/stats/overview")
    assert resp.status_code == 200
    body = resp.json()
    assert body["total"] == 2
    assert body["by_status"]["new"] == 1
    assert body["by_status"]["hired"] == 1
    assert sum(point["count"] for point in body["series"]) == 2


def test_overview_respects_date_range(client, db_session, taxonomy):
    old = _make_application(db_session, ref="UV000001", job_id=taxonomy["job"].id)
    old.created_at = datetime.now(UTC) - timedelta(days=40)
    db_session.commit()
    _make_application(db_session, ref="UV000002", job_id=taxonomy["job"].id)
    _login(client, db_session, UserRole.ADMIN, "admin-overview-range@lahr.vn")

    today = date.today().isoformat()
    resp = client.get(
        "/api/admin/stats/overview", params={"from": today, "to": today}
    )
    assert resp.status_code == 200
    assert resp.json()["total"] == 1


def test_by_province_rolls_up_old_code_via_address_mapping(client, db_session, taxonomy):
    # applications.province_code có FK tới provinces.code — mã cũ "77" phải tồn tại
    # như một dòng Province (is_active=False) thì mới insert được (xem seed_dev.py).
    db_session.add(
        Province(code="77", name="Đơn vị cũ test", type="Tỉnh", is_active=False)
    )
    db_session.add(
        AddressMapping(
            old_code="77",
            old_name="Đơn vị cũ test",
            new_code="30",
            level="province",
            effective_date=date(2025, 1, 1),
        )
    )
    db_session.commit()

    _make_application(db_session, ref="UV000001", province_code="30")
    _make_application(db_session, ref="UV000002", province_code="77")
    _make_application(db_session, ref="UV000003", province_code=None)
    _login(client, db_session, UserRole.ADMIN, "admin-province@lahr.vn")

    resp = client.get("/api/admin/stats/by-province")
    assert resp.status_code == 200
    rows = {row["province_code"]: row["count"] for row in resp.json()}
    assert rows["30"] == 2  # "30" trực tiếp + "77" (mã cũ) roll-up qua address_mappings
    assert rows[None] == 1


def test_by_age_group_buckets(client, db_session, taxonomy):
    today = date.today()

    def _birth_date(age_years: int) -> date:
        return today.replace(year=today.year - age_years)

    _make_application(db_session, ref="UV000001", birth_date=_birth_date(20))
    _make_application(db_session, ref="UV000002", birth_date=_birth_date(30))
    _make_application(db_session, ref="UV000003", birth_date=_birth_date(40))
    _make_application(db_session, ref="UV000004", birth_date=_birth_date(50))
    _make_application(db_session, ref="UV000005", birth_date=None)
    _login(client, db_session, UserRole.ADMIN, "admin-age@lahr.vn")

    resp = client.get("/api/admin/stats/by-age-group")
    assert resp.status_code == 200
    counts = {row["bucket"]: row["count"] for row in resp.json()}
    assert counts == {
        "18-24": 1,
        "25-34": 1,
        "35-44": 1,
        "45+": 1,
        "unknown": 1,
    }


def test_by_industrial_park_groups_via_job(client, db_session, taxonomy):
    _make_application(db_session, ref="UV000001", job_id=taxonomy["job"].id)
    _make_application(db_session, ref="UV000002")  # không gắn job -> "Không xác định"
    _login(client, db_session, UserRole.ADMIN, "admin-park@lahr.vn")

    resp = client.get("/api/admin/stats/by-industrial-park")
    assert resp.status_code == 200
    rows = {row["industrial_park_slug"]: row["count"] for row in resp.json()}
    assert rows["dai-an"] == 1
    assert rows[None] == 1
