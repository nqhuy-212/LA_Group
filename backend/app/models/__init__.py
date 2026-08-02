# Import mỗi model tường minh ở đây và thêm vào __all__ khi tạo.
# Bắt buộc — quên re-export = model không đăng ký vào Base.metadata =
# alembic --autogenerate sinh nhầm lệnh drop_table cho bảng đó.
from app.models.address_mapping import AddressMapping
from app.models.application import Application
from app.models.audit_log import AuditLog
from app.models.company import Company
from app.models.industrial_park import IndustrialPark
from app.models.job import Job
from app.models.job_category import JobCategory
from app.models.post import Post
from app.models.province import Province
from app.models.refresh_token import RefreshToken
from app.models.user import User

__all__ = [
    "AddressMapping",
    "Application",
    "AuditLog",
    "Company",
    "IndustrialPark",
    "Job",
    "JobCategory",
    "Post",
    "Province",
    "RefreshToken",
    "User",
]
