"""CRUD danh mục nền tảng: ngành nghề (JobCategory), khu công nghiệp
(IndustrialPark), tỉnh/thành (Province) — P10.2. 3 router riêng, theo đúng khuôn
`admin/companies.py` (RBAC + audit log + slug bất biến + đếm tham chiếu trước khi
xoá), nhưng KHÔNG phân trang: cả 3 là bảng tra cứu nhỏ, có bao nhiêu hiện hết để
phục vụ dropdown/trang quản lý — khác `companies`/`jobs` vốn có thể phình lớn.
"""

from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy import func, select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.api.deps import require_roles
from app.core.audit import write_audit_log
from app.core.rate_limit import get_client_ip
from app.core.slug import generate_unique_slug
from app.db.session import get_db
from app.models import Application, IndustrialPark, Job, JobCategory, Province, User
from app.models.enums import UserRole
from app.schemas.admin import (
    IndustrialParkAdminCreate,
    IndustrialParkAdminOut,
    IndustrialParkAdminUpdate,
    JobCategoryAdminCreate,
    JobCategoryAdminOut,
    JobCategoryAdminUpdate,
    ProvinceAdminCreate,
    ProvinceAdminOut,
    ProvinceAdminUpdate,
)

# Cùng ngưỡng RBAC với admin/companies.py: xem = cả 3 role (staff cần đọc để chọn
# khi đăng tin), thêm/sửa = admin+manager, xoá = chỉ admin.
VIEW_ROLES = (UserRole.ADMIN, UserRole.MANAGER, UserRole.STAFF)
EDITOR_ROLES = (UserRole.ADMIN, UserRole.MANAGER)
DELETE_ROLES = (UserRole.ADMIN,)

JOB_CATEGORY_SLUG_MAX_LENGTH = 30

# ---------------------------------------------------------------------------
# Ngành nghề (JobCategory)
# ---------------------------------------------------------------------------

job_categories_router = APIRouter(prefix="/api/admin/job-categories", tags=["admin-taxonomies"])


def _job_category_out(category: JobCategory, job_count: int) -> JobCategoryAdminOut:
    return JobCategoryAdminOut(
        id=category.id,
        slug=category.slug,
        name=category.name,
        sort_order=category.sort_order,
        is_active=category.is_active,
        job_count=job_count,
        created_at=category.created_at,
        updated_at=category.updated_at,
    )


def _job_category_job_count(db: Session, category_id: int) -> int:
    return db.execute(
        select(func.count()).select_from(Job).where(Job.category_id == category_id)
    ).scalar_one()


def _get_job_category_or_404(db: Session, category_id: int) -> JobCategory:
    category = db.get(JobCategory, category_id)
    if category is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Không tìm thấy ngành nghề"
        )
    return category


@job_categories_router.get("", response_model=list[JobCategoryAdminOut])
def list_job_categories_admin(
    db: Session = Depends(get_db),
    _user: User = Depends(require_roles(*VIEW_ROLES)),
) -> list[JobCategoryAdminOut]:
    job_counts = (
        select(Job.category_id, func.count().label("job_count"))
        .group_by(Job.category_id)
        .subquery()
    )
    rows = db.execute(
        select(JobCategory, func.coalesce(job_counts.c.job_count, 0))
        .outerjoin(job_counts, job_counts.c.category_id == JobCategory.id)
        .order_by(JobCategory.sort_order)
    ).all()
    return [_job_category_out(category, count) for category, count in rows]


@job_categories_router.post(
    "", response_model=JobCategoryAdminOut, status_code=status.HTTP_201_CREATED
)
def create_job_category_admin(
    payload: JobCategoryAdminCreate,
    request: Request,
    db: Session = Depends(get_db),
    user: User = Depends(require_roles(*EDITOR_ROLES)),
) -> JobCategoryAdminOut:
    category = JobCategory(
        **payload.model_dump(),
        slug=generate_unique_slug(
            db, JobCategory, payload.name, max_length=JOB_CATEGORY_SLUG_MAX_LENGTH
        ),
    )
    db.add(category)
    db.flush()
    write_audit_log(
        db,
        user_id=user.id,
        action="create",
        entity_type="job_category",
        entity_id=category.id,
        ip=get_client_ip(request),
    )
    db.commit()
    db.refresh(category)
    return _job_category_out(category, job_count=0)


@job_categories_router.patch("/{category_id}", response_model=JobCategoryAdminOut)
def update_job_category_admin(
    category_id: int,
    payload: JobCategoryAdminUpdate,
    request: Request,
    db: Session = Depends(get_db),
    user: User = Depends(require_roles(*EDITOR_ROLES)),
) -> JobCategoryAdminOut:
    category = _get_job_category_or_404(db, category_id)
    data = payload.model_dump(exclude_unset=True)

    # Không regenerate slug theo `name` — jobs đã publish đang tham chiếu slug này.
    for field, value in data.items():
        setattr(category, field, value)

    write_audit_log(
        db,
        user_id=user.id,
        action="update",
        entity_type="job_category",
        entity_id=category.id,
        ip=get_client_ip(request),
        meta={"fields": sorted(data.keys())},
    )
    db.commit()
    db.refresh(category)
    return _job_category_out(category, _job_category_job_count(db, category.id))


@job_categories_router.delete("/{category_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_job_category_admin(
    category_id: int,
    request: Request,
    db: Session = Depends(get_db),
    user: User = Depends(require_roles(*DELETE_ROLES)),
) -> None:
    category = _get_job_category_or_404(db, category_id)
    job_count = _job_category_job_count(db, category.id)
    if job_count > 0:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=(
                f"Không thể xoá: đang có {job_count} tin tuyển dụng thuộc ngành nghề này. "
                "Hãy ẩn thay vì xoá."
            ),
        )

    write_audit_log(
        db,
        user_id=user.id,
        action="delete",
        entity_type="job_category",
        entity_id=category.id,
        ip=get_client_ip(request),
    )
    db.delete(category)
    try:
        db.commit()
    except IntegrityError as exc:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Không thể xoá vì ngành nghề này đang được tham chiếu",
        ) from exc


# ---------------------------------------------------------------------------
# Khu công nghiệp (IndustrialPark)
# ---------------------------------------------------------------------------

industrial_parks_router = APIRouter(
    prefix="/api/admin/industrial-parks", tags=["admin-taxonomies"]
)


def _industrial_park_out(park: IndustrialPark, job_count: int) -> IndustrialParkAdminOut:
    return IndustrialParkAdminOut(
        id=park.id,
        slug=park.slug,
        name=park.name,
        province_code=park.province_code,
        district_name=park.district_name,
        job_count=job_count,
        created_at=park.created_at,
        updated_at=park.updated_at,
    )


def _industrial_park_job_count(db: Session, park_id: int) -> int:
    return db.execute(
        select(func.count()).select_from(Job).where(Job.industrial_park_id == park_id)
    ).scalar_one()


def _get_industrial_park_or_404(db: Session, park_id: int) -> IndustrialPark:
    park = db.get(IndustrialPark, park_id)
    if park is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Không tìm thấy khu công nghiệp"
        )
    return park


@industrial_parks_router.get("", response_model=list[IndustrialParkAdminOut])
def list_industrial_parks_admin(
    db: Session = Depends(get_db),
    _user: User = Depends(require_roles(*VIEW_ROLES)),
) -> list[IndustrialParkAdminOut]:
    job_counts = (
        select(Job.industrial_park_id, func.count().label("job_count"))
        .group_by(Job.industrial_park_id)
        .subquery()
    )
    rows = db.execute(
        select(IndustrialPark, func.coalesce(job_counts.c.job_count, 0))
        .outerjoin(job_counts, job_counts.c.industrial_park_id == IndustrialPark.id)
        .order_by(IndustrialPark.name)
    ).all()
    return [_industrial_park_out(park, count) for park, count in rows]


@industrial_parks_router.post(
    "", response_model=IndustrialParkAdminOut, status_code=status.HTTP_201_CREATED
)
def create_industrial_park_admin(
    payload: IndustrialParkAdminCreate,
    request: Request,
    db: Session = Depends(get_db),
    user: User = Depends(require_roles(*EDITOR_ROLES)),
) -> IndustrialParkAdminOut:
    if db.get(Province, payload.province_code) is None:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail="Mã tỉnh không tồn tại"
        )
    park = IndustrialPark(
        **payload.model_dump(), slug=generate_unique_slug(db, IndustrialPark, payload.name)
    )
    db.add(park)
    db.flush()
    write_audit_log(
        db,
        user_id=user.id,
        action="create",
        entity_type="industrial_park",
        entity_id=park.id,
        ip=get_client_ip(request),
    )
    db.commit()
    db.refresh(park)
    return _industrial_park_out(park, job_count=0)


@industrial_parks_router.patch("/{park_id}", response_model=IndustrialParkAdminOut)
def update_industrial_park_admin(
    park_id: int,
    payload: IndustrialParkAdminUpdate,
    request: Request,
    db: Session = Depends(get_db),
    user: User = Depends(require_roles(*EDITOR_ROLES)),
) -> IndustrialParkAdminOut:
    park = _get_industrial_park_or_404(db, park_id)
    data = payload.model_dump(exclude_unset=True)

    if "province_code" in data and db.get(Province, data["province_code"]) is None:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail="Mã tỉnh không tồn tại"
        )

    # Không regenerate slug theo `name` — jobs đã publish đang tham chiếu slug này.
    for field, value in data.items():
        setattr(park, field, value)

    write_audit_log(
        db,
        user_id=user.id,
        action="update",
        entity_type="industrial_park",
        entity_id=park.id,
        ip=get_client_ip(request),
        meta={"fields": sorted(data.keys())},
    )
    db.commit()
    db.refresh(park)
    return _industrial_park_out(park, _industrial_park_job_count(db, park.id))


@industrial_parks_router.delete("/{park_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_industrial_park_admin(
    park_id: int,
    request: Request,
    db: Session = Depends(get_db),
    user: User = Depends(require_roles(*DELETE_ROLES)),
) -> None:
    park = _get_industrial_park_or_404(db, park_id)
    job_count = _industrial_park_job_count(db, park.id)
    if job_count > 0:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Không thể xoá: đang có {job_count} tin tuyển dụng thuộc khu công nghiệp này.",
        )

    write_audit_log(
        db,
        user_id=user.id,
        action="delete",
        entity_type="industrial_park",
        entity_id=park.id,
        ip=get_client_ip(request),
    )
    db.delete(park)
    try:
        db.commit()
    except IntegrityError as exc:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Không thể xoá vì khu công nghiệp này đang được tham chiếu",
        ) from exc


# ---------------------------------------------------------------------------
# Tỉnh/Thành (Province) — PK là `code` do người dùng nhập, không có slug/id
# ---------------------------------------------------------------------------

provinces_router = APIRouter(prefix="/api/admin/provinces", tags=["admin-taxonomies"])


def _province_reference_counts(db: Session, code: str) -> dict[str, int]:
    return {
        "jobs": db.execute(
            select(func.count()).select_from(Job).where(Job.province_code == code)
        ).scalar_one(),
        "industrial_parks": db.execute(
            select(func.count())
            .select_from(IndustrialPark)
            .where(IndustrialPark.province_code == code)
        ).scalar_one(),
        "applications": db.execute(
            select(func.count()).select_from(Application).where(Application.province_code == code)
        ).scalar_one(),
    }


def _province_out(province: Province, job_count: int) -> ProvinceAdminOut:
    return ProvinceAdminOut(
        code=province.code,
        name=province.name,
        type=province.type,
        is_active=province.is_active,
        job_count=job_count,
    )


def _get_province_or_404(db: Session, code: str) -> Province:
    province = db.get(Province, code)
    if province is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Không tìm thấy tỉnh/thành"
        )
    return province


@provinces_router.get("", response_model=list[ProvinceAdminOut])
def list_provinces_admin(
    db: Session = Depends(get_db),
    _user: User = Depends(require_roles(*VIEW_ROLES)),
) -> list[ProvinceAdminOut]:
    job_counts = (
        select(Job.province_code, func.count().label("job_count")).group_by(Job.province_code)
    ).subquery()
    rows = db.execute(
        select(Province, func.coalesce(job_counts.c.job_count, 0))
        .outerjoin(job_counts, job_counts.c.province_code == Province.code)
        .order_by(Province.name)
    ).all()
    return [_province_out(province, count) for province, count in rows]


@provinces_router.post("", response_model=ProvinceAdminOut, status_code=status.HTTP_201_CREATED)
def create_province_admin(
    payload: ProvinceAdminCreate,
    request: Request,
    db: Session = Depends(get_db),
    user: User = Depends(require_roles(*EDITOR_ROLES)),
) -> ProvinceAdminOut:
    if db.get(Province, payload.code) is not None:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT, detail="Mã tỉnh này đã tồn tại"
        )
    province = Province(**payload.model_dump())
    db.add(province)
    db.flush()
    write_audit_log(
        db,
        user_id=user.id,
        action="create",
        entity_type="province",
        # entity_id là int, Province PK là chuỗi mã GSO — ghi vào meta thay vì ép kiểu.
        meta={"code": province.code},
        ip=get_client_ip(request),
    )
    db.commit()
    db.refresh(province)
    return _province_out(province, job_count=0)


@provinces_router.patch("/{code}", response_model=ProvinceAdminOut)
def update_province_admin(
    code: str,
    payload: ProvinceAdminUpdate,
    request: Request,
    db: Session = Depends(get_db),
    user: User = Depends(require_roles(*EDITOR_ROLES)),
) -> ProvinceAdminOut:
    province = _get_province_or_404(db, code)
    data = payload.model_dump(exclude_unset=True)

    for field, value in data.items():
        setattr(province, field, value)

    write_audit_log(
        db,
        user_id=user.id,
        action="update",
        entity_type="province",
        meta={"code": province.code, "fields": sorted(data.keys())},
        ip=get_client_ip(request),
    )
    db.commit()
    db.refresh(province)
    job_count = db.execute(
        select(func.count()).select_from(Job).where(Job.province_code == province.code)
    ).scalar_one()
    return _province_out(province, job_count)


@provinces_router.delete("/{code}", status_code=status.HTTP_204_NO_CONTENT)
def delete_province_admin(
    code: str,
    request: Request,
    db: Session = Depends(get_db),
    user: User = Depends(require_roles(*DELETE_ROLES)),
) -> None:
    province = _get_province_or_404(db, code)
    counts = _province_reference_counts(db, province.code)
    if any(counts.values()):
        parts = []
        if counts["jobs"]:
            parts.append(f"{counts['jobs']} tin tuyển dụng")
        if counts["industrial_parks"]:
            parts.append(f"{counts['industrial_parks']} khu công nghiệp")
        if counts["applications"]:
            parts.append(f"{counts['applications']} hồ sơ ứng tuyển")
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Không thể xoá: đang có {', '.join(parts)} tham chiếu tới tỉnh/thành này. "
            "Hãy ẩn thay vì xoá.",
        )

    write_audit_log(
        db,
        user_id=user.id,
        action="delete",
        entity_type="province",
        meta={"code": province.code},
        ip=get_client_ip(request),
    )
    db.delete(province)
    try:
        db.commit()
    except IntegrityError as exc:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Không thể xoá vì tỉnh/thành này đang được tham chiếu",
        ) from exc
