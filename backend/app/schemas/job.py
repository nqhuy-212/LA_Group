from datetime import date, datetime

from pydantic import BaseModel


class CompanyPublic(BaseModel):
    slug: str
    name: str
    logo_initials: str | None
    logo_url: str | None
    created_at: datetime


class JobCategoryPublic(BaseModel):
    slug: str
    name: str


class IndustrialParkPublic(BaseModel):
    slug: str
    name: str


class JobListItem(BaseModel):
    slug: str
    title: str
    company: CompanyPublic
    category: JobCategoryPublic
    industrial_park: IndustrialParkPublic | None
    province_code: str
    province_name: str
    salary_min: int | None
    salary_max: int | None
    salary_negotiable: bool
    is_hot: bool
    deadline: date | None
    published_at: datetime | None


class JobDetail(JobListItem):
    quantity: int
    age_min: int | None
    age_max: int | None
    shift_type: str | None
    employment_type: str | None
    description: str | None
    requirements: str | None
    benefits: str | None
    status: str
    meta_title: str | None
    meta_description: str | None


class JobCategoryWithCount(BaseModel):
    slug: str
    name: str
    job_count: int


class IndustrialParkOut(BaseModel):
    model_config = {"from_attributes": True}

    slug: str
    name: str
    province_code: str
    district_name: str | None
