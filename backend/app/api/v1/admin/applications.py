import csv
import io
from datetime import UTC, date, datetime, time, timedelta

from fastapi import APIRouter, Depends, HTTPException, Query, Request, status
from fastapi.responses import FileResponse, StreamingResponse
from sqlalchemy import func, select
from sqlalchemy.orm import Session, selectinload

from app.api.deps import require_roles
from app.core.audit import write_audit_log
from app.core.rate_limit import get_client_ip
from app.core.storage import upload_root
from app.db.session import get_db
from app.models import Application, IndustrialPark, Job, User
from app.models.enums import ApplicationSource, ApplicationStatus, UserRole
from app.schemas.admin import ApplicationAdminOut, ApplicationAdminUpdate
from app.schemas.common import PageResponse

router = APIRouter(prefix="/api/admin/applications", tags=["admin-applications"])

# Xem/xử lý ứng viên là việc tác nghiệp hằng ngày (kể cả nhân viên tuyển dụng) —
# cả 3 role đều xem + cập nhật trạng thái/gán người phụ trách được.
VIEW_ROLES = (UserRole.ADMIN, UserRole.MANAGER, UserRole.STAFF)
UPDATE_ROLES = (UserRole.ADMIN, UserRole.MANAGER, UserRole.STAFF)
# Export CSV kéo PII hàng loạt ra khỏi hệ thống (rủi ro cao hơn hẳn xem từng hồ sơ) —
# thu hẹp như purge (P6), không mở cho staff.
EXPORT_ROLES = (UserRole.ADMIN, UserRole.MANAGER)
PURGE_ROLES = (UserRole.ADMIN, UserRole.MANAGER)

EXPORT_MAX_ROWS = 10_000

_EAGER_LOAD = (
    selectinload(Application.job),
    selectinload(Application.assigned_to),
    selectinload(Application.province),
)


def _compute_age(birth_date: date | None) -> int | None:
    if birth_date is None:
        return None
    today = date.today()
    had_birthday = (today.month, today.day) >= (birth_date.month, birth_date.day)
    return today.year - birth_date.year - (0 if had_birthday else 1)


def _application_admin_out(application: Application) -> ApplicationAdminOut:
    return ApplicationAdminOut(
        id=application.id,
        reference_code=application.reference_code,
        job_id=application.job_id,
        job_slug=application.job.slug if application.job else None,
        job_title=application.job.title if application.job else None,
        full_name=application.full_name,
        phone=application.phone,
        email=application.email,
        birth_date=application.birth_date,
        age=_compute_age(application.birth_date),
        gender=application.gender.value if application.gender else None,
        province_code=application.province_code,
        province_name=application.province.name if application.province else None,
        hometown_text=application.hometown_text,
        has_cv=application.cv_file_path is not None,
        cv_original_name=application.cv_original_name,
        source=application.source.value,
        status=application.status.value,
        assigned_to_id=application.assigned_to_id,
        assigned_to_email=application.assigned_to.email if application.assigned_to else None,
        purged_at=application.purged_at,
        created_at=application.created_at,
    )


def _get_application_or_404(db: Session, application_id: int) -> Application:
    application = db.get(Application, application_id)
    if application is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Không tìm thấy hồ sơ ứng tuyển"
        )
    return application


def _build_conditions(
    db: Session,
    *,
    status_filter: ApplicationStatus | None,
    source_filter: ApplicationSource | None,
    job_id: int | None,
    industrial_park_slug: str | None,
    province_code: str | None,
    assigned_to_id: int | None,
    unassigned_only: bool,
    q: str | None,
    date_from: date | None,
    date_to: date | None,
) -> list:
    conditions = []
    if status_filter is not None:
        conditions.append(Application.status == status_filter)
    if source_filter is not None:
        conditions.append(Application.source == source_filter)
    if job_id is not None:
        conditions.append(Application.job_id == job_id)
    if industrial_park_slug:
        park = db.execute(
            select(IndustrialPark).filter_by(slug=industrial_park_slug)
        ).scalar_one_or_none()
        if park is None:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail=f"Không tìm thấy khu công nghiệp với slug '{industrial_park_slug}'",
            )
        conditions.append(
            Application.job_id.in_(select(Job.id).where(Job.industrial_park_id == park.id))
        )
    if province_code:
        conditions.append(Application.province_code == province_code)
    if unassigned_only:
        conditions.append(Application.assigned_to_id.is_(None))
    elif assigned_to_id is not None:
        conditions.append(Application.assigned_to_id == assigned_to_id)
    if q:
        like = f"%{q}%"
        conditions.append(
            (Application.full_name.ilike(like))
            | (Application.phone.ilike(like))
            | (Application.reference_code.ilike(like))
        )
    if date_from:
        conditions.append(
            Application.created_at >= datetime.combine(date_from, time.min, tzinfo=UTC)
        )
    if date_to:
        conditions.append(
            Application.created_at
            < datetime.combine(date_to + timedelta(days=1), time.min, tzinfo=UTC)
        )
    return conditions


@router.get("", response_model=PageResponse[ApplicationAdminOut])
def list_applications_admin(
    status_filter: ApplicationStatus | None = Query(default=None, alias="status"),
    source_filter: ApplicationSource | None = Query(default=None, alias="source"),
    job_id: int | None = None,
    industrial_park_slug: str | None = None,
    province_code: str | None = None,
    assigned_to_id: int | None = None,
    unassigned_only: bool = False,
    q: str | None = None,
    date_from: date | None = None,
    date_to: date | None = None,
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
    _user: User = Depends(require_roles(*VIEW_ROLES)),
) -> PageResponse[ApplicationAdminOut]:
    conditions = _build_conditions(
        db,
        status_filter=status_filter,
        source_filter=source_filter,
        job_id=job_id,
        industrial_park_slug=industrial_park_slug,
        province_code=province_code,
        assigned_to_id=assigned_to_id,
        unassigned_only=unassigned_only,
        q=q,
        date_from=date_from,
        date_to=date_to,
    )

    total = db.execute(
        select(func.count()).select_from(Application).where(*conditions)
    ).scalar_one()
    applications = db.execute(
        select(Application)
        .where(*conditions)
        .options(*_EAGER_LOAD)
        .order_by(Application.created_at.desc())
        .offset((page - 1) * page_size)
        .limit(page_size)
    ).scalars().all()
    return PageResponse(
        items=[_application_admin_out(a) for a in applications],
        total=total,
        page=page,
        page_size=page_size,
    )


@router.get("/export.csv")
def export_applications_csv(
    request: Request,
    status_filter: ApplicationStatus | None = Query(default=None, alias="status"),
    source_filter: ApplicationSource | None = Query(default=None, alias="source"),
    job_id: int | None = None,
    industrial_park_slug: str | None = None,
    province_code: str | None = None,
    assigned_to_id: int | None = None,
    unassigned_only: bool = False,
    q: str | None = None,
    date_from: date | None = None,
    date_to: date | None = None,
    db: Session = Depends(get_db),
    user: User = Depends(require_roles(*EXPORT_ROLES)),
) -> StreamingResponse:
    conditions = _build_conditions(
        db,
        status_filter=status_filter,
        source_filter=source_filter,
        job_id=job_id,
        industrial_park_slug=industrial_park_slug,
        province_code=province_code,
        assigned_to_id=assigned_to_id,
        unassigned_only=unassigned_only,
        q=q,
        date_from=date_from,
        date_to=date_to,
    )
    applications = db.execute(
        select(Application)
        .where(*conditions)
        .options(*_EAGER_LOAD)
        .order_by(Application.created_at.desc())
        .limit(EXPORT_MAX_ROWS)
    ).scalars().all()

    buffer = io.StringIO()
    buffer.write("﻿")  # BOM — Excel mở file UTF-8 tiếng Việt không bị vỡ dấu
    writer = csv.writer(buffer)
    writer.writerow(
        [
            "Mã hồ sơ", "Vị trí ứng tuyển", "Họ tên", "Số điện thoại", "Email",
            "Ngày sinh", "Tuổi", "Giới tính", "Tỉnh/thành", "Quê quán (nhập tay)",
            "Nguồn", "Trạng thái", "Người phụ trách", "Ngày nộp",
        ]
    )
    for a in applications:
        out = _application_admin_out(a)
        writer.writerow(
            [
                out.reference_code, out.job_title or "", out.full_name, out.phone,
                out.email or "", out.birth_date or "", out.age or "", out.gender or "",
                out.province_name or "", out.hometown_text or "", out.source, out.status,
                out.assigned_to_email or "", out.created_at.isoformat(),
            ]
        )

    write_audit_log(
        db,
        user_id=user.id,
        action="export_csv",
        entity_type="application",
        ip=get_client_ip(request),
        meta={"count": len(applications)},
    )
    db.commit()

    return StreamingResponse(
        iter([buffer.getvalue()]),
        media_type="text/csv; charset=utf-8",
        headers={"Content-Disposition": "attachment; filename=ung-vien.csv"},
    )


@router.get("/{application_id}", response_model=ApplicationAdminOut)
def get_application_admin(
    application_id: int,
    db: Session = Depends(get_db),
    _user: User = Depends(require_roles(*VIEW_ROLES)),
) -> ApplicationAdminOut:
    application = db.execute(
        select(Application).where(Application.id == application_id).options(*_EAGER_LOAD)
    ).scalar_one_or_none()
    if application is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Không tìm thấy hồ sơ ứng tuyển"
        )
    return _application_admin_out(application)


@router.get("/{application_id}/cv")
def download_application_cv(
    application_id: int,
    request: Request,
    db: Session = Depends(get_db),
    user: User = Depends(require_roles(*VIEW_ROLES)),
) -> FileResponse:
    application = _get_application_or_404(db, application_id)
    if application.cv_file_path is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Hồ sơ này chưa có CV")

    absolute_path = upload_root() / application.cv_file_path
    if not absolute_path.is_file():
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Không tìm thấy file CV")

    write_audit_log(
        db,
        user_id=user.id,
        action="download_cv",
        entity_type="application",
        entity_id=application.id,
        ip=get_client_ip(request),
    )
    db.commit()

    # FileResponse mặc định content_disposition_type="attachment" (Starlette) —
    # không bao giờ render inline (security.md); `nosniff` đã có sẵn qua
    # security_headers_middleware toàn cục ở app/main.py.
    extension = absolute_path.suffix
    return FileResponse(
        path=absolute_path,
        media_type=application.cv_mime or "application/octet-stream",
        filename=f"{application.reference_code}{extension}",
    )


@router.patch("/{application_id}", response_model=ApplicationAdminOut)
def update_application_admin(
    application_id: int,
    payload: ApplicationAdminUpdate,
    request: Request,
    db: Session = Depends(get_db),
    user: User = Depends(require_roles(*UPDATE_ROLES)),
) -> ApplicationAdminOut:
    application = _get_application_or_404(db, application_id)
    data = payload.model_dump(exclude_unset=True)

    if "assigned_to_id" in data and data["assigned_to_id"] is not None:
        assignee = db.get(User, data["assigned_to_id"])
        if assignee is None or not assignee.is_active:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail="Không tìm thấy nhân viên để gán phụ trách",
            )

    for field, value in data.items():
        setattr(application, field, value)

    write_audit_log(
        db,
        user_id=user.id,
        action="update",
        entity_type="application",
        entity_id=application.id,
        ip=get_client_ip(request),
        meta={"fields": sorted(data.keys())},
    )
    db.commit()

    return _application_admin_out(_get_application_or_404(db, application.id))


@router.post("/{application_id}/purge", status_code=status.HTTP_204_NO_CONTENT)
def purge_application(
    application_id: int,
    request: Request,
    db: Session = Depends(get_db),
    user: User = Depends(require_roles(*PURGE_ROLES)),
) -> None:
    """Xoá dữ liệu cá nhân theo yêu cầu của ứng viên (NĐ13/2023) — giữ lại
    `reference_code`/`job_id`/`status`/`created_at` để không phá vỡ thống kê tổng
    hợp (P7), chỉ xoá hẳn các trường định danh cá nhân + file CV trên đĩa."""
    application = _get_application_or_404(db, application_id)
    if application.purged_at is not None:
        return  # đã xoá trước đó — idempotent, không báo lỗi

    if application.cv_file_path:
        (upload_root() / application.cv_file_path).unlink(missing_ok=True)

    application.full_name = "Đã xoá theo yêu cầu"
    application.phone = "0000000000"
    application.email = None
    application.birth_date = None
    application.hometown_text = None
    application.cv_file_path = None
    application.cv_original_name = None
    application.cv_mime = None
    application.cv_size = None
    application.purged_at = datetime.now(UTC)

    write_audit_log(
        db,
        user_id=user.id,
        action="purge",
        entity_type="application",
        entity_id=application.id,
        ip=get_client_ip(request),
    )
    db.commit()
