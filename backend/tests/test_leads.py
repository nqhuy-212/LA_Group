from datetime import UTC, datetime, timedelta

from app.models import Application
from app.models.enums import ApplicationSource


def _valid_form(**overrides) -> dict:
    rendered_at = (datetime.now(UTC) - timedelta(seconds=5)).isoformat()
    form = {
        "phone": "0912345678",
        "full_name": "Nguyễn Văn A",
        "notes": "Tìm việc làm thời vụ, nhận lương tuần, tại KCN Đại An",
        "consent_given": "true",
        "website": "",
        "form_rendered_at": rendered_at,
    }
    form.update(overrides)
    return form


def test_valid_lead_creates_application(client, db_session):
    resp = client.post("/api/leads", data=_valid_form())
    assert resp.status_code == 200
    body = resp.json()
    assert body["ok"] is True
    assert body["reference_code"].startswith("UV")

    application = db_session.query(Application).filter_by(
        reference_code=body["reference_code"]
    ).one()
    assert application.job_id is None
    assert application.source == ApplicationSource.CHATBOT
    assert application.phone == "0912345678"
    assert application.notes == "Tìm việc làm thời vụ, nhận lương tuần, tại KCN Đại An"
    assert application.consent_given is True


def test_lead_without_full_name_uses_default(client, db_session):
    resp = client.post("/api/leads", data=_valid_form(full_name=""))
    assert resp.status_code == 200
    application = db_session.query(Application).filter_by(
        reference_code=resp.json()["reference_code"]
    ).one()
    assert application.full_name == "Khách qua chatbot"


def test_missing_consent_returns_422(client, db_session):
    resp = client.post("/api/leads", data=_valid_form(consent_given="false"))
    assert resp.status_code == 422
    assert db_session.query(Application).count() == 0


def test_invalid_phone_returns_422(client, db_session):
    resp = client.post("/api/leads", data=_valid_form(phone="123"))
    assert resp.status_code == 422
    assert db_session.query(Application).count() == 0


def test_honeypot_filled_rejected_silently(client, db_session):
    resp = client.post("/api/leads", data=_valid_form(website="http://spam.example"))
    assert resp.status_code == 200
    assert resp.json()["ok"] is True
    assert db_session.query(Application).count() == 0


def test_submission_too_fast_rejected_silently(client, db_session):
    now_iso = datetime.now(UTC).isoformat()
    resp = client.post("/api/leads", data=_valid_form(form_rendered_at=now_iso))
    assert resp.status_code == 200
    assert resp.json()["ok"] is True
    assert db_session.query(Application).count() == 0


def test_response_does_not_echo_pii(client):
    resp = client.post("/api/leads", data=_valid_form())
    body = resp.json()
    assert set(body.keys()) == {"ok", "reference_code", "duplicate", "message"}
    assert "0912345678" not in resp.text
    assert "Nguyễn Văn A" not in resp.text


def test_phone_daily_limit_shared_with_applications_returns_429(client, db_session):
    # Giới hạn 10/ngày/SĐT dùng chung hàm đếm với /api/applications (app/core/antispam.py)
    # — seed 10 bản ghi "application" cũ, xác nhận /api/leads cùng SĐT cũng bị chặn.
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

    resp = client.post("/api/leads", data=_valid_form())
    assert resp.status_code == 429


def test_ip_rate_limit_blocks_after_5_per_hour(client, db_session):
    responses = []
    for i in range(6):
        resp = client.post("/api/leads", data=_valid_form(phone=f"091234567{i % 10}"))
        responses.append(resp)
    assert [r.status_code for r in responses[:5]] == [200] * 5
    assert responses[5].status_code == 429
