from datetime import UTC, date, datetime, timedelta

from fastapi import (
    APIRouter,
    BackgroundTasks,
    Depends,
    File,
    Form,
    HTTPException,
    Request,
    UploadFile,
    status,
)
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.notify import notify_new_application
from app.core.rate_limit import get_client_ip, limiter
from app.core.reference_code import generate_reference_code
from app.core.storage import FileTooLargeError, UnsupportedFileTypeError, save_upload_stream
from app.db.session import get_db
from app.models import Application, Job, Province
from app.models.enums import ApplicationSource, ApplicationStatus, Gender, JobStatus
from app.schemas.application import (
    CONSENT_VERSION,
    ApplicationCreateResponse,
    normalize_phone,
    strip_html,
)

router = APIRouter(prefix="/api", tags=["applications"])

# D10: anti-spam bằng honeypot + timing, không dùng captcha ở MVP (chỉ thêm khi bị
# spam thật). Bot điền form tự động thường: (a) tự điền cả field ẩn, (b) submit gần
# như tức thời sau khi trang render — người thật luôn mất vài giây đọc + gõ.
MIN_HUMAN_ELAPSED_MS = 2000
DUPLICATE_WINDOW_DAYS = 7
PHONE_DAILY_LIMIT = 10


def _is_bot(honeypot: str, form_rendered_at: str) -> bool:
    if honeypot.strip():
        return True
    try:
        rendered_at = datetime.fromisoformat(form_rendered_at.replace("Z", "+00:00"))
    except ValueError:
        return True  # field bị giả mạo/thiếu — coi như đáng ngờ, chặn cho an toàn
    elapsed_ms = (datetime.now(UTC) - rendered_at).total_seconds() * 1000
    return elapsed_ms < MIN_HUMAN_ELAPSED_MS


@router.post("/applications", response_model=ApplicationCreateResponse)
@limiter.limit("5/hour")
def create_application(
    request: Request,
    background_tasks: BackgroundTasks,
    full_name: str = Form(..., min_length=2, max_length=150),
    phone: str = Form(...),
    email: str | None = Form(None, max_length=200),
    birth_date: date | None = Form(None),
    gender: Gender | None = Form(None),
    province_code: str | None = Form(None),
    hometown_text: str | None = Form(None, max_length=200),
    job_slug: str = Form(...),
    consent_given: bool = Form(False),
    website: str = Form(""),  # honeypot — ẩn khỏi mắt người, bot tự động thường tự điền
    form_rendered_at: str = Form(...),
    cv: UploadFile = File(...),
    db: Session = Depends(get_db),
) -> ApplicationCreateResponse:
    # Không bao giờ log body/field của endpoint này (họ tên, SĐT, email là PII) —
    # kể cả khi xử lý lỗi, chỉ raise HTTPException với thông điệp chung chung.

    if _is_bot(website, form_rendered_at):
        # Từ chối im lặng: trả về y hệt response thành công thật (không tạo bản ghi)
        # để bot không học được rằng nó đã bị phát hiện.
        return ApplicationCreateResponse(ok=True, reference_code=generate_reference_code(db))

    if not consent_given:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Bạn cần đồng ý với chính sách bảo mật để gửi hồ sơ",
        )

    try:
        normalized_phone = normalize_phone(phone)
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail=str(exc)
        ) from exc

    job = db.execute(
        select(Job).where(Job.slug == job_slug, Job.status == JobStatus.PUBLISHED)
    ).scalar_one_or_none()
    if job is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Không tìm thấy tin tuyển dụng"
        )

    if province_code is not None and db.get(Province, province_code) is None:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=f"Không tìm thấy tỉnh/thành với mã '{province_code}'",
        )

    now = datetime.now(UTC)

    # Chống trùng: cùng (job, số điện thoại) trong 7 ngày → báo thân thiện, không
    # tạo thêm bản ghi mới (khác honeypot — đây là người thật, cần biết vì sao).
    duplicate = db.execute(
        select(Application)
        .where(
            Application.job_id == job.id,
            Application.phone == normalized_phone,
            Application.created_at >= now - timedelta(days=DUPLICATE_WINDOW_DAYS),
        )
        .order_by(Application.created_at.desc())
    ).scalars().first()
    if duplicate is not None:
        return ApplicationCreateResponse(
            ok=True,
            reference_code=duplicate.reference_code,
            duplicate=True,
            message=(
                "Bạn đã gửi hồ sơ ứng tuyển vị trí này trong 7 ngày qua. "
                "LA Group sẽ liên hệ sớm nhất."
            ),
        )

    daily_count = db.execute(
        select(Application.id).where(
            Application.phone == normalized_phone,
            Application.created_at >= now - timedelta(hours=24),
        )
    ).scalars().all()
    if len(daily_count) >= PHONE_DAILY_LIMIT:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail=(
                "Số điện thoại này đã gửi quá nhiều hồ sơ trong 24 giờ qua, "
                "vui lòng thử lại sau"
            ),
        )

    try:
        saved_file = save_upload_stream(cv.file)
    except UnsupportedFileTypeError as exc:
        raise HTTPException(
            status_code=status.HTTP_415_UNSUPPORTED_MEDIA_TYPE, detail=str(exc)
        ) from exc
    except FileTooLargeError as exc:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE, detail=str(exc)
        ) from exc

    application = Application(
        reference_code=generate_reference_code(db),
        job_id=job.id,
        full_name=strip_html(full_name),
        phone=normalized_phone,
        email=email,
        birth_date=birth_date,
        gender=gender,
        province_code=province_code,
        hometown_text=strip_html(hometown_text) if hometown_text else None,
        cv_file_path=saved_file.relative_path,
        cv_original_name=cv.filename,
        cv_mime=saved_file.mime,
        cv_size=saved_file.size,
        source=ApplicationSource.WEB,
        status=ApplicationStatus.NEW,
        consent_given=True,
        consent_version=CONSENT_VERSION,
        consent_at=now,
        consent_ip=get_client_ip(request),
        user_agent=request.headers.get("user-agent"),
    )
    db.add(application)
    db.commit()

    background_tasks.add_task(
        notify_new_application,
        reference_code=application.reference_code,
        job_title=job.title,
        full_name=application.full_name,
        phone=application.phone,
    )

    return ApplicationCreateResponse(ok=True, reference_code=application.reference_code)
