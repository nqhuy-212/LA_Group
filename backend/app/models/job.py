from datetime import date, datetime
from typing import TYPE_CHECKING

from sqlalchemy import Boolean, Date, DateTime, ForeignKey, Integer, String, Text
from sqlalchemy import Enum as SAEnum
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base
from app.db.mixins import IdMixin, TimestampMixin
from app.models.enums import JobStatus, enum_values

if TYPE_CHECKING:
    from app.models.company import Company
    from app.models.industrial_park import IndustrialPark
    from app.models.job_category import JobCategory
    from app.models.province import Province


class Job(IdMixin, TimestampMixin, Base):
    __tablename__ = "jobs"

    slug: Mapped[str] = mapped_column(String(220), unique=True, index=True)
    title: Mapped[str] = mapped_column(String(200))

    company_id: Mapped[int] = mapped_column(ForeignKey("companies.id"))
    category_id: Mapped[int] = mapped_column(ForeignKey("job_categories.id"))
    industrial_park_id: Mapped[int | None] = mapped_column(
        ForeignKey("industrial_parks.id"), default=None
    )
    province_code: Mapped[str] = mapped_column(ForeignKey("provinces.code"))

    salary_min: Mapped[int | None] = mapped_column(Integer, default=None)
    salary_max: Mapped[int | None] = mapped_column(Integer, default=None)
    salary_negotiable: Mapped[bool] = mapped_column(Boolean, default=False)

    quantity: Mapped[int] = mapped_column(Integer, default=1)
    age_min: Mapped[int | None] = mapped_column(Integer, default=None)
    age_max: Mapped[int | None] = mapped_column(Integer, default=None)
    shift_type: Mapped[str | None] = mapped_column(String(50), default=None)
    employment_type: Mapped[str | None] = mapped_column(String(50), default=None)

    description: Mapped[str | None] = mapped_column(Text, default=None)
    requirements: Mapped[str | None] = mapped_column(Text, default=None)
    benefits: Mapped[str | None] = mapped_column(Text, default=None)

    deadline: Mapped[date | None] = mapped_column(Date, default=None)
    status: Mapped[JobStatus] = mapped_column(
        SAEnum(JobStatus, name="job_status", values_callable=enum_values),
        default=JobStatus.DRAFT,
    )
    is_hot: Mapped[bool] = mapped_column(Boolean, default=False)
    published_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), default=None)
    view_count: Mapped[int] = mapped_column(Integer, default=0)

    meta_title: Mapped[str | None] = mapped_column(String(200), default=None)
    meta_description: Mapped[str | None] = mapped_column(String(300), default=None)

    company: Mapped["Company"] = relationship()
    category: Mapped["JobCategory"] = relationship()
    industrial_park: Mapped["IndustrialPark | None"] = relationship()
    province: Mapped["Province"] = relationship()
