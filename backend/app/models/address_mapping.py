from datetime import date

from sqlalchemy import Date, ForeignKey, String
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base
from app.db.mixins import IdMixin


class AddressMapping(IdMixin, Base):
    __tablename__ = "address_mappings"

    old_code: Mapped[str] = mapped_column(String(10), unique=True, index=True)
    old_name: Mapped[str] = mapped_column(String(120))
    new_code: Mapped[str] = mapped_column(ForeignKey("provinces.code"))
    level: Mapped[str] = mapped_column(String(30))
    effective_date: Mapped[date] = mapped_column(Date)
