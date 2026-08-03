from datetime import UTC, datetime

from fastapi import APIRouter, Depends, HTTPException, Request, status
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session

from app.api.deps import require_roles
from app.core.audit import write_audit_log
from app.core.rate_limit import get_client_ip
from app.core.storage import upload_root
from app.db.session import get_db
from app.models import Application, User
from app.models.enums import UserRole

router = APIRouter(prefix="/api/admin/applications", tags=["admin-applications"])

VIEW_ROLES = (UserRole.ADMIN, UserRole.MANAGER, UserRole.STAFF)
# Xoá dữ liệu theo yêu cầu NĐ13/2023 là thao tác không thể hoàn tác — thu hẹp
# admin+manager, không mở cho staff (khác với xem/tải CV phục vụ tác nghiệp hàng ngày).
PURGE_ROLES = (UserRole.ADMIN, UserRole.MANAGER)


def _get_application_or_404(db: Session, application_id: int) -> Application:
    application = db.get(Application, application_id)
    if application is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Không tìm thấy hồ sơ ứng tuyển"
        )
    return application


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
