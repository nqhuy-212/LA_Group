from datetime import datetime

from pydantic import BaseModel


class PostListItem(BaseModel):
    slug: str
    title: str
    excerpt: str | None
    cover_image_url: str | None
    type: str
    published_at: datetime | None


class PostDetail(PostListItem):
    content: str | None
    meta_title: str | None
    meta_description: str | None
