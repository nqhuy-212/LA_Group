from fastapi import APIRouter, Depends, HTTPException, Query, Request, status
from sqlalchemy import func, select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.api.deps import require_roles
from app.core.audit import write_audit_log
from app.core.rate_limit import get_client_ip
from app.core.slug import generate_unique_slug
from app.db.session import get_db
from app.models import Company, Job, User
from app.models.enums import UserRole
from app.schemas.admin import CompanyAdminCreate, CompanyAdminOut, CompanyAdminUpdate
from app.schemas.common import PageResponse

router = APIRouter(prefix="/api/admin/companies", tags=["admin-companies"])

# Company = nhà máy/đối tác (xem data-models.md) — dữ liệu nền tảng nhiều Job tham
# chiếu tới, nên tạo/sửa thu hẹp lại admin+manager; staff chỉ được xem để chọn khi
# đăng tin (list/get vẫn mở cho cả 3 role).
VIEW_ROLES = (UserRole.ADMIN, UserRole.MANAGER, UserRole.STAFF)
EDITOR_ROLES = (UserRole.ADMIN, UserRole.MANAGER)
DELETE_ROLES = (UserRole.ADMIN,)


def _get_company_or_404(db: Session, company_id: int) -> Company:
    company = db.get(Company, company_id)
    if company is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Không tìm thấy công ty")
    return company


def _company_job_count(db: Session, company_id: int) -> int:
    return db.execute(
        select(func.count()).select_from(Job).where(Job.company_id == company_id)
    ).scalar_one()


def _company_out(company: Company, job_count: int) -> CompanyAdminOut:
    return CompanyAdminOut(
        id=company.id,
        slug=company.slug,
        name=company.name,
        display_name_public=company.display_name_public,
        logo_initials=company.logo_initials,
        logo_url=company.logo_url,
        is_partner=company.is_partner,
        job_count=job_count,
        created_at=company.created_at,
        updated_at=company.updated_at,
    )


@router.get("", response_model=PageResponse[CompanyAdminOut])
def list_companies_admin(
    q: str | None = None,
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
    _user: User = Depends(require_roles(*VIEW_ROLES)),
) -> PageResponse[CompanyAdminOut]:
    conditions = []
    if q:
        conditions.append(Company.name.ilike(f"%{q}%"))

    total = db.execute(select(func.count()).select_from(Company).where(*conditions)).scalar_one()
    job_counts = (
        select(Job.company_id, func.count().label("job_count")).group_by(Job.company_id)
    ).subquery()
    rows = db.execute(
        select(Company, func.coalesce(job_counts.c.job_count, 0))
        .outerjoin(job_counts, job_counts.c.company_id == Company.id)
        .where(*conditions)
        .order_by(Company.name)
        .offset((page - 1) * page_size)
        .limit(page_size)
    ).all()
    return PageResponse(
        items=[_company_out(company, count) for company, count in rows],
        total=total,
        page=page,
        page_size=page_size,
    )


@router.get("/{company_id}", response_model=CompanyAdminOut)
def get_company_admin(
    company_id: int,
    db: Session = Depends(get_db),
    _user: User = Depends(require_roles(*VIEW_ROLES)),
) -> CompanyAdminOut:
    company = _get_company_or_404(db, company_id)
    return _company_out(company, _company_job_count(db, company.id))


@router.post("", response_model=CompanyAdminOut, status_code=status.HTTP_201_CREATED)
def create_company_admin(
    payload: CompanyAdminCreate,
    request: Request,
    db: Session = Depends(get_db),
    user: User = Depends(require_roles(*EDITOR_ROLES)),
) -> CompanyAdminOut:
    company = Company(
        **payload.model_dump(), slug=generate_unique_slug(db, Company, payload.name)
    )
    db.add(company)
    db.flush()
    write_audit_log(
        db,
        user_id=user.id,
        action="create",
        entity_type="company",
        entity_id=company.id,
        ip=get_client_ip(request),
    )
    db.commit()
    db.refresh(company)
    return _company_out(company, job_count=0)


@router.patch("/{company_id}", response_model=CompanyAdminOut)
def update_company_admin(
    company_id: int,
    payload: CompanyAdminUpdate,
    request: Request,
    db: Session = Depends(get_db),
    user: User = Depends(require_roles(*EDITOR_ROLES)),
) -> CompanyAdminOut:
    company = _get_company_or_404(db, company_id)
    data = payload.model_dump(exclude_unset=True)

    # Không regenerate slug công ty theo `name` — jobs.company_slug đã publish có
    # thể đang tham chiếu slug này (không có khái niệm "draft" ở Company để biết an
    # toàn khi nào đổi được), nên slug công ty coi như bất biến kể từ lúc tạo.
    for field, value in data.items():
        setattr(company, field, value)

    write_audit_log(
        db,
        user_id=user.id,
        action="update",
        entity_type="company",
        entity_id=company.id,
        ip=get_client_ip(request),
        meta={"fields": sorted(data.keys())},
    )
    db.commit()
    db.refresh(company)
    return _company_out(company, _company_job_count(db, company.id))


@router.delete("/{company_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_company_admin(
    company_id: int,
    request: Request,
    db: Session = Depends(get_db),
    user: User = Depends(require_roles(*DELETE_ROLES)),
) -> None:
    company = _get_company_or_404(db, company_id)
    job_count = _company_job_count(db, company.id)
    if job_count > 0:
        # Company không có cột is_active (khác job_categories/provinces) nên không
        # gợi ý "ẩn" — chỉ có thể xoá tin/đổi công ty của tin trước.
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Không thể xoá: đang có {job_count} tin tuyển dụng thuộc công ty này.",
        )

    write_audit_log(
        db,
        user_id=user.id,
        action="delete",
        entity_type="company",
        entity_id=company.id,
        ip=get_client_ip(request),
    )
    db.delete(company)
    try:
        db.commit()
    except IntegrityError as exc:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Không thể xoá vì công ty này đang có tin tuyển dụng tham chiếu",
        ) from exc
