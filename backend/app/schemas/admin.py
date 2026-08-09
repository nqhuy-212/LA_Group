from datetime import date, datetime

from pydantic import BaseModel, Field, field_validator

from app.models.enums import (
    ApplicationStatus,
    EmploymentType,
    JobStatus,
    PostStatus,
    PostType,
    SalaryPeriod,
)

# ---------------------------------------------------------------------------
# Jobs
# ---------------------------------------------------------------------------


class JobAdminBase(BaseModel):
    salary_min: int | None = None
    salary_max: int | None = None
    salary_negotiable: bool = False
    quantity: int = Field(default=1, ge=1)
    age_min: int | None = Field(default=None, ge=15, le=100)
    age_max: int | None = Field(default=None, ge=15, le=100)
    shift_type: str | None = Field(default=None, max_length=50)
    employment_type: EmploymentType | None = None
    salary_period: SalaryPeriod | None = None
    description: str | None = None
    requirements: str | None = None
    benefits: str | None = None
    deadline: date | None = None
    status: JobStatus = JobStatus.DRAFT
    is_hot: bool = False
    meta_title: str | None = Field(default=None, max_length=200)
    meta_description: str | None = Field(default=None, max_length=300)

    @field_validator("salary_max")
    @classmethod
    def _salary_order(cls, v: int | None, info) -> int | None:
        salary_min = info.data.get("salary_min")
        if v is not None and salary_min is not None and v < salary_min:
            raise ValueError("Mức lương tối đa phải lớn hơn hoặc bằng mức lương tối thiểu")
        return v


class JobAdminCreate(JobAdminBase):
    title: str = Field(min_length=3, max_length=200)
    company_slug: str
    category_slug: str
    industrial_park_slug: str | None = None
    province_code: str


class JobAdminUpdate(BaseModel):
    title: str | None = Field(default=None, min_length=3, max_length=200)
    company_slug: str | None = None
    category_slug: str | None = None
    industrial_park_slug: str | None = None
    province_code: str | None = None
    salary_min: int | None = None
    salary_max: int | None = None
    salary_negotiable: bool | None = None
    quantity: int | None = Field(default=None, ge=1)
    age_min: int | None = Field(default=None, ge=15, le=100)
    age_max: int | None = Field(default=None, ge=15, le=100)
    shift_type: str | None = Field(default=None, max_length=50)
    employment_type: EmploymentType | None = None
    salary_period: SalaryPeriod | None = None
    description: str | None = None
    requirements: str | None = None
    benefits: str | None = None
    deadline: date | None = None
    status: JobStatus | None = None
    is_hot: bool | None = None
    meta_title: str | None = Field(default=None, max_length=200)
    meta_description: str | None = Field(default=None, max_length=300)


class JobAdminOut(BaseModel):
    id: int
    slug: str
    title: str
    company_slug: str
    company_name: str
    category_slug: str
    category_name: str
    industrial_park_slug: str | None
    industrial_park_name: str | None
    province_code: str
    province_name: str
    salary_min: int | None
    salary_max: int | None
    salary_negotiable: bool
    quantity: int
    age_min: int | None
    age_max: int | None
    shift_type: str | None
    employment_type: EmploymentType | None
    salary_period: SalaryPeriod | None
    description: str | None
    requirements: str | None
    benefits: str | None
    deadline: date | None
    status: str
    is_hot: bool
    published_at: datetime | None
    view_count: int
    meta_title: str | None
    meta_description: str | None
    created_at: datetime
    updated_at: datetime


# ---------------------------------------------------------------------------
# Posts
# ---------------------------------------------------------------------------


class PostAdminBase(BaseModel):
    excerpt: str | None = Field(default=None, max_length=500)
    content: str | None = None
    cover_image_url: str | None = Field(default=None, max_length=500)
    status: PostStatus = PostStatus.DRAFT
    meta_title: str | None = Field(default=None, max_length=200)
    meta_description: str | None = Field(default=None, max_length=300)


class PostAdminCreate(PostAdminBase):
    title: str = Field(min_length=3, max_length=200)
    type: PostType


class PostAdminUpdate(BaseModel):
    title: str | None = Field(default=None, min_length=3, max_length=200)
    type: PostType | None = None
    excerpt: str | None = Field(default=None, max_length=500)
    content: str | None = None
    cover_image_url: str | None = Field(default=None, max_length=500)
    status: PostStatus | None = None
    meta_title: str | None = Field(default=None, max_length=200)
    meta_description: str | None = Field(default=None, max_length=300)


class PostAdminOut(BaseModel):
    id: int
    slug: str
    title: str
    excerpt: str | None
    content: str | None
    cover_image_url: str | None
    type: str
    status: str
    published_at: datetime | None
    meta_title: str | None
    meta_description: str | None
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


# ---------------------------------------------------------------------------
# Companies
# ---------------------------------------------------------------------------


class CompanyAdminBase(BaseModel):
    display_name_public: str | None = Field(default=None, max_length=200)
    logo_initials: str | None = Field(default=None, max_length=10)
    logo_url: str | None = Field(default=None, max_length=500)
    is_partner: bool = True


class CompanyAdminCreate(CompanyAdminBase):
    name: str = Field(min_length=2, max_length=200)


class CompanyAdminUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=2, max_length=200)
    display_name_public: str | None = Field(default=None, max_length=200)
    logo_initials: str | None = Field(default=None, max_length=10)
    logo_url: str | None = Field(default=None, max_length=500)
    is_partner: bool | None = None


class CompanyAdminOut(BaseModel):
    id: int
    slug: str
    name: str
    display_name_public: str | None
    logo_initials: str | None
    logo_url: str | None
    is_partner: bool
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


# ---------------------------------------------------------------------------
# Applications
# ---------------------------------------------------------------------------


class ApplicationAdminOut(BaseModel):
    id: int
    reference_code: str
    job_id: int | None
    job_slug: str | None
    job_title: str | None
    full_name: str
    phone: str
    email: str | None
    birth_date: date | None
    age: int | None
    gender: str | None
    province_code: str | None
    province_name: str | None
    hometown_text: str | None
    has_cv: bool
    cv_original_name: str | None
    notes: str | None
    source: str
    status: str
    assigned_to_id: int | None
    assigned_to_email: str | None
    purged_at: datetime | None
    created_at: datetime


class ApplicationAdminUpdate(BaseModel):
    status: ApplicationStatus | None = None
    assigned_to_id: int | None = None


# ---------------------------------------------------------------------------
# Users (chỉ đọc — phục vụ dropdown "gán người phụ trách" ở P7; tạo/sửa tài
# khoản vẫn qua backend/scripts/create_user.py, không có endpoint ghi ở đây)
# ---------------------------------------------------------------------------


class UserAdminOut(BaseModel):
    id: int
    email: str
    role: str
