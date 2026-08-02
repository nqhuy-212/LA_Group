from datetime import date, datetime
from typing import TYPE_CHECKING

from sqlalchemy import Boolean, Date, DateTime, ForeignKey, Integer, String
from sqlalchemy import Enum as SAEnum
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base
from app.db.mixins import IdMixin, TimestampMixin
from app.models.enums import ApplicationSource, ApplicationStatus, Gender, enum_values

if TYPE_CHECKING:
    from app.models.job import Job
    from app.models.user import User


class Application(IdMixin, TimestampMixin, Base):
    __tablename__ = "applications"

    reference_code: Mapped[str] = mapped_column(String(20), unique=True, index=True)
    job_id: Mapped[int | None] = mapped_column(ForeignKey("jobs.id"), default=None)

    full_name: Mapped[str] = mapped_column(String(150))
    phone: Mapped[str] = mapped_column(String(20))
    email: Mapped[str | None] = mapped_column(String(200), default=None)
    birth_date: Mapped[date | None] = mapped_column(Date, default=None)
    gender: Mapped[Gender | None] = mapped_column(
        SAEnum(Gender, name="gender", values_callable=enum_values),
        default=None,
    )

    province_code: Mapped[str | None] = mapped_column(ForeignKey("provinces.code"), default=None)
    hometown_text: Mapped[str | None] = mapped_column(String(200), default=None)

    cv_file_path: Mapped[str | None] = mapped_column(String(500), default=None)
    cv_original_name: Mapped[str | None] = mapped_column(String(255), default=None)
    cv_mime: Mapped[str | None] = mapped_column(String(100), default=None)
    cv_size: Mapped[int | None] = mapped_column(Integer, default=None)

    source: Mapped[ApplicationSource] = mapped_column(
        SAEnum(ApplicationSource, name="application_source", values_callable=enum_values),
        default=ApplicationSource.WEB,
    )
    status: Mapped[ApplicationStatus] = mapped_column(
        SAEnum(ApplicationStatus, name="application_status", values_callable=enum_values),
        default=ApplicationStatus.NEW,
    )
    assigned_to_id: Mapped[int | None] = mapped_column(ForeignKey("users.id"), default=None)

    consent_given: Mapped[bool] = mapped_column(Boolean, default=False)
    consent_version: Mapped[str | None] = mapped_column(String(20), default=None)
    consent_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), default=None)
    consent_ip: Mapped[str | None] = mapped_column(String(45), default=None)
    user_agent: Mapped[str | None] = mapped_column(String(500), default=None)

    purged_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), default=None)

    job: Mapped["Job | None"] = relationship()
    assigned_to: Mapped["User | None"] = relationship()
