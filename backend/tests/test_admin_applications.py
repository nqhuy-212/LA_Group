from datetime import UTC, datetime, timedelta

import pytest

from app.core.security import hash_password
from app.models import (
    Application,
    AuditLog,
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


def _make_application(db_session, job, *, ref: str, **overrides) -> Application:
    defaults = dict(
        reference_code=ref,
        job_id=job.id if job else None,
        full_name="Nguyễn Văn A",
        phone="0912345678",
        status=ApplicationStatus.NEW,
    )
    defaults.update(overrides)
    application = Application(**defaults)
    db_session.add(application)
    db_session.commit()
    db_session.refresh(application)
    return application


def test_list_requires_auth(client):
    resp = client.get("/api/admin/applications")
    assert resp.status_code == 401


def test_staff_can_list_applications(client, db_session, taxonomy):
    _make_application(db_session, taxonomy["job"], ref="UV000001")
    _login(client, db_session, UserRole.STAFF, "staff-list@lahr.vn")

    resp = client.get("/api/admin/applications")
    assert resp.status_code == 200
    body = resp.json()
    assert body["total"] == 1
    assert body["items"][0]["reference_code"] == "UV000001"
    assert body["items"][0]["job_title"] == "Công nhân kiểm thử"


def test_filter_by_status(client, db_session, taxonomy):
    _make_application(db_session, taxonomy["job"], ref="UV000001", status=ApplicationStatus.NEW)
    _make_application(
        db_session, taxonomy["job"], ref="UV000002", status=ApplicationStatus.HIRED
    )
    _login(client, db_session, UserRole.ADMIN, "admin-filter@lahr.vn")

    resp = client.get("/api/admin/applications", params={"status": "hired"})
    assert resp.status_code == 200
    body = resp.json()
    assert body["total"] == 1
    assert body["items"][0]["reference_code"] == "UV000002"


def test_search_by_phone(client, db_session, taxonomy):
    _make_application(db_session, taxonomy["job"], ref="UV000001", phone="0987654321")
    _make_application(db_session, taxonomy["job"], ref="UV000002", phone="0911111111")
    _login(client, db_session, UserRole.ADMIN, "admin-search@lahr.vn")

    resp = client.get("/api/admin/applications", params={"q": "0987654321"})
    assert resp.status_code == 200
    body = resp.json()
    assert body["total"] == 1
    assert body["items"][0]["reference_code"] == "UV000001"


def test_update_status(client, db_session, taxonomy):
    application = _make_application(db_session, taxonomy["job"], ref="UV000001")
    _login(client, db_session, UserRole.STAFF, "staff-update@lahr.vn")

    resp = client.patch(
        f"/api/admin/applications/{application.id}", json={"status": "contacted"}
    )
    assert resp.status_code == 200
    assert resp.json()["status"] == "contacted"

    db_session.refresh(application)
    assert application.status == ApplicationStatus.CONTACTED
    log = db_session.query(AuditLog).filter_by(action="update", entity_type="application").one()
    assert log.entity_id == application.id


def test_assign_to_staff(client, db_session, taxonomy):
    application = _make_application(db_session, taxonomy["job"], ref="UV000001")
    assignee = User(
        email="assignee@lahr.vn", hashed_password=hash_password("MatKhauTester123"),
        role=UserRole.STAFF,
    )
    db_session.add(assignee)
    db_session.commit()
    _login(client, db_session, UserRole.MANAGER, "manager-assign@lahr.vn")

    resp = client.patch(
        f"/api/admin/applications/{application.id}", json={"assigned_to_id": assignee.id}
    )
    assert resp.status_code == 200
    assert resp.json()["assigned_to_email"] == "assignee@lahr.vn"

    resp = client.patch(
        f"/api/admin/applications/{application.id}", json={"assigned_to_id": None}
    )
    assert resp.status_code == 200
    assert resp.json()["assigned_to_id"] is None


def test_assign_to_unknown_user_returns_422(client, db_session, taxonomy):
    application = _make_application(db_session, taxonomy["job"], ref="UV000001")
    _login(client, db_session, UserRole.ADMIN, "admin-assign-bad@lahr.vn")

    resp = client.patch(
        f"/api/admin/applications/{application.id}", json={"assigned_to_id": 999999}
    )
    assert resp.status_code == 422


def test_export_csv_requires_admin_or_manager(client, db_session, taxonomy):
    _make_application(db_session, taxonomy["job"], ref="UV000001")
    _login(client, db_session, UserRole.STAFF, "staff-export@lahr.vn")

    resp = client.get("/api/admin/applications/export.csv")
    assert resp.status_code == 403


def test_export_csv_succeeds_for_manager_and_logs_audit(client, db_session, taxonomy):
    _make_application(db_session, taxonomy["job"], ref="UV000001", full_name="Trần Thị B")
    _login(client, db_session, UserRole.MANAGER, "manager-export@lahr.vn")

    resp = client.get("/api/admin/applications/export.csv")
    assert resp.status_code == 200
    assert resp.headers["content-type"].startswith("text/csv")
    assert "Trần Thị B" in resp.text
    assert "UV000001" in resp.text

    log = db_session.query(AuditLog).filter_by(
        action="export_csv", entity_type="application"
    ).one()
    assert log.meta["count"] == 1


def test_application_without_job_shows_null_job_fields(client, db_session, taxonomy):
    # Ứng viên không gắn tin cụ thể (job_id=None, VD nộp qua chatbot/walk-in) vẫn
    # phải hiển thị đúng trong danh sách admin, không được lỗi lazy-load quan hệ.
    _make_application(db_session, None, ref="UV000099")
    _login(client, db_session, UserRole.ADMIN, "admin-nulljob@lahr.vn")

    resp = client.get("/api/admin/applications")
    assert resp.status_code == 200
    item = resp.json()["items"][0]
    assert item["job_id"] is None
    assert item["job_title"] is None


def test_date_range_filter(client, db_session, taxonomy):
    old_app = _make_application(db_session, taxonomy["job"], ref="UV000001")
    old_app.created_at = datetime.now(UTC) - timedelta(days=10)
    db_session.commit()
    _make_application(db_session, taxonomy["job"], ref="UV000002")
    _login(client, db_session, UserRole.ADMIN, "admin-daterange@lahr.vn")

    # UTC, không phải date.today() (local) — server lọc date_from/date_to theo UTC
    # (xem admin/applications.py), local giờ VN (UTC+7) qua nửa đêm sẽ lệch ngày.
    today = datetime.now(UTC).date().isoformat()
    resp = client.get("/api/admin/applications", params={"date_from": today, "date_to": today})
    assert resp.status_code == 200
    body = resp.json()
    assert body["total"] == 1
    assert body["items"][0]["reference_code"] == "UV000002"
