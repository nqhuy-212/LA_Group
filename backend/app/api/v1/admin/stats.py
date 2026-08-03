from datetime import UTC, date, datetime, time, timedelta
from typing import Literal

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import case, func, select
from sqlalchemy.orm import Session

from app.api.deps import require_roles
from app.db.session import get_db
from app.models import AddressMapping, Application, IndustrialPark, Job, Province, User
from app.models.enums import UserRole
from app.schemas.stats import (
    AgeGroupStatOut,
    IndustrialParkStatOut,
    ProvinceStatOut,
    StatsOverviewOut,
    StatsSeriesPoint,
)

router = APIRouter(prefix="/api/admin/stats", tags=["admin-stats"])

# Dashboard tổng quan là trang mặc định sau đăng nhập cho MỌI role đã đăng nhập
# (feature-admin-dashboard.md) — cả 3 role đều xem được số liệu tổng hợp, khác
# với export CSV/purge (kéo PII hàng loạt) đang thu hẹp ở admin+manager.
STATS_ROLES = (UserRole.ADMIN, UserRole.MANAGER, UserRole.STAFF)

DEFAULT_WINDOW_DAYS = 29  # mặc định 30 ngày gần nhất (tính cả hôm nay)

AGE_GROUP_ORDER = ["18-24", "25-34", "35-44", "45+", "unknown"]
AGE_GROUP_LABEL = {
    "18-24": "18-24 tuổi",
    "25-34": "25-34 tuổi",
    "35-44": "35-44 tuổi",
    "45+": "Trên 45 tuổi",
    "unknown": "Chưa rõ năm sinh",
}


def _resolve_range(date_from: date | None, date_to: date | None) -> tuple[date, date]:
    resolved_to = date_to or date.today()
    resolved_from = date_from or (resolved_to - timedelta(days=DEFAULT_WINDOW_DAYS))
    if resolved_from > resolved_to:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Khoảng thời gian không hợp lệ: 'from' phải nhỏ hơn hoặc bằng 'to'",
        )
    return resolved_from, resolved_to


def _date_conditions(date_from: date, date_to: date) -> list:
    start = datetime.combine(date_from, time.min, tzinfo=UTC)
    end = datetime.combine(date_to + timedelta(days=1), time.min, tzinfo=UTC)
    return [Application.created_at >= start, Application.created_at < end]


@router.get("/overview", response_model=StatsOverviewOut)
def get_overview(
    date_from: date | None = Query(default=None, alias="from"),
    date_to: date | None = Query(default=None, alias="to"),
    granularity: Literal["day", "week", "month"] = "day",
    db: Session = Depends(get_db),
    _user: User = Depends(require_roles(*STATS_ROLES)),
) -> StatsOverviewOut:
    resolved_from, resolved_to = _resolve_range(date_from, date_to)
    conditions = _date_conditions(resolved_from, resolved_to)

    total = db.execute(
        select(func.count()).select_from(Application).where(*conditions)
    ).scalar_one()

    status_rows = db.execute(
        select(Application.status, func.count())
        .where(*conditions)
        .group_by(Application.status)
    ).all()
    by_status = {row[0].value: row[1] for row in status_rows}

    # date_trunc: granularity chỉ nhận 1 trong 3 giá trị literal đã khai báo ở
    # type hint (day/week/month) — không phải chuỗi tự do từ client.
    bucket = func.date_trunc(granularity, Application.created_at)
    series_rows = db.execute(
        select(bucket.label("period"), func.count().label("count"))
        .where(*conditions)
        .group_by(bucket)
        .order_by(bucket)
    ).all()
    series = [
        StatsSeriesPoint(period=row.period.date().isoformat(), count=row.count)
        for row in series_rows
    ]

    return StatsOverviewOut(
        date_from=resolved_from,
        date_to=resolved_to,
        granularity=granularity,
        total=total,
        by_status=by_status,
        series=series,
    )


@router.get("/by-province", response_model=list[ProvinceStatOut])
def get_by_province(
    date_from: date | None = Query(default=None, alias="from"),
    date_to: date | None = Query(default=None, alias="to"),
    db: Session = Depends(get_db),
    _user: User = Depends(require_roles(*STATS_ROLES)),
) -> list[ProvinceStatOut]:
    resolved_from, resolved_to = _resolve_range(date_from, date_to)
    conditions = _date_conditions(resolved_from, resolved_to)

    # D13: applications.province_code có thể là mã tỉnh cũ đã hợp nhất/ngừng
    # dùng — roll-up qua address_mappings để gộp đúng nhóm tỉnh hiện hành
    # trước khi đếm, thay vì đếm thẳng theo mã thô đang lưu.
    resolved_code = func.coalesce(AddressMapping.new_code, Application.province_code)
    rows = db.execute(
        select(resolved_code.label("code"), func.count().label("count"))
        .select_from(Application)
        .outerjoin(AddressMapping, AddressMapping.old_code == Application.province_code)
        .where(*conditions)
        .group_by(resolved_code)
    ).all()

    province_names = {p.code: p.name for p in db.execute(select(Province)).scalars()}

    result = [
        ProvinceStatOut(
            province_code=row.code,
            province_name=(
                province_names.get(row.code, row.code) if row.code else "Không xác định"
            ),
            count=row.count,
        )
        for row in rows
    ]
    result.sort(key=lambda r: r.count, reverse=True)
    return result


@router.get("/by-age-group", response_model=list[AgeGroupStatOut])
def get_by_age_group(
    date_from: date | None = Query(default=None, alias="from"),
    date_to: date | None = Query(default=None, alias="to"),
    db: Session = Depends(get_db),
    _user: User = Depends(require_roles(*STATS_ROLES)),
) -> list[AgeGroupStatOut]:
    resolved_from, resolved_to = _resolve_range(date_from, date_to)
    conditions = _date_conditions(resolved_from, resolved_to)

    # Tuổi CHỈ tính lúc query từ birth_date (không có cột age lưu sẵn — xem
    # data-models.md) để bucket không "đông cứng" sai theo thời gian.
    age_years = func.date_part("year", func.age(func.current_date(), Application.birth_date))
    bucket = case(
        (Application.birth_date.is_(None), "unknown"),
        (age_years < 25, "18-24"),
        (age_years < 35, "25-34"),
        (age_years < 45, "35-44"),
        else_="45+",
    )
    rows = db.execute(
        select(bucket.label("bucket"), func.count().label("count"))
        .where(*conditions)
        .group_by(bucket)
    ).all()
    counts = {row.bucket: row.count for row in rows}

    return [
        AgeGroupStatOut(bucket=key, label=AGE_GROUP_LABEL[key], count=counts.get(key, 0))
        for key in AGE_GROUP_ORDER
    ]


@router.get("/by-industrial-park", response_model=list[IndustrialParkStatOut])
def get_by_industrial_park(
    date_from: date | None = Query(default=None, alias="from"),
    date_to: date | None = Query(default=None, alias="to"),
    db: Session = Depends(get_db),
    _user: User = Depends(require_roles(*STATS_ROLES)),
) -> list[IndustrialParkStatOut]:
    resolved_from, resolved_to = _resolve_range(date_from, date_to)
    conditions = _date_conditions(resolved_from, resolved_to)

    rows = db.execute(
        select(
            IndustrialPark.slug, IndustrialPark.name, func.count(Application.id).label("count")
        )
        .select_from(Application)
        .outerjoin(Job, Job.id == Application.job_id)
        .outerjoin(IndustrialPark, IndustrialPark.id == Job.industrial_park_id)
        .where(*conditions)
        .group_by(IndustrialPark.slug, IndustrialPark.name)
    ).all()

    result = [
        IndustrialParkStatOut(
            industrial_park_slug=row.slug,
            industrial_park_name=row.name or "Không xác định",
            count=row.count,
        )
        for row in rows
    ]
    result.sort(key=lambda r: r.count, reverse=True)
    return result
