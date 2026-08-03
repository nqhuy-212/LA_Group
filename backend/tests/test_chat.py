from datetime import UTC, date, datetime

import pytest

from app.core.config import settings
from app.models import Company, IndustrialPark, Job, JobCategory, Province
from app.models.enums import JobStatus
from app.services import chat_service


@pytest.fixture(autouse=True)
def _reset_daily_budget():
    chat_service._usage_date = None
    chat_service._usage_tokens = 0
    yield
    chat_service._usage_date = None
    chat_service._usage_tokens = 0


@pytest.fixture
def taxonomy(db_session):
    province = Province(code="30", name="Hải Dương", type="Tỉnh", is_active=True)
    db_session.add(province)
    db_session.flush()

    park = IndustrialPark(slug="dai-an", name="KCN Đại An", province_code="30")
    category_sx = JobCategory(slug="sx", name="Sản xuất – Lắp ráp", sort_order=1, is_active=True)
    category_kv = JobCategory(slug="kv", name="Kho vận – Logistics", sort_order=2, is_active=True)
    company = Company(slug="cong-ty-test", name="Công ty Test", is_partner=True)
    db_session.add_all([park, category_sx, category_kv, company])
    db_session.commit()

    def _make_job(*, slug: str, **overrides) -> Job:
        defaults = dict(
            slug=slug,
            title="Công nhân lắp ráp điện tử",
            company_id=company.id,
            category_id=category_sx.id,
            industrial_park_id=park.id,
            province_code="30",
            status=JobStatus.PUBLISHED,
            published_at=datetime.now(UTC),
            salary_min=8_000_000,
            salary_max=10_000_000,
        )
        defaults.update(overrides)
        job = Job(**defaults)
        db_session.add(job)
        db_session.commit()
        return job

    return {"province": province, "park": park, "category_sx": category_sx,
             "category_kv": category_kv, "company": company, "make_job": _make_job}


def test_search_jobs_matches_keyword_unaccented(db_session, taxonomy):
    taxonomy["make_job"](slug="cong-nhan-lap-rap", title="Công nhân lắp ráp điện tử")
    result = chat_service._search_jobs_sync(db_session, "cong nhan", None, None, None)
    assert result["count"] == 1
    assert result["jobs"][0]["title"] == "Công nhân lắp ráp điện tử"
    assert result["jobs"][0]["url"].endswith("/viec-lam/cong-nhan-lap-rap")


def test_search_jobs_matches_industrial_park_name_via_province_param(db_session, taxonomy):
    taxonomy["make_job"](slug="tho-may")
    result = chat_service._search_jobs_sync(db_session, None, "Đại An", None, None)
    assert result["count"] == 1

    result_no_match = chat_service._search_jobs_sync(db_session, None, "Đại Bàng", None, None)
    assert result_no_match["count"] == 0


def test_search_jobs_filters_by_category_name(db_session, taxonomy):
    taxonomy["make_job"](slug="job-sx", category_id=taxonomy["category_sx"].id)
    taxonomy["make_job"](slug="job-kv", category_id=taxonomy["category_kv"].id)

    result = chat_service._search_jobs_sync(db_session, None, None, "Kho vận", None)
    assert result["count"] == 1
    assert result["jobs"][0]["category"] == "Kho vận – Logistics"


def test_search_jobs_filters_by_salary_min(db_session, taxonomy):
    taxonomy["make_job"](slug="job-thap", salary_min=5_000_000, salary_max=7_000_000)
    taxonomy["make_job"](slug="job-cao", salary_min=9_000_000, salary_max=12_000_000)

    result = chat_service._search_jobs_sync(db_session, None, None, None, 8_000_000)
    assert result["count"] == 1
    assert result["jobs"][0]["salary_max"] == 12_000_000


def test_search_jobs_excludes_draft_and_closed(db_session, taxonomy):
    taxonomy["make_job"](slug="job-draft", status=JobStatus.DRAFT, published_at=None)
    taxonomy["make_job"](slug="job-closed", status=JobStatus.CLOSED)
    taxonomy["make_job"](slug="job-published", status=JobStatus.PUBLISHED)

    result = chat_service._search_jobs_sync(db_session, None, None, None, None)
    assert result["count"] == 1
    assert result["jobs"][0]["url"].endswith("/viec-lam/job-published")


def test_search_jobs_uses_company_display_name_when_partner_anonymous(db_session, taxonomy):
    taxonomy["company"].display_name_public = "Nhà máy đối tác ẩn danh"
    db_session.commit()
    taxonomy["make_job"](slug="job-anon")

    result = chat_service._search_jobs_sync(db_session, None, None, None, None)
    assert result["jobs"][0]["company"] == "Nhà máy đối tác ẩn danh"


def test_chat_message_too_long_returns_422(client):
    resp = client.post("/api/chat", json={"message": "a" * 2000, "history": []})
    assert resp.status_code == 422


def test_chat_history_too_long_returns_422(client):
    history = [{"role": "user", "content": "hi"} for _ in range(30)]
    resp = client.post("/api/chat", json={"message": "xin chao", "history": history})
    assert resp.status_code == 422


def test_chat_without_api_key_returns_503(client, monkeypatch):
    monkeypatch.setattr(settings, "anthropic_api_key", "")
    resp = client.post("/api/chat", json={"message": "xin chao", "history": []})
    assert resp.status_code == 503


def test_chat_budget_exceeded_returns_fallback_message(client, monkeypatch):
    monkeypatch.setattr(settings, "anthropic_api_key", "test-key-fake")
    monkeypatch.setattr(chat_service, "has_budget", lambda: False)

    resp = client.post("/api/chat", json={"message": "xin chao", "history": []})
    assert resp.status_code == 200
    assert "hotline" in resp.text


def test_chat_rate_limit_after_10_requests(client, monkeypatch):
    monkeypatch.setattr(settings, "anthropic_api_key", "test-key-fake")

    async def _fake_stream(message, history):
        yield 'data: {"type": "token", "text": "xin chao"}\n\n'
        yield 'data: {"type": "done"}\n\n'

    monkeypatch.setattr(chat_service, "stream_chat", _fake_stream)

    responses = [
        client.post("/api/chat", json={"message": f"cau hoi {i}", "history": []})
        for i in range(11)
    ]
    assert [r.status_code for r in responses[:10]] == [200] * 10
    assert responses[10].status_code == 429


def test_has_budget_resets_on_new_day(monkeypatch):
    chat_service._usage_date = date(2000, 1, 1)
    chat_service._usage_tokens = 999_999_999
    monkeypatch.setattr(settings, "chat_daily_token_budget", 100)
    assert chat_service.has_budget() is True


def test_record_usage_exhausts_budget(monkeypatch):
    monkeypatch.setattr(settings, "chat_daily_token_budget", 100)
    assert chat_service.has_budget() is True
    chat_service._record_usage(60, 60)
    assert chat_service.has_budget() is False
