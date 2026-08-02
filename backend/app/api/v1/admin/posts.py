from datetime import UTC, datetime

from fastapi import APIRouter, Depends, HTTPException, Query, Request, status
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.api.deps import require_roles
from app.core.audit import write_audit_log
from app.core.rate_limit import get_client_ip
from app.core.slug import generate_unique_slug
from app.db.session import get_db
from app.models import Post, User
from app.models.enums import PostStatus, UserRole
from app.schemas.admin import PostAdminCreate, PostAdminOut, PostAdminUpdate
from app.schemas.common import PageResponse

router = APIRouter(prefix="/api/admin/posts", tags=["admin-posts"])

EDITOR_ROLES = (UserRole.ADMIN, UserRole.MANAGER, UserRole.STAFF)
DELETE_ROLES = (UserRole.ADMIN, UserRole.MANAGER)


def _get_post_or_404(db: Session, post_id: int) -> Post:
    post = db.get(Post, post_id)
    if post is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Không tìm thấy bài viết")
    return post


@router.get("", response_model=PageResponse[PostAdminOut])
def list_posts_admin(
    status_filter: PostStatus | None = Query(default=None, alias="status"),
    q: str | None = None,
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
    _user: User = Depends(require_roles(*EDITOR_ROLES)),
) -> PageResponse[PostAdminOut]:
    conditions = []
    if status_filter is not None:
        conditions.append(Post.status == status_filter)
    if q:
        conditions.append(Post.title.ilike(f"%{q}%"))

    total = db.execute(select(func.count()).select_from(Post).where(*conditions)).scalar_one()
    posts = db.execute(
        select(Post)
        .where(*conditions)
        .order_by(Post.created_at.desc())
        .offset((page - 1) * page_size)
        .limit(page_size)
    ).scalars().all()
    return PageResponse(
        items=[PostAdminOut.model_validate(p) for p in posts], total=total, page=page,
        page_size=page_size,
    )


@router.get("/{post_id}", response_model=PostAdminOut)
def get_post_admin(
    post_id: int, db: Session = Depends(get_db), _user: User = Depends(require_roles(*EDITOR_ROLES))
) -> PostAdminOut:
    return PostAdminOut.model_validate(_get_post_or_404(db, post_id))


@router.post("", response_model=PostAdminOut, status_code=status.HTTP_201_CREATED)
def create_post_admin(
    payload: PostAdminCreate,
    request: Request,
    db: Session = Depends(get_db),
    user: User = Depends(require_roles(*EDITOR_ROLES)),
) -> PostAdminOut:
    post = Post(**payload.model_dump(), slug=generate_unique_slug(db, Post, payload.title))
    if post.status == PostStatus.PUBLISHED:
        post.published_at = datetime.now(UTC)

    db.add(post)
    db.flush()
    write_audit_log(
        db,
        user_id=user.id,
        action="create",
        entity_type="post",
        entity_id=post.id,
        ip=get_client_ip(request),
    )
    db.commit()
    db.refresh(post)
    return PostAdminOut.model_validate(post)


@router.patch("/{post_id}", response_model=PostAdminOut)
def update_post_admin(
    post_id: int,
    payload: PostAdminUpdate,
    request: Request,
    db: Session = Depends(get_db),
    user: User = Depends(require_roles(*EDITOR_ROLES)),
) -> PostAdminOut:
    post = _get_post_or_404(db, post_id)
    data = payload.model_dump(exclude_unset=True)

    # Slug bất biến sau khi publish (seo.md) — chỉ regenerate khi bài CHƯA từng publish.
    if "title" in data and data["title"] != post.title and post.published_at is None:
        post.slug = generate_unique_slug(db, Post, data["title"], exclude_id=post.id)

    for field, value in data.items():
        setattr(post, field, value)

    if post.status == PostStatus.PUBLISHED and post.published_at is None:
        post.published_at = datetime.now(UTC)

    write_audit_log(
        db,
        user_id=user.id,
        action="update",
        entity_type="post",
        entity_id=post.id,
        ip=get_client_ip(request),
        meta={"fields": sorted(data.keys())},
    )
    db.commit()
    db.refresh(post)
    return PostAdminOut.model_validate(post)


@router.delete("/{post_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_post_admin(
    post_id: int,
    request: Request,
    db: Session = Depends(get_db),
    user: User = Depends(require_roles(*DELETE_ROLES)),
) -> None:
    post = _get_post_or_404(db, post_id)
    write_audit_log(
        db,
        user_id=user.id,
        action="delete",
        entity_type="post",
        entity_id=post.id,
        ip=get_client_ip(request),
    )
    db.delete(post)
    db.commit()
