from datetime import UTC, datetime

from fastapi import (
    APIRouter,
    BackgroundTasks,
    Depends,
    Form,
    HTTPException,
    Request,
    status,
)
from sqlalchemy.orm import Session

from app.core.antispam import PHONE_DAILY_LIMIT, count_recent_submissions_by_phone, is_bot
from app.core.notify import notify_new_application
from app.core.rate_limit import get_client_ip, limiter
from app.core.reference_code import generate_reference_code
from app.db.session import get_db
from app.models import Application
from app.models.enums import ApplicationSource, ApplicationStatus
from app.schemas.application import (
    CONSENT_VERSION,
    ApplicationCreateResponse,
    normalize_phone,
    strip_html,
)

router = APIRouter(prefix="/api", tags=["leads"])

DEFAULT_LEAD_NAME = "Khách qua chatbot"
MAX_NOTES_LENGTH = 500


@router.post("/leads", response_model=ApplicationCreateResponse)
@limiter.limit("5/hour")
def create_lead(
    request: Request,
    background_tasks: BackgroundTasks,
    phone: str = Form(...),
    full_name: str | None = Form(None, max_length=150),
    notes: str | None = Form(None, max_length=MAX_NOTES_LENGTH),
    consent_given: bool = Form(False),
    website: str = Form(""),  # honeypot — cùng cơ chế với /api/applications
    form_rendered_at: str = Form(...),
    db: Session = Depends(get_db),
) -> ApplicationCreateResponse:
    """Lead tư vấn chung từ chatbot (không gắn 1 tin tuyển dụng cụ thể) — ghi vào
    cùng bảng `applications` với `job_id=NULL`, `source=CHATBOT` (hardcode server-side,
    KHÔNG nhận từ client). Tách riêng khỏi `POST /api/applications` vì đó là endpoint
    rủi ro cao nhất hệ thống (PII, đã có nhiều test bao phủ) — xem CLAUDE.md.
    Không bao giờ log body/field của endpoint này (SĐT là PII).
    """
    if is_bot(website, form_rendered_at):
        return ApplicationCreateResponse(ok=True, reference_code=generate_reference_code(db))

    if not consent_given:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Bạn cần đồng ý với chính sách bảo mật để để lại thông tin",
        )

    try:
        normalized_phone = normalize_phone(phone)
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail=str(exc)
        ) from exc

    if count_recent_submissions_by_phone(db, normalized_phone) >= PHONE_DAILY_LIMIT:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail=(
                "Số điện thoại này đã gửi quá nhiều yêu cầu trong 24 giờ qua, "
                "vui lòng thử lại sau"
            ),
        )

    now = datetime.now(UTC)
    application = Application(
        reference_code=generate_reference_code(db),
        job_id=None,
        full_name=strip_html(full_name) if full_name else DEFAULT_LEAD_NAME,
        phone=normalized_phone,
        notes=strip_html(notes) if notes else None,
        source=ApplicationSource.CHATBOT,
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
        job_title=None,
        full_name=application.full_name,
        phone=application.phone,
    )

    return ApplicationCreateResponse(ok=True, reference_code=application.reference_code)
