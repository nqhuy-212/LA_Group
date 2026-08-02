from sqlalchemy import ForeignKey, String
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base
from app.db.mixins import IdMixin, TimestampMixin


class IndustrialPark(IdMixin, TimestampMixin, Base):
    __tablename__ = "industrial_parks"

    slug: Mapped[str] = mapped_column(String(120), unique=True, index=True)
    name: Mapped[str] = mapped_column(String(200))
    province_code: Mapped[str] = mapped_column(ForeignKey("provinces.code"))
    district_name: Mapped[str | None] = mapped_column(String(120), default=None)
