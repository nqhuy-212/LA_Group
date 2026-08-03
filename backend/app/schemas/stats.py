from datetime import date

from pydantic import BaseModel


class StatsSeriesPoint(BaseModel):
    period: str
    count: int


class StatsOverviewOut(BaseModel):
    date_from: date
    date_to: date
    granularity: str
    total: int
    by_status: dict[str, int]
    series: list[StatsSeriesPoint]


class ProvinceStatOut(BaseModel):
    province_code: str | None
    province_name: str
    count: int


class AgeGroupStatOut(BaseModel):
    bucket: str
    label: str
    count: int


class IndustrialParkStatOut(BaseModel):
    industrial_park_slug: str | None
    industrial_park_name: str
    count: int
