from fastapi import APIRouter, Depends, Query
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models import Company
from app.schemas.job import CompanyPublic

router = APIRouter(prefix="/api", tags=["companies"])


@router.get("/companies/recent", response_model=list[CompanyPublic])
def list_recent_companies(
    limit: int = Query(4, ge=1, le=20), db: Session = Depends(get_db)
) -> list[CompanyPublic]:
    companies = db.execute(
        select(Company)
        .where(Company.is_partner.is_(True))
        .order_by(Company.created_at.desc())
        .limit(limit)
    ).scalars().all()
    return [
        CompanyPublic(
            slug=c.slug,
            name=c.display_name_public or c.name,
            logo_initials=c.logo_initials,
            logo_url=c.logo_url,
            created_at=c.created_at,
        )
        for c in companies
    ]
