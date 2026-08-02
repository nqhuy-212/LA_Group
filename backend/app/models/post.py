from datetime import datetime

from sqlalchemy import DateTime, String, Text
from sqlalchemy import Enum as SAEnum
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base
from app.db.mixins import IdMixin, TimestampMixin
from app.models.enums import PostStatus, PostType, enum_values


class Post(IdMixin, TimestampMixin, Base):
    __tablename__ = "posts"

    slug: Mapped[str] = mapped_column(String(220), unique=True, index=True)
    title: Mapped[str] = mapped_column(String(200))
    excerpt: Mapped[str | None] = mapped_column(String(500), default=None)
    content: Mapped[str | None] = mapped_column(Text, default=None)
    cover_image_url: Mapped[str | None] = mapped_column(String(500), default=None)

    type: Mapped[PostType] = mapped_column(
        SAEnum(PostType, name="post_type", values_callable=enum_values),
    )
    status: Mapped[PostStatus] = mapped_column(
        SAEnum(PostStatus, name="post_status", values_callable=enum_values),
        default=PostStatus.DRAFT,
    )
    published_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), default=None)

    meta_title: Mapped[str | None] = mapped_column(String(200), default=None)
    meta_description: Mapped[str | None] = mapped_column(String(300), default=None)
