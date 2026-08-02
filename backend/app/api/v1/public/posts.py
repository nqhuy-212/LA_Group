from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models import Post
from app.models.enums import PostStatus, PostType
from app.schemas.post import PostDetail, PostListItem

router = APIRouter(prefix="/api", tags=["posts"])


def _post_list_item(post: Post) -> PostListItem:
    return PostListItem(
        slug=post.slug,
        title=post.title,
        excerpt=post.excerpt,
        cover_image_url=post.cover_image_url,
        type=post.type.value,
        published_at=post.published_at,
    )


@router.get("/posts", response_model=list[PostListItem])
def list_posts(
    type: str | None = None,
    limit: int = Query(10, ge=1, le=50),
    db: Session = Depends(get_db),
) -> list[PostListItem]:
    conditions = [Post.status == PostStatus.PUBLISHED]
    if type:
        # Chấp nhận danh sách phân tách bằng dấu phẩy (?type=news,policy,guide) —
        # trang chủ cần trộn nhiều loại nội dung trong cùng 1 khối "Tin tức & Chính sách".
        try:
            requested_types = [PostType(t.strip()) for t in type.split(",") if t.strip()]
        except ValueError as exc:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail="type không hợp lệ"
            ) from exc
        conditions.append(Post.type.in_(requested_types))

    posts = db.execute(
        select(Post).where(*conditions).order_by(Post.published_at.desc()).limit(limit)
    ).scalars().all()
    return [_post_list_item(post) for post in posts]


@router.get("/posts/{slug}", response_model=PostDetail)
def get_post(slug: str, db: Session = Depends(get_db)) -> PostDetail:
    post = db.execute(
        select(Post).where(Post.slug == slug, Post.status == PostStatus.PUBLISHED)
    ).scalar_one_or_none()
    if post is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Không tìm thấy bài viết")

    base = _post_list_item(post)
    return PostDetail(
        **base.model_dump(),
        content=post.content,
        meta_title=post.meta_title,
        meta_description=post.meta_description,
    )
