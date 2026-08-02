"""CLI tạo tài khoản nội bộ (admin/manager/staff). Không bao giờ có endpoint
đăng ký public tương ứng — tài khoản chỉ được tạo qua đây (bootstrap) hoặc sau
này qua Admin UI (P5) bởi một admin đã đăng nhập.

Chạy: uv run python -m scripts.create_user --email you@lahr.vn --role admin
"""

import argparse
import getpass
import sys

from sqlalchemy import select

from app.core.security import hash_password
from app.db.session import SessionLocal
from app.models import User
from app.models.enums import UserRole


def main() -> None:
    for stream in (sys.stdout, sys.stderr):
        if stream.encoding.lower() != "utf-8":
            stream.reconfigure(encoding="utf-8")

    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--email", required=True)
    parser.add_argument(
        "--role", choices=[r.value for r in UserRole], default=UserRole.ADMIN.value
    )
    parser.add_argument("--password", help="Bỏ qua để nhập ẩn qua prompt (khuyến nghị)")
    args = parser.parse_args()

    password = args.password or getpass.getpass("Mật khẩu: ")
    if not password:
        parser.error("Mật khẩu không được để trống")

    with SessionLocal() as session:
        existing = session.execute(
            select(User).filter_by(email=args.email)
        ).scalar_one_or_none()
        if existing is not None:
            parser.error(f"Email {args.email} đã tồn tại (id={existing.id})")

        user = User(
            email=args.email,
            hashed_password=hash_password(password),
            role=UserRole(args.role),
        )
        session.add(user)
        session.commit()
        print(f"Đã tạo user {user.email} (role={user.role.value}, id={user.id})")


if __name__ == "__main__":
    main()
