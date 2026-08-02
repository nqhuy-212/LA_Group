# Import mỗi model tường minh ở đây và thêm vào __all__ khi tạo (P1 trở đi).
# Bắt buộc — quên re-export = model không đăng ký vào Base.metadata =
# alembic --autogenerate sinh nhầm lệnh drop_table cho bảng đó.
__all__: list[str] = []
