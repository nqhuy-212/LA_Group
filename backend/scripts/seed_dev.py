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
        "age_min": 18,
        "age_max": 35,
        "shift_type": "Theo ca (2 ca/ngày)",
        "employment_type": "Toàn thời gian",
        "description": (
            "Lắp ráp linh kiện điện tử theo dây chuyền, kiểm tra chất lượng sản phẩm "
            "đầu ra theo tiêu chuẩn nhà máy."
        ),
        "requirements": (
            "Tốt nghiệp THCS trở lên.\n\nSức khoẻ tốt, cẩn thận, chịu được áp lực dây chuyền."
        ),
        "benefits": (
            "Lương cơ bản + phụ cấp chuyên cần, đi lại, nhà ở.\n\n"
            "Đóng BHXH, BHYT, BHTN đầy đủ theo quy định.\n\nThưởng lễ, Tết, tháng 13."
        ),
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
        "age_min": 20,
        "age_max": 40,
        "shift_type": "Hành chính",
        "employment_type": "Toàn thời gian",
        "description": (
            "Vận hành, bảo trì và sửa chữa máy CNC; theo dõi thông số kỹ thuật, xử lý "
            "sự cố phát sinh trong quá trình sản xuất."
        ),
        "requirements": (
            "Tốt nghiệp Trung cấp/Cao đẳng Cơ khí trở lên.\n\n"
            "Có kinh nghiệm vận hành máy CNC là lợi thế."
        ),
        "benefits": "Lương thoả thuận theo năng lực.\n\nĐào tạo nâng cao tay nghề định kỳ.",
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
        "age_min": 18,
        "age_max": 30,
        "shift_type": "Theo ca",
        "employment_type": "Toàn thời gian",
        "description": (
            "Tư vấn, hỗ trợ khách hàng mua sắm; sắp xếp, trưng bày hàng hoá; hỗ trợ thu "
            "ngân khi cần."
        ),
        "requirements": "Ngoại hình ưa nhìn, giao tiếp tốt.\n\nƯu tiên có kinh nghiệm bán hàng.",
        "benefits": "Thưởng doanh số.\n\nĐồng phục, ăn ca miễn phí.",
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
        "age_min": 18,
        "age_max": 40,
        "shift_type": "Theo ca",
        "employment_type": "Toàn thời gian",
        "description": (
            "Bốc xếp, sắp xếp hàng hoá trong kho; kiểm đếm số lượng theo phiếu xuất "
            "nhập kho."
        ),
        "requirements": "Sức khoẻ tốt, chịu được công việc nặng.",
        "benefits": "Phụ cấp làm thêm giờ.\n\nHỗ trợ ăn ca, xe đưa đón.",
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
        "age_min": 18,
        "age_max": 45,
        "shift_type": "Hành chính",
        "employment_type": "Toàn thời gian",
        "description": "May sản phẩm theo chuyền, đảm bảo năng suất và chất lượng đường may.",
        "requirements": "Biết sử dụng máy may công nghiệp là lợi thế, không yêu cầu kinh nghiệm.",
        "benefits": "Đào tạo nghề miễn phí cho người mới.\n\nThưởng chuyên cần hàng tháng.",
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
        "age_min": 20,
        "age_max": 45,
        "shift_type": "Hành chính",
        "employment_type": "Toàn thời gian",
        "description": (
            "Lắp đặt, bảo trì hệ thống điện công nghiệp; xử lý sự cố điện trong nhà "
            "xưởng."
        ),
        "requirements": "Có chứng chỉ an toàn điện.\n\nƯu tiên có kinh nghiệm điện công nghiệp.",
        "benefits": "Phụ cấp độc hại, phụ cấp trách nhiệm.",
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
                "age_min": job["age_min"],
                "age_max": job["age_max"],
                "shift_type": job["shift_type"],
                "employment_type": job["employment_type"],
                "description": job["description"],
                "requirements": job["requirements"],
                "benefits": job["benefits"],
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
        "content": (
            "Tổng hợp các chế độ bảo hiểm xã hội, y tế và phúc lợi áp dụng cho người "
            "lao động tại LA Group.\n\n"
            "Toàn bộ lao động ký hợp đồng chính thức từ 1 tháng trở lên được LAHR đóng "
            "đầy đủ Bảo hiểm xã hội, Bảo hiểm y tế, Bảo hiểm thất nghiệp theo đúng quy "
            "định của pháp luật lao động Việt Nam.\n\n"
            "Ngoài ra, người lao động còn được hưởng phụ cấp chuyên cần, phụ cấp đi "
            "lại, hỗ trợ nhà ở (tuỳ nhà máy đối tác), thưởng lễ Tết và thưởng tháng 13 "
            "theo chính sách của từng doanh nghiệp sử dụng lao động."
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
        "content": (
            "Hướng dẫn chi tiết cách chuẩn bị CV và hồ sơ để tăng cơ hội trúng tuyển "
            "tại các doanh nghiệp đối tác.\n\n"
            "Bước 1: Chuẩn bị CV/sơ yếu lý lịch ghi rõ thông tin liên hệ, kinh nghiệm "
            "làm việc (nếu có).\n\n"
            "Bước 2: Chuẩn bị bản photo CCCD và các bằng cấp/chứng chỉ liên quan.\n\n"
            "Bước 3: Chụp ảnh hồ sơ rõ nét bằng điện thoại nếu chưa có bản scan.\n\n"
            "Bước 4: Liên hệ hotline LA Group hoặc ứng tuyển trực tiếp trên website "
            "để được tư vấn vị trí phù hợp.\n\n"
            "Bước 5: Tham gia phỏng vấn/khám sức khoẻ theo lịch hẹn từ LA Group."
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
        "content": (
            "Mở rộng mạng lưới nhà máy đối tác nhận lao động do LAHR cung ứng tại các "
            "KCN Hải Dương, mang đến thêm hàng trăm cơ hội việc làm mới cho người lao "
            "động.\n\n"
            "Trong đợt ký kết này, LA Group (LAHR) chính thức hợp tác cung ứng và cho "
            "thuê lại lao động với 20 doanh nghiệp mới, chủ yếu thuộc lĩnh vực điện "
            "tử, cơ khí và may mặc tại các khu công nghiệp trên địa bàn tỉnh Hải "
            "Dương."
        ),
        "type": PostType.NEWS,
        "published_at": datetime(2026, 7, 8, tzinfo=UTC),
    },
    # type=event — hiển thị ở carousel "Sự kiện" trang chủ
    {
        "slug": "ky-ket-hop-tac-2026",
        "title": "Lễ ký kết hợp tác cung ứng lao động đầu năm 2026",
        "excerpt": "Lễ ký kết hợp tác cung ứng lao động đầu năm 2026.",
        "content": (
            "Lễ ký kết hợp tác cung ứng lao động đầu năm 2026 giữa LA Group (LAHR) và "
            "các doanh nghiệp đối tác diễn ra tại trụ sở Hải Dương, đánh dấu bước mở "
            "rộng quy mô cung ứng lao động cho năm mới."
        ),
        "type": PostType.EVENT,
        "published_at": datetime(2026, 7, 28, tzinfo=UTC),
    },
    {
        "slug": "dao-tao-ky-nang-nghe",
        "title": "Chương trình đào tạo kỹ năng nghề miễn phí cho người lao động",
        "excerpt": "Chương trình đào tạo kỹ năng nghề miễn phí cho người lao động.",
        "content": (
            "Chương trình đào tạo kỹ năng nghề miễn phí cho người lao động do LA "
            "Group tổ chức, giúp người lao động làm quen với dây chuyền sản xuất "
            "trước khi vào làm việc chính thức tại nhà máy đối tác."
        ),
        "type": PostType.EVENT,
        "published_at": datetime(2026, 7, 22, tzinfo=UTC),
    },
    {
        "slug": "mo-rong-5-kcn",
        "title": "LA Group mở rộng cung ứng lao động cho 5 khu công nghiệp tại Hải Dương",
        "excerpt": "LA Group mở rộng cung ứng lao động cho 5 khu công nghiệp tại Hải Dương.",
        "content": (
            "LA Group mở rộng cung ứng lao động cho 5 khu công nghiệp tại Hải Dương: "
            "KCN Kỹ thuật cao An Phát, Đại An, Tân Trường, Phúc Điền và Cẩm Điền – "
            "Lương Điền (Vsip Hải Dương), mang đến thêm nhiều cơ hội việc làm cho "
            "người lao động địa phương."
        ),
        "type": PostType.EVENT,
        "published_at": datetime(2026, 7, 15, tzinfo=UTC),
    },
    # type=scam_alert — hiển thị ở feed "Cảnh báo lừa đảo" trang chủ
    {
        "slug": "mao-danh-thu-phi",
        "title": "Cảnh giác chiêu trò mạo danh LA Group để thu phí giới thiệu việc làm",
        "excerpt": "Cảnh giác chiêu trò mạo danh LA Group để thu phí giới thiệu việc làm.",
        "content": (
            "Cảnh giác chiêu trò mạo danh LA Group để thu phí giới thiệu việc làm.\n\n"
            "LA Group (LAHR) khẳng định KHÔNG thu bất kỳ khoản phí nào của người lao "
            "động để giới thiệu, môi giới việc làm. Mọi yêu cầu chuyển tiền trước khi "
            "phỏng vấn/nhận việc dưới danh nghĩa LA Group đều là lừa đảo — vui lòng "
            "liên hệ hotline 0922.86.99.66 để xác minh."
        ),
        "type": PostType.SCAM_ALERT,
        "published_at": datetime(2026, 7, 27, tzinfo=UTC),
    },
    {
        "slug": "viec-nhe-luong-cao",
        "title": 'Không có chuyện "việc nhẹ lương cao" không yêu cầu kinh nghiệm',
        "excerpt": 'Không có chuyện "việc nhẹ lương cao" không yêu cầu kinh nghiệm.',
        "content": (
            'Không có chuyện "việc nhẹ lương cao" không yêu cầu kinh nghiệm.\n\n'
            "Người lao động cần cảnh giác với các tin tuyển dụng hứa hẹn mức lương "
            "bất thường so với mặt bằng chung, không yêu cầu kỹ năng hay kinh nghiệm "
            "gì. Đây thường là dấu hiệu của lừa đảo hoặc đa cấp trá hình."
        ),
        "type": PostType.SCAM_ALERT,
        "published_at": datetime(2026, 7, 19, tzinfo=UTC),
    },
    {
        "slug": "nhan-biet-tin-gia",
        "title": "Hướng dẫn nhận biết tin tuyển dụng giả mạo trên mạng xã hội",
        "excerpt": "Hướng dẫn nhận biết tin tuyển dụng giả mạo trên mạng xã hội.",
        "content": (
            "Hướng dẫn nhận biết tin tuyển dụng giả mạo trên mạng xã hội.\n\n"
            "Tin tuyển dụng chính thức của LA Group chỉ được đăng tại website "
            "lahr.vn hoặc các kênh chính thức (Fanpage, Zalo OA đã xác thực). Người "
            "lao động nên kiểm tra kỹ nguồn tin trước khi cung cấp thông tin cá nhân "
            "hoặc chuyển khoản cho bất kỳ ai."
        ),
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
                "content": post["content"],
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
