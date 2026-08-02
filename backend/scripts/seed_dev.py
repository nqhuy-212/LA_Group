"""Seed dữ liệu dev, idempotent (upsert theo khoá tự nhiên) — khớp frontend/lib/mock-data.ts
để trang chủ nhìn y hệt sau khi bỏ mock (P3). Chạy lại an toàn: uv run python -m scripts.seed_dev
"""

import sys
from datetime import UTC, date, datetime
from typing import Any

from sqlalchemy import select
from sqlalchemy.dialects.postgresql import insert as pg_insert
from sqlalchemy.orm import Session

from app.db.session import SessionLocal
from app.models import Company, IndustrialPark, Job, JobCategory, Post, Province
from app.models.enums import JobStatus, PostStatus, PostType

HAI_DUONG_CODE = "30"


def upsert(session: Session, model: type, conflict_col: str, values: dict[str, Any]) -> None:
    update_cols = {k: v for k, v in values.items() if k != conflict_col}
    stmt = pg_insert(model).values(**values)
    stmt = stmt.on_conflict_do_update(index_elements=[conflict_col], set_=update_cols)
    session.execute(stmt)


def get_by(session: Session, model: type, **kwargs: Any):
    return session.execute(select(model).filter_by(**kwargs)).scalar_one()


def seed_province(session: Session) -> None:
    upsert(
        session,
        Province,
        "code",
        {"code": HAI_DUONG_CODE, "name": "Hải Dương", "type": "Tỉnh", "is_active": True},
    )


INDUSTRIAL_PARKS = [
    {"slug": "an-phat-ky-thuat-cao", "name": "KCN Kỹ thuật cao An Phát", "district_name": None},
    {"slug": "dai-an", "name": "KCN Đại An", "district_name": None},
    {"slug": "tan-truong", "name": "KCN Tân Trường", "district_name": None},
    {"slug": "phuc-dien", "name": "KCN Phúc Điền", "district_name": None},
    {
        "slug": "cam-dien-luong-dien-vsip",
        "name": "KCN Cẩm Điền – Lương Điền (Vsip Hải Dương)",
        "district_name": None,
    },
]


def seed_industrial_parks(session: Session) -> None:
    for park in INDUSTRIAL_PARKS:
        upsert(session, IndustrialPark, "slug", {**park, "province_code": HAI_DUONG_CODE})


JOB_CATEGORIES = [
    {"slug": "sx", "name": "Sản xuất – Lắp ráp", "sort_order": 1},
    {"slug": "kt", "name": "Cơ khí – Kỹ thuật", "sort_order": 2},
    {"slug": "dv", "name": "Dịch vụ – Bán hàng", "sort_order": 3},
    {"slug": "kv", "name": "Kho vận – Logistics", "sort_order": 4},
]


def seed_job_categories(session: Session) -> None:
    for cat in JOB_CATEGORIES:
        upsert(session, JobCategory, "slug", {**cat, "is_active": True})


COMPANIES = [
    {
        "slug": "dien-tu-viet-phat",
        "name": "Công ty TNHH Điện tử Việt Phát",
        "logo_initials": "CTY",
    },
    {
        "slug": "co-khi-chinh-xac-an-phat",
        "name": "Công ty Cơ khí Chính xác An Phát",
        "logo_initials": "KT",
    },
    {
        "slug": "sieu-thi-binh-minh-mart",
        "name": "Chuỗi Siêu thị Bình Minh Mart",
        "logo_initials": "SV",
    },
    {
        "slug": "logistics-dai-duong",
        "name": "Công ty Logistics Đại Dương",
        "logo_initials": "LG",
    },
    {
        "slug": "may-mac-thanh-dat",
        "name": "Công ty May mặc Thành Đạt",
        "logo_initials": "MM",
    },
    {
        "slug": "co-dien-phu-thanh",
        "name": "Công ty TNHH Cơ điện Phú Thành",
        "logo_initials": "DT",
    },
]


def seed_companies(session: Session) -> None:
    for company in COMPANIES:
        upsert(
            session,
            Company,
            "slug",
            {
                **company,
                "display_name_public": None,
                "logo_url": None,
                "is_partner": True,
            },
        )


JOBS = [
    {
        "slug": "cn-lap-rap-dien-tu",
        "title": "Công nhân lắp ráp điện tử",
        "company_slug": "dien-tu-viet-phat",
        "category_slug": "sx",
        "industrial_park_slug": "an-phat-ky-thuat-cao",
        "is_hot": True,
        "salary_min": 9_000_000,
        "salary_max": 12_000_000,
        "deadline": date(2026, 8, 15),
    },
    {
        "slug": "ky-thuat-vien-cnc",
        "title": "Kỹ thuật viên bảo trì máy CNC",
        "company_slug": "co-khi-chinh-xac-an-phat",
        "category_slug": "kt",
        "industrial_park_slug": "dai-an",
        "is_hot": False,
        "salary_min": 12_000_000,
        "salary_max": 16_000_000,
        "deadline": date(2026, 8, 20),
    },
    {
        "slug": "nhan-vien-ban-hang-sieu-thi",
        "title": "Nhân viên bán hàng siêu thị",
        "company_slug": "sieu-thi-binh-minh-mart",
        "category_slug": "dv",
        "industrial_park_slug": None,
        "is_hot": True,
        "salary_min": 7_000_000,
        "salary_max": 9_000_000,
        "deadline": date(2026, 8, 10),
    },
    {
        "slug": "nhan-vien-kho-boc-xep",
        "title": "Nhân viên kho – bốc xếp hàng hóa",
        "company_slug": "logistics-dai-duong",
        "category_slug": "kv",
        "industrial_park_slug": "phuc-dien",
        "is_hot": False,
        "salary_min": 8_000_000,
        "salary_max": 10_000_000,
        "deadline": date(2026, 8, 25),
    },
    {
        "slug": "cn-may-cong-nghiep",
        "title": "Công nhân may công nghiệp",
        "company_slug": "may-mac-thanh-dat",
        "category_slug": "sx",
        "industrial_park_slug": "cam-dien-luong-dien-vsip",
        "is_hot": False,
        "salary_min": 8_000_000,
        "salary_max": 11_000_000,
        "deadline": date(2026, 8, 18),
    },
    {
        "slug": "tho-dien-cong-nghiep",
        "title": "Thợ điện công nghiệp",
        "company_slug": "co-dien-phu-thanh",
        "category_slug": "kt",
        "industrial_park_slug": "tan-truong",
        "is_hot": True,
        "salary_min": 11_000_000,
        "salary_max": 15_000_000,
        "deadline": date(2026, 8, 30),
    },
]


def seed_jobs(session: Session) -> None:
    for job in JOBS:
        company = get_by(session, Company, slug=job["company_slug"])
        category = get_by(session, JobCategory, slug=job["category_slug"])
        industrial_park = (
            get_by(session, IndustrialPark, slug=job["industrial_park_slug"])
            if job["industrial_park_slug"]
            else None
        )
        upsert(
            session,
            Job,
            "slug",
            {
                "slug": job["slug"],
                "title": job["title"],
                "company_id": company.id,
                "category_id": category.id,
                "industrial_park_id": industrial_park.id if industrial_park else None,
                "province_code": HAI_DUONG_CODE,
                "salary_min": job["salary_min"],
                "salary_max": job["salary_max"],
                "salary_negotiable": False,
                "quantity": 5,
                "status": JobStatus.PUBLISHED,
                "is_hot": job["is_hot"],
                "published_at": datetime.now(UTC),
                "deadline": job["deadline"],
            },
        )


POSTS = [
    {
        "slug": "chinh-sach-bao-hiem-2026",
        "title": "Chính sách bảo hiểm và phúc lợi cho người lao động 2026",
        "excerpt": (
            "Tổng hợp các chế độ bảo hiểm xã hội, y tế và phúc lợi áp dụng cho "
            "người lao động tại LA Group."
        ),
        "type": PostType.POLICY,
        "published_at": datetime(2026, 7, 20, tzinfo=UTC),
    },
    {
        "slug": "5-buoc-chuan-bi-ho-so",
        "title": "5 bước chuẩn bị hồ sơ ứng tuyển gây ấn tượng",
        "excerpt": (
            "Hướng dẫn chi tiết cách chuẩn bị CV và hồ sơ để tăng cơ hội trúng "
            "tuyển tại các doanh nghiệp đối tác."
        ),
        "type": PostType.GUIDE,
        "published_at": datetime(2026, 7, 15, tzinfo=UTC),
    },
    {
        "slug": "ky-ket-20-doanh-nghiep",
        "title": "LA Group (LAHR) ký kết cung ứng lao động cùng 20 doanh nghiệp mới",
        "excerpt": (
            "Mở rộng mạng lưới nhà máy đối tác nhận lao động do LAHR cung ứng tại "
            "các KCN Hải Dương, mang đến thêm hàng trăm cơ hội việc làm mới cho "
            "người lao động."
        ),
        "type": PostType.NEWS,
        "published_at": datetime(2026, 7, 8, tzinfo=UTC),
    },
    # type=event — hiển thị ở carousel "Sự kiện" trang chủ
    {
        "slug": "ky-ket-hop-tac-2026",
        "title": "Lễ ký kết hợp tác cung ứng lao động đầu năm 2026",
        "excerpt": "Lễ ký kết hợp tác cung ứng lao động đầu năm 2026.",
        "type": PostType.EVENT,
        "published_at": datetime(2026, 7, 28, tzinfo=UTC),
    },
    {
        "slug": "dao-tao-ky-nang-nghe",
        "title": "Chương trình đào tạo kỹ năng nghề miễn phí cho người lao động",
        "excerpt": "Chương trình đào tạo kỹ năng nghề miễn phí cho người lao động.",
        "type": PostType.EVENT,
        "published_at": datetime(2026, 7, 22, tzinfo=UTC),
    },
    {
        "slug": "mo-rong-5-kcn",
        "title": "LA Group mở rộng cung ứng lao động cho 5 khu công nghiệp tại Hải Dương",
        "excerpt": "LA Group mở rộng cung ứng lao động cho 5 khu công nghiệp tại Hải Dương.",
        "type": PostType.EVENT,
        "published_at": datetime(2026, 7, 15, tzinfo=UTC),
    },
    # type=scam_alert — hiển thị ở feed "Cảnh báo lừa đảo" trang chủ
    {
        "slug": "mao-danh-thu-phi",
        "title": "Cảnh giác chiêu trò mạo danh LA Group để thu phí giới thiệu việc làm",
        "excerpt": "Cảnh giác chiêu trò mạo danh LA Group để thu phí giới thiệu việc làm.",
        "type": PostType.SCAM_ALERT,
        "published_at": datetime(2026, 7, 27, tzinfo=UTC),
    },
    {
        "slug": "viec-nhe-luong-cao",
        "title": 'Không có chuyện "việc nhẹ lương cao" không yêu cầu kinh nghiệm',
        "excerpt": 'Không có chuyện "việc nhẹ lương cao" không yêu cầu kinh nghiệm.',
        "type": PostType.SCAM_ALERT,
        "published_at": datetime(2026, 7, 19, tzinfo=UTC),
    },
    {
        "slug": "nhan-biet-tin-gia",
        "title": "Hướng dẫn nhận biết tin tuyển dụng giả mạo trên mạng xã hội",
        "excerpt": "Hướng dẫn nhận biết tin tuyển dụng giả mạo trên mạng xã hội.",
        "type": PostType.SCAM_ALERT,
        "published_at": datetime(2026, 7, 10, tzinfo=UTC),
    },
]


def seed_posts(session: Session) -> None:
    for post in POSTS:
        upsert(
            session,
            Post,
            "slug",
            {
                "slug": post["slug"],
                "title": post["title"],
                "excerpt": post["excerpt"],
                "content": post["excerpt"],
                "type": post["type"],
                "status": PostStatus.PUBLISHED,
                "published_at": post["published_at"],
            },
        )


def main() -> None:
    if sys.stdout.encoding.lower() != "utf-8":
        sys.stdout.reconfigure(encoding="utf-8")

    with SessionLocal() as session:
        seed_province(session)
        seed_industrial_parks(session)
        seed_job_categories(session)
        seed_companies(session)
        seed_jobs(session)
        seed_posts(session)
        session.commit()
    print("Seed dev hoàn tất.")


if __name__ == "__main__":
    main()
