# DB test dùng Postgres thật (KHÔNG SQLite — JSONB/enum/unaccent là Postgres-specific,
# xem testing.md). Database `lagroup_test` được tạo + migrate 1 lần/session; mỗi test
# chạy trong 1 transaction rồi rollback, dù test có tự gọi session.commit() hay không
# (nhờ join_transaction_mode="create_savepoint").
#
# QUAN TRỌNG: phải set DATABASE_URL trỏ sang lagroup_test TRƯỚC khi bất kỳ module nào
# trong app/ được import (app.core.config.Settings đọc env lúc import). Vì vậy khối
# này đứng trên cùng, trước cả import app.*.
import os
from urllib.parse import urlsplit, urlunsplit


def _swap_db_name(url: str, db_name: str) -> str:
    parts = urlsplit(url)
    return urlunsplit((parts.scheme, parts.netloc, f"/{db_name}", parts.query, parts.fragment))


_DEV_DATABASE_URL = os.environ.get(
    "DATABASE_URL", "postgresql+psycopg2://lagroup:lagroup@localhost:5432/lagroup"
)
TEST_DATABASE_URL = _swap_db_name(_DEV_DATABASE_URL, "lagroup_test")
os.environ["DATABASE_URL"] = TEST_DATABASE_URL

import pytest  # noqa: E402
from alembic.config import Config  # noqa: E402
from sqlalchemy import create_engine, text  # noqa: E402
from sqlalchemy.orm import Session  # noqa: E402

from alembic import command  # noqa: E402

BACKEND_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))


def _ensure_test_database_exists() -> None:
    admin_url = _swap_db_name(TEST_DATABASE_URL, "postgres")
    db_name = urlsplit(TEST_DATABASE_URL).path.lstrip("/")
    admin_engine = create_engine(admin_url, isolation_level="AUTOCOMMIT")
    try:
        with admin_engine.connect() as conn:
            exists = conn.execute(
                text("SELECT 1 FROM pg_database WHERE datname = :name"), {"name": db_name}
            ).scalar()
            if not exists:
                conn.execute(text(f'CREATE DATABASE "{db_name}"'))
    finally:
        admin_engine.dispose()


@pytest.fixture(scope="session", autouse=True)
def _migrated_test_db() -> None:
    _ensure_test_database_exists()
    alembic_cfg = Config(os.path.join(BACKEND_DIR, "alembic.ini"))
    command.upgrade(alembic_cfg, "head")


@pytest.fixture
def db_session():
    engine = create_engine(TEST_DATABASE_URL)
    connection = engine.connect()
    trans = connection.begin()
    session = Session(bind=connection, join_transaction_mode="create_savepoint")
    try:
        yield session
    finally:
        session.close()
        trans.rollback()
        connection.close()
        engine.dispose()
