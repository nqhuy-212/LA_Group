from datetime import date, datetime

from pydantic import BaseModel, Field, field_validator

from app.models.enums import JobStatus, PostStatus, PostType

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
    employment_type: str | None = Field(default=None, max_length=50)
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
    employment_type: str | None = Field(default=None, max_length=50)
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
    employment_type: str | None
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
