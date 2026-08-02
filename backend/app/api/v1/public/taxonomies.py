from fastapi import APIRouter, Depends
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models import IndustrialPark, Job, JobCategory
from app.models.enums import JobStatus
from app.schemas.job import IndustrialParkOut, JobCategoryWithCount

router = APIRouter(prefix="/api", tags=["taxonomies"])


@router.get("/job-categories", response_model=list[JobCategoryWithCount])
def list_job_categories(db: Session = Depends(get_db)) -> list[JobCategoryWithCount]:
    published_jobs = (
        select(Job.category_id, func.count().label("job_count"))
        .where(Job.status == JobStatus.PUBLISHED)
        .group_by(Job.category_id)
        .subquery()
    )
    rows = db.execute(
        select(JobCategory, func.coalesce(published_jobs.c.job_count, 0))
        .outerjoin(published_jobs, published_jobs.c.category_id == JobCategory.id)
        .where(JobCategory.is_active.is_(True))
        .order_by(JobCategory.sort_order)
    ).all()
    return [
        JobCategoryWithCount(slug=category.slug, name=category.name, job_count=job_count)
        for category, job_count in rows
    ]


@router.get("/industrial-parks", response_model=list[IndustrialParkOut])
def list_industrial_parks(db: Session = Depends(get_db)) -> list[IndustrialParkOut]:
    parks = db.execute(select(IndustrialPark).order_by(IndustrialPark.name)).scalars().all()
    return [IndustrialParkOut.model_validate(park) for park in parks]
