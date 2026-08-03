from datetime import UTC, datetime, timedelta

import pytest

from app.core.security import hash_password
from app.core.storage import upload_root
from app.models import Application, Company, IndustrialPark, Job, JobCategory, Province, User
from app.models.enums import JobStatus, UserRole

VALID_PDF_BYTES = b"%PDF-1.4\n%fake pdf content for testing\n%%EOF"
FAKE_EXE_BYTES = b"MZ\x90\x00\x03\x00\x00\x00\x04\x00\x00\x00\xff\xff"


@pytest.fixture(autouse=True)
def _upload_dir(tmp_path, monkeypatch):
    # Đồng bộ với pattern đã dùng ở test_security.py — redirect upload ra thư mục
    # tạm của pytest (tự dọn), tránh rác vật lý trong uploads/ thật sau khi test chạy
    # (DB rollback theo transaction nhưng file trên đĩa thì không).
    monkeypatch.setattr("app.core.storage.settings.upload_dir", str(tmp_path))
    return tmp_path


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
    return {"province": province, "company": company, "job": job}


def _valid_form(job_slug: str, **overrides) -> dict:
    rendered_at = (datetime.now(UTC) - timedelta(seconds=5)).isoformat()
    form = {
        "full_name": "Nguyễn Văn A",
        "phone": "0912345678",
        "job_slug": job_slug,
        "consent_given": "true",
        "website": "",
        "form_rendered_at": rendered_at,
    }
    form.update(overrides)
    return form


def _valid_files() -> dict:
    return {"cv": ("cv.pdf", VALID_PDF_BYTES, "application/pdf")}


def test_valid_submission_creates_application(client, taxonomy, db_session):
    resp = client.post(
        "/api/applications",
        data=_valid_form(taxonomy["job"].slug),
        files=_valid_files(),
    )
    assert resp.status_code == 200
    body = resp.json()
    assert body["ok"] is True
    assert body["reference_code"].startswith("UV")
    assert body["duplicate"] is False

    application = db_session.query(Application).filter_by(
        reference_code=body["reference_code"]
    ).one()
    assert application.phone == "0912345678"
    assert application.job_id == taxonomy["job"].id
    assert application.cv_file_path is not None
    assert application.consent_given is True


def test_response_does_not_echo_pii(client, taxonomy):
    resp = client.post(
        "/api/applications",
        data=_valid_form(taxonomy["job"].slug),
        files=_valid_files(),
    )
    body = resp.json()
    assert set(body.keys()) == {"ok", "reference_code", "duplicate", "message"}
    assert "0912345678" not in resp.text
    assert "Nguyễn Văn A" not in resp.text


def test_missing_consent_returns_422(client, taxonomy, db_session):
    resp = client.post(
        "/api/applications",
        data=_valid_form(taxonomy["job"].slug, consent_given="false"),
        files=_valid_files(),
    )
    assert resp.status_code == 422
    assert db_session.query(Application).count() == 0


def test_invalid_phone_returns_422(client, taxonomy, db_session):
    resp = client.post(
        "/api/applications",
        data=_valid_form(taxonomy["job"].slug, phone="123"),
        files=_valid_files(),
    )
    assert resp.status_code == 422
    assert db_session.query(Application).count() == 0


def test_unknown_job_slug_returns_404(client, taxonomy):
    resp = client.post(
        "/api/applications",
        data=_valid_form("khong-ton-tai"),
        files=_valid_files(),
    )
    assert resp.status_code == 404


def test_oversized_file_returns_413(client, taxonomy, monkeypatch, db_session):
    monkeypatch.setattr("app.core.storage.settings.max_upload_bytes", 1024)
    big_file = {"cv": ("cv.pdf", VALID_PDF_BYTES + b"0" * 2048, "application/pdf")}
    resp = client.post(
        "/api/applications", data=_valid_form(taxonomy["job"].slug), files=big_file
    )
    assert resp.status_code == 413
    assert db_session.query(Application).count() == 0


def test_exe_renamed_to_pdf_returns_415(client, taxonomy, db_session):
    fake_file = {"cv": ("cv.pdf", FAKE_EXE_BYTES, "application/pdf")}
    resp = client.post(
        "/api/applications", data=_valid_form(taxonomy["job"].slug), files=fake_file
    )
    assert resp.status_code == 415
    assert db_session.query(Application).count() == 0


def test_honeypot_filled_rejected_silently(client, taxonomy, db_session):
    resp = client.post(
        "/api/applications",
        data=_valid_form(taxonomy["job"].slug, website="http://spam.example"),
        files=_valid_files(),
    )
    assert resp.status_code == 200
    assert resp.json()["ok"] is True
    assert db_session.query(Application).count() == 0


def test_submission_too_fast_rejected_silently(client, taxonomy, db_session):
    now_iso = datetime.now(UTC).isoformat()
    resp = client.post(
        "/api/applications",
        data=_valid_form(taxonomy["job"].slug, form_rendered_at=now_iso),
        files=_valid_files(),
    )
    assert resp.status_code == 200
    assert resp.json()["ok"] is True
    assert db_session.query(Application).count() == 0


def test_duplicate_submission_within_7_days_returns_friendly_message(
    client, taxonomy, db_session
):
    first = client.post(
        "/api/applications", data=_valid_form(taxonomy["job"].slug), files=_valid_files()
    )
    assert first.status_code == 200
    assert db_session.query(Application).count() == 1

    second = client.post(
        "/api/applications", data=_valid_form(taxonomy["job"].slug), files=_valid_files()
    )
    assert second.status_code == 200
    body = second.json()
    assert body["duplicate"] is True
    assert body["reference_code"] == first.json()["reference_code"]
    assert db_session.query(Application).count() == 1


def test_phone_daily_limit_returns_429(client, taxonomy, db_session):
    now = datetime.now(UTC)
    for i in range(10):
        db_session.add(
            Application(
                reference_code=f"UVSEED{i:03d}",
                job_id=None,
                full_name="Ứng viên cũ",
                phone="0912345678",
                created_at=now - timedelta(hours=1),
            )
        )
    db_session.commit()

    resp = client.post(
        "/api/applications",
        data=_valid_form(taxonomy["job"].slug),
        files=_valid_files(),
    )
    assert resp.status_code == 429


def test_ip_rate_limit_blocks_after_5_per_hour(client, taxonomy, db_session):
    responses = []
    for i in range(6):
        resp = client.post(
            "/api/applications",
            data=_valid_form(taxonomy["job"].slug, phone=f"091234567{i % 10}"),
            files=_valid_files(),
        )
        responses.append(resp)
    assert [r.status_code for r in responses[:5]] == [200] * 5
    assert responses[5].status_code == 429


def test_download_cv_requires_auth(client, taxonomy, db_session):
    submit = client.post(
        "/api/applications", data=_valid_form(taxonomy["job"].slug), files=_valid_files()
    )
    reference_code = submit.json()["reference_code"]
    application = db_session.query(Application).filter_by(reference_code=reference_code).one()

    resp = client.get(f"/api/admin/applications/{application.id}/cv")
    assert resp.status_code == 401


def test_download_cv_with_auth_succeeds(client, taxonomy, db_session):
    submit = client.post(
        "/api/applications", data=_valid_form(taxonomy["job"].slug), files=_valid_files()
    )
    reference_code = submit.json()["reference_code"]
    application = db_session.query(Application).filter_by(reference_code=reference_code).one()

    staff = User(
        email="staff-cv@lahr.vn", hashed_password=hash_password("MatKhauTester123"),
        role=UserRole.STAFF,
    )
    db_session.add(staff)
    db_session.commit()
    client.post("/api/auth/login", json={"email": staff.email, "password": "MatKhauTester123"})

    resp = client.get(f"/api/admin/applications/{application.id}/cv")
    assert resp.status_code == 200
    assert resp.headers["content-disposition"].startswith("attachment;")
    assert reference_code in resp.headers["content-disposition"]


def test_purge_clears_pii_and_deletes_file(client, taxonomy, db_session):
    submit = client.post(
        "/api/applications", data=_valid_form(taxonomy["job"].slug), files=_valid_files()
    )
    reference_code = submit.json()["reference_code"]
    application = db_session.query(Application).filter_by(reference_code=reference_code).one()
    cv_path = upload_root() / application.cv_file_path
    assert cv_path.is_file()

    admin = User(
        email="admin-purge@lahr.vn", hashed_password=hash_password("MatKhauTester123"),
        role=UserRole.ADMIN,
    )
    db_session.add(admin)
    db_session.commit()
    client.post("/api/auth/login", json={"email": admin.email, "password": "MatKhauTester123"})

    resp = client.post(f"/api/admin/applications/{application.id}/purge")
    assert resp.status_code == 204

    db_session.refresh(application)
    assert application.phone != "0912345678"
    assert application.cv_file_path is None
    assert application.purged_at is not None
    assert not cv_path.exists()


def test_staff_forbidden_to_purge(client, taxonomy, db_session):
    submit = client.post(
        "/api/applications", data=_valid_form(taxonomy["job"].slug), files=_valid_files()
    )
    reference_code = submit.json()["reference_code"]
    application = db_session.query(Application).filter_by(reference_code=reference_code).one()

    staff = User(
        email="staff-purge@lahr.vn", hashed_password=hash_password("MatKhauTester123"),
        role=UserRole.STAFF,
    )
    db_session.add(staff)
    db_session.commit()
    client.post("/api/auth/login", json={"email": staff.email, "password": "MatKhauTester123"})

    resp = client.post(f"/api/admin/applications/{application.id}/purge")
    assert resp.status_code == 403
