from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import func, select
from sqlalchemy.orm import Session, selectinload

from app.db.session import get_db
from app.models import Company, IndustrialPark, Job, JobCategory
from app.models.enums import JobStatus
from app.schemas.common import PageResponse
from app.schemas.job import (
    CompanyPublic,
    IndustrialParkPublic,
    JobCategoryPublic,
    JobDetail,
    JobListItem,
)

router = APIRouter(prefix="/api", tags=["jobs"])

_EAGER_LOAD = (
    selectinload(Job.company),
    selectinload(Job.category),
    selectinload(Job.industrial_park),
    selectinload(Job.province),
)


def _company_public(company: Company) -> CompanyPublic:
    return CompanyPublic(
        slug=company.slug,
        name=company.display_name_public or company.name,
        logo_initials=company.logo_initials,
        logo_url=company.logo_url,
        created_at=company.created_at,
    )


def _job_list_item(job: Job) -> JobListItem:
    return JobListItem(
        slug=job.slug,
        title=job.title,
        company=_company_public(job.company),
        category=JobCategoryPublic(slug=job.category.slug, name=job.category.name),
        industrial_park=(
            IndustrialParkPublic(slug=job.industrial_park.slug, name=job.industrial_park.name)
            if job.industrial_park is not None
            else None
        ),
        province_code=job.province_code,
        province_name=job.province.name,
        salary_min=job.salary_min,
        salary_max=job.salary_max,
        salary_negotiable=job.salary_negotiable,
        is_hot=job.is_hot,
        deadline=job.deadline,
        published_at=job.published_at,
    )


def _job_detail(job: Job) -> JobDetail:
    base = _job_list_item(job)
    return JobDetail(
        **base.model_dump(),
        quantity=job.quantity,
        age_min=job.age_min,
        age_max=job.age_max,
        shift_type=job.shift_type,
        employment_type=job.employment_type,
        description=job.description,
        requirements=job.requirements,
        benefits=job.benefits,
        status=job.status.value,
        meta_title=job.meta_title,
        meta_description=job.meta_description,
    )


def _unaccent_ilike(column, term: str):
    pattern = func.concat("%", func.immutable_unaccent(func.lower(term)), "%")
    return func.immutable_unaccent(func.lower(column)).ilike(pattern)


@router.get("/jobs", response_model=PageResponse[JobListItem])
def list_jobs(
    q: str | None = None,
    category: str | None = None,
    industrial_park: str | None = None,
    province: str | None = None,
    salary_min: int | None = None,
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=50),
    sort: str = "newest",
    db: Session = Depends(get_db),
) -> PageResponse[JobListItem]:
    conditions = [Job.status == JobStatus.PUBLISHED]
    if q:
        conditions.append(_unaccent_ilike(Job.title, q))
    if category:
        conditions.append(Job.category.has(JobCategory.slug == category))
    if industrial_park:
        conditions.append(Job.industrial_park.has(IndustrialPark.slug == industrial_park))
    if province:
        conditions.append(Job.province_code == province)
    if salary_min:
        conditions.append(Job.salary_max >= salary_min)

    total = db.execute(
        select(func.count()).select_from(Job).where(*conditions)
    ).scalar_one()

    query = select(Job).where(*conditions).options(*_EAGER_LOAD)
    if sort == "salary_desc":
        query = query.order_by(Job.salary_max.desc().nullslast())
    else:
        query = query.order_by(Job.is_hot.desc(), Job.published_at.desc())
    query = query.offset((page - 1) * page_size).limit(page_size)

    jobs = db.execute(query).scalars().all()
    return PageResponse(
        items=[_job_list_item(job) for job in jobs], total=total, page=page, page_size=page_size
    )


@router.get("/jobs/{slug}", response_model=JobDetail)
def get_job(slug: str, db: Session = Depends(get_db)) -> JobDetail:
    job = db.execute(
        select(Job)
        .where(Job.slug == slug, Job.status != JobStatus.DRAFT)
        .options(*_EAGER_LOAD)
    ).scalar_one_or_none()
    if job is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Không tìm thấy tin tuyển dụng"
        )
    return _job_detail(job)
