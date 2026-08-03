"""fix_immutable_unaccent_schema_qualify

Revision ID: d1def644e25b
Revises: 7dcb960fdfb3
Create Date: 2026-08-03 21:26:42.147980

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'd1def644e25b'
down_revision: Union[str, Sequence[str], None] = '7dcb960fdfb3'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    # Bug phát hiện khi test restore thật ở P9 (docs/PLAN.md DoD): pg_dump luôn set
    # search_path rỗng đầu bản dump để buộc mọi tham chiếu phải schema-qualify.
    # `immutable_unaccent` gọi `unaccent(...)` không schema-qualify — resolve được
    # lúc chạy bình thường (search_path mặc định có `public`) nhưng vỡ đúng lúc
    # restore (CREATE INDEX ix_jobs_title_unaccent inline lại function body, search_path
    # rỗng nên không tìm thấy `unaccent`). CREATE OR REPLACE giữ nguyên signature nên
    # không cần đụng tới index/dữ liệu phụ thuộc.
    op.execute(
        """
        CREATE OR REPLACE FUNCTION immutable_unaccent(text)
        RETURNS text AS $$
            SELECT public.unaccent('public.unaccent', $1)
        $$ LANGUAGE sql IMMUTABLE PARALLEL SAFE
        """
    )


def downgrade() -> None:
    """Downgrade schema."""
    op.execute(
        """
        CREATE OR REPLACE FUNCTION immutable_unaccent(text)
        RETURNS text AS $$
            SELECT unaccent('unaccent', $1)
        $$ LANGUAGE sql IMMUTABLE PARALLEL SAFE
        """
    )
