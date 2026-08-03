from sqlalchemy import func
from sqlalchemy.sql.elements import ColumnElement


def unaccent_ilike(column: ColumnElement, term: str) -> ColumnElement:
    """So khớp không dấu, không phân biệt hoa/thường — dùng hàm `immutable_unaccent`
    tạo tay ngoài `Base.metadata` (xem `alembic/env.py` `include_object`)."""
    pattern = func.concat("%", func.immutable_unaccent(func.lower(term)), "%")
    return func.immutable_unaccent(func.lower(column)).ilike(pattern)
