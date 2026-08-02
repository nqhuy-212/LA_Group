from datetime import UTC, datetime

import pytest

from app.models import Company, IndustrialPark, Job, JobCategory, Post, Province
from app.models.enums import JobStatus, PostStatus, PostType


@pytest.fixture
def taxonomy(db_session):
    province = Province(code="30", name="Hải Dương", type="Tỉnh", is_active=True)
    db_session.add(province)
    db_session.flush()

    park = IndustrialPark(slug="dai-an", name="KCN Đại An", province_code="30")
    category_sx = JobCategory(slug="sx", name="Sản xuất – Lắp ráp", sort_order=1, is_active=True)
    category_kt = JobCategory(slug="kt", name="Cơ khí – Kỹ thuật", sort_order=2, is_active=True)
    company = Company(slug="cong-ty-test", name="Công ty Test", is_partner=True)
    db_session.add_all([park, category_sx, category_kt, company])
    db_session.commit()
    return {
        "province": province,
        "park": park,
        "category_sx": category_sx,
        "category_kt": category_kt,
        "company": company,
    }


def _make_job(db_session, taxonomy, slug: str, **overrides):
    defaults = {
        "slug": slug,
        "title": "Công nhân lắp ráp điện tử",
        "company_id": taxonomy["company"].id,
        "category_id": taxonomy["category_sx"].id,
        "industrial_park_id": taxonomy["park"].id,
        "province_code": "30",
        "salary_min": 8_000_000,
        "salary_max": 10_000_000,
        "status": JobStatus.PUBLISHED,
        "published_at": datetime.now(UTC),
        "quantity": 5,
    }
    defaults.update(overrides)
    job = Job(**defaults)
    db_session.add(job)
    db_session.commit()
    db_session.refresh(job)
    return job


def test_list_jobs_returns_published_only(client, db_session, taxonomy):
    _make_job(db_session, taxonomy, "job-published")
    _make_job(db_session, taxonomy, "job-draft", status=JobStatus.DRAFT)

    resp = client.get("/api/jobs")
    assert resp.status_code == 200
    body = resp.json()
    assert body["total"] == 1
    assert [item["slug"] for item in body["items"]] == ["job-published"]


def test_job_fields_are_structured_not_preformatted(client, db_session, taxonomy):
    _make_job(db_session, taxonomy, "job-structured", salary_min=9_000_000, salary_max=12_000_000)
    item = client.get("/api/jobs").json()["items"][0]
    assert item["salary_min"] == 9_000_000
    assert isinstance(item["salary_min"], int)
    assert item["deadline"] is None or isinstance(item["deadline"], str)


def test_draft_job_detail_returns_404(client, db_session, taxonomy):
    _make_job(db_session, taxonomy, "job-draft", status=JobStatus.DRAFT)
    resp = client.get("/api/jobs/job-draft")
    assert resp.status_code == 404


def test_closed_job_detail_still_accessible_for_seo(client, db_session, taxonomy):
    _make_job(db_session, taxonomy, "job-closed", status=JobStatus.CLOSED)
    resp = client.get("/api/jobs/job-closed")
    assert resp.status_code == 200
    assert resp.json()["status"] == "closed"


def test_unknown_slug_returns_404(client):
    resp = client.get("/api/jobs/khong-ton-tai")
    assert resp.status_code == 404


def test_filter_by_category(client, db_session, taxonomy):
    _make_job(db_session, taxonomy, "sx-job", category_id=taxonomy["category_sx"].id)
    _make_job(db_session, taxonomy, "kt-job", category_id=taxonomy["category_kt"].id)

    resp = client.get("/api/jobs", params={"category": "kt"})
    body = resp.json()
    assert body["total"] == 1
    assert body["items"][0]["slug"] == "kt-job"


def test_page_size_over_50_is_rejected(client):
    resp = client.get("/api/jobs", params={"page_size": 100})
    assert resp.status_code == 422


def test_search_is_unaccent_insensitive(client, db_session, taxonomy):
    _make_job(db_session, taxonomy, "job-tim-kiem", title="Công nhân lắp ráp điện tử")
    resp = client.get("/api/jobs", params={"q": "cong nhan"})
    assert resp.status_code == 200
    assert resp.json()["total"] == 1


def test_job_categories_have_job_count(client, db_session, taxonomy):
    _make_job(db_session, taxonomy, "sx-job-1", category_id=taxonomy["category_sx"].id)
    _make_job(db_session, taxonomy, "sx-job-2", category_id=taxonomy["category_sx"].id)
    _make_job(db_session, taxonomy, "kt-job-1", category_id=taxonomy["category_kt"].id)

    resp = client.get("/api/job-categories")
    counts = {row["slug"]: row["job_count"] for row in resp.json()}
    assert counts["sx"] == 2
    assert counts["kt"] == 1


def test_posts_list_and_detail(client, db_session):
    published = Post(
        slug="tin-tuc-1",
        title="Tin tức 1",
        type=PostType.NEWS,
        status=PostStatus.PUBLISHED,
        published_at=datetime.now(UTC),
    )
    draft = Post(
        slug="tin-tuc-nhap",
        title="Tin nháp",
        type=PostType.NEWS,
        status=PostStatus.DRAFT,
    )
    db_session.add_all([published, draft])
    db_session.commit()

    list_resp = client.get("/api/posts")
    slugs = [item["slug"] for item in list_resp.json()]
    assert "tin-tuc-1" in slugs
    assert "tin-tuc-nhap" not in slugs

    detail_resp = client.get("/api/posts/tin-tuc-1")
    assert detail_resp.status_code == 200

    draft_detail_resp = client.get("/api/posts/tin-tuc-nhap")
    assert draft_detail_resp.status_code == 404
