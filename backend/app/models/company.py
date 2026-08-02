from sqlalchemy import Boolean, String
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base
from app.db.mixins import IdMixin, TimestampMixin


class Company(IdMixin, TimestampMixin, Base):
    __tablename__ = "companies"

    slug: Mapped[str] = mapped_column(String(150), unique=True, index=True)
    name: Mapped[str] = mapped_column(String(200))
    display_name_public: Mapped[str | None] = mapped_column(String(200), default=None)
    logo_initials: Mapped[str | None] = mapped_column(String(10), default=None)
    logo_url: Mapped[str | None] = mapped_column(String(500), default=None)
    is_partner: Mapped[bool] = mapped_column(Boolean, default=True)
