from datetime import UTC, datetime

from fastapi import APIRouter, Depends, HTTPException, Query, Request, status
from sqlalchemy import func, select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session, selectinload

from app.api.deps import require_roles
from app.core.audit import write_audit_log
from app.core.rate_limit import get_client_ip
from app.core.slug import generate_unique_slug
from app.db.session import get_db
from app.models import Company, IndustrialPark, Job, JobCategory, Province, User
from app.models.enums import JobStatus, UserRole
from app.schemas.admin import JobAdminCreate, JobAdminOut, JobAdminUpdate
from app.schemas.common import PageResponse

router = APIRouter(prefix="/api/admin/jobs", tags=["admin-jobs"])

# Đăng/sửa tin dành cho cả 3 role (đây chính là "nhân viên tự đăng tin" — D15/P5);
# xoá tin thu hẹp lại admin+manager để tránh nhân viên xoá nhầm tin đã lên trang.
EDITOR_ROLES = (UserRole.ADMIN, UserRole.MANAGER, UserRole.STAFF)
DELETE_ROLES = (UserRole.ADMIN, UserRole.MANAGER)

_EAGER_LOAD = (
    selectinload(Job.company),
    selectinload(Job.category),
    selectinload(Job.industrial_park),
    selectinload(Job.province),
)


def _company_by_slug(db: Session, slug: str) -> Company:
    company = db.execute(select(Company).filter_by(slug=slug)).scalar_one_or_none()
    if company is None:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=f"Không tìm thấy công ty với slug '{slug}'",
        )
    return company


def _category_by_slug(db: Session, slug: str) -> JobCategory:
    category = db.execute(select(JobCategory).filter_by(slug=slug)).scalar_one_or_none()
    if category is None:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=f"Không tìm thấy ngành nghề với slug '{slug}'",
        )
    return category


def _industrial_park_by_slug(db: Session, slug: str) -> IndustrialPark:
    park = db.execute(select(IndustrialPark).filter_by(slug=slug)).scalar_one_or_none()
    if park is None:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=f"Không tìm thấy khu công nghiệp với slug '{slug}'",
        )
    return park


def _ensure_province_exists(db: Session, code: str) -> None:
    if db.get(Province, code) is None:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=f"Không tìm thấy tỉnh/thành với mã '{code}'",
        )


def _job_admin_out(job: Job) -> JobAdminOut:
    return JobAdminOut(
        id=job.id,
        slug=job.slug,
        title=job.title,
        company_slug=job.company.slug,
        company_name=job.company.name,
        category_slug=job.category.slug,
        category_name=job.category.name,
        industrial_park_slug=job.industrial_park.slug if job.industrial_park else None,
        industrial_park_name=job.industrial_park.name if job.industrial_park else None,
        province_code=job.province_code,
        province_name=job.province.name,
        salary_min=job.salary_min,
        salary_max=job.salary_max,
        salary_negotiable=job.salary_negotiable,
        quantity=job.quantity,
        age_min=job.age_min,
        age_max=job.age_max,
        shift_type=job.shift_type,
        employment_type=job.employment_type,
        description=job.description,
        requirements=job.requirements,
        benefits=job.benefits,
        deadline=job.deadline,
        status=job.status.value,
        is_hot=job.is_hot,
        published_at=job.published_at,
        view_count=job.view_count,
        meta_title=job.meta_title,
        meta_description=job.meta_description,
        created_at=job.created_at,
        updated_at=job.updated_at,
    )


def _get_job_or_404(db: Session, job_id: int) -> Job:
    job = db.execute(
        select(Job).where(Job.id == job_id).options(*_EAGER_LOAD)
    ).scalar_one_or_none()
    if job is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Không tìm thấy tin tuyển dụng"
        )
    return job


@router.get("", response_model=PageResponse[JobAdminOut])
def list_jobs_admin(
    status_filter: JobStatus | None = Query(default=None, alias="status"),
    q: str | None = None,
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
    _user: User = Depends(require_roles(*EDITOR_ROLES)),
) -> PageResponse[JobAdminOut]:
    conditions = []
    if status_filter is not None:
        conditions.append(Job.status == status_filter)
    if q:
        conditions.append(Job.title.ilike(f"%{q}%"))

    total = db.execute(select(func.count()).select_from(Job).where(*conditions)).scalar_one()
    jobs = db.execute(
        select(Job)
        .where(*conditions)
        .options(*_EAGER_LOAD)
        .order_by(Job.created_at.desc())
        .offset((page - 1) * page_size)
        .limit(page_size)
    ).scalars().all()
    return PageResponse(
        items=[_job_admin_out(job) for job in jobs], total=total, page=page, page_size=page_size
    )


@router.get("/{job_id}", response_model=JobAdminOut)
def get_job_admin(
    job_id: int, db: Session = Depends(get_db), _user: User = Depends(require_roles(*EDITOR_ROLES))
) -> JobAdminOut:
    return _job_admin_out(_get_job_or_404(db, job_id))


@router.post("", response_model=JobAdminOut, status_code=status.HTTP_201_CREATED)
def create_job_admin(
    payload: JobAdminCreate,
    request: Request,
    db: Session = Depends(get_db),
    user: User = Depends(require_roles(*EDITOR_ROLES)),
) -> JobAdminOut:
    company = _company_by_slug(db, payload.company_slug)
    category = _category_by_slug(db, payload.category_slug)
    park = (
        _industrial_park_by_slug(db, payload.industrial_park_slug)
        if payload.industrial_park_slug
        else None
    )
    _ensure_province_exists(db, payload.province_code)

    data = payload.model_dump(exclude={"company_slug", "category_slug", "industrial_park_slug"})
    job = Job(
        **data,
        slug=generate_unique_slug(db, Job, payload.title),
        company_id=company.id,
        category_id=category.id,
        industrial_park_id=park.id if park else None,
    )
    if job.status == JobStatus.PUBLISHED:
        job.published_at = datetime.now(UTC)

    db.add(job)
    db.flush()
    write_audit_log(
        db,
        user_id=user.id,
        action="create",
        entity_type="job",
        entity_id=job.id,
        ip=get_client_ip(request),
    )
    db.commit()

    return _job_admin_out(_get_job_or_404(db, job.id))


@router.patch("/{job_id}", response_model=JobAdminOut)
def update_job_admin(
    job_id: int,
    payload: JobAdminUpdate,
    request: Request,
    db: Session = Depends(get_db),
    user: User = Depends(require_roles(*EDITOR_ROLES)),
) -> JobAdminOut:
    job = _get_job_or_404(db, job_id)
    data = payload.model_dump(exclude_unset=True)

    if "company_slug" in data:
        data["company_id"] = _company_by_slug(db, data.pop("company_slug")).id
    if "category_slug" in data:
        data["category_id"] = _category_by_slug(db, data.pop("category_slug")).id
    if "industrial_park_slug" in data:
        park_slug = data.pop("industrial_park_slug")
        data["industrial_park_id"] = (
            _industrial_park_by_slug(db, park_slug).id if park_slug else None
        )
    if "province_code" in data:
        _ensure_province_exists(db, data["province_code"])

    # Slug bất biến sau khi publish (SEO — xem seo.md): chỉ regenerate khi tin
    # CHƯA từng publish (published_at vẫn None), kể cả khi status hiện tại đã đổi.
    if "title" in data and data["title"] != job.title and job.published_at is None:
        job.slug = generate_unique_slug(db, Job, data["title"], exclude_id=job.id)

    for field, value in data.items():
        setattr(job, field, value)

    if job.status == JobStatus.PUBLISHED and job.published_at is None:
        job.published_at = datetime.now(UTC)

    write_audit_log(
        db,
        user_id=user.id,
        action="update",
        entity_type="job",
        entity_id=job.id,
        ip=get_client_ip(request),
        meta={"fields": sorted(data.keys())},
    )
    db.commit()

    return _job_admin_out(_get_job_or_404(db, job.id))


@router.delete("/{job_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_job_admin(
    job_id: int,
    request: Request,
    db: Session = Depends(get_db),
    user: User = Depends(require_roles(*DELETE_ROLES)),
) -> None:
    job = _get_job_or_404(db, job_id)
    write_audit_log(
        db,
        user_id=user.id,
        action="delete",
        entity_type="job",
        entity_id=job.id,
        ip=get_client_ip(request),
    )
    db.delete(job)
    try:
        db.commit()
    except IntegrityError as exc:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Không thể xoá vì tin tuyển dụng này đang được dữ liệu khác tham chiếu",
        ) from exc
