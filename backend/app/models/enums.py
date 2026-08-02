import enum


def enum_values(enum_cls: type[enum.Enum]) -> list[str]:
    """values_callable cho sa.Enum — lưu giá trị .value (chữ thường) thay vì tên member."""
    return [e.value for e in enum_cls]


class JobStatus(enum.StrEnum):
    DRAFT = "draft"
    PUBLISHED = "published"
    CLOSED = "closed"
    ARCHIVED = "archived"


class ApplicationSource(enum.StrEnum):
    WEB = "web"
    CHATBOT = "chatbot"
    ZALO = "zalo"
    FACEBOOK = "facebook"
    WALK_IN = "walk_in"


class ApplicationStatus(enum.StrEnum):
    NEW = "new"
    CONTACTED = "contacted"
    INTERVIEWING = "interviewing"
    HIRED = "hired"
    REJECTED = "rejected"


class Gender(enum.StrEnum):
    MALE = "male"
    FEMALE = "female"
    OTHER = "other"


class PostType(enum.StrEnum):
    NEWS = "news"
    POLICY = "policy"
    GUIDE = "guide"
    SCAM_ALERT = "scam_alert"
    EVENT = "event"


class PostStatus(enum.StrEnum):
    DRAFT = "draft"
    PUBLISHED = "published"
    ARCHIVED = "archived"


class UserRole(enum.StrEnum):
    ADMIN = "admin"
    MANAGER = "manager"
    STAFF = "staff"
