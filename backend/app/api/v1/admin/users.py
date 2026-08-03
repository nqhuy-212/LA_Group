from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.api.deps import require_roles
from app.db.session import get_db
from app.models import User
from app.models.enums import UserRole
from app.schemas.admin import UserAdminOut

router = APIRouter(prefix="/api/admin/users", tags=["admin-users"])

# Chỉ đọc — phục vụ dropdown "gán người phụ trách" cho Application (P7). Tạo/sửa
# tài khoản vẫn qua backend/scripts/create_user.py (không có endpoint ghi ở đây).
VIEW_ROLES = (UserRole.ADMIN, UserRole.MANAGER, UserRole.STAFF)


@router.get("", response_model=list[UserAdminOut])
def list_users_admin(
    db: Session = Depends(get_db),
    _user: User = Depends(require_roles(*VIEW_ROLES)),
) -> list[UserAdminOut]:
    users = db.execute(
        select(User).where(User.is_active.is_(True)).order_by(User.email)
    ).scalars().all()
    return [UserAdminOut(id=u.id, email=u.email, role=u.role.value) for u in users]
