# Lệnh thường dùng

```bash
# Frontend (thư mục frontend/) — Next.js App Router + TypeScript + Tailwind, đã scaffold
npm run dev         # chạy dev server Next.js
npm run build        # build production (output: 'standalone')
npm run lint         # kiểm tra lint
npm run typecheck    # kiểm tra type (script riêng, không lồng vào build)
npm run format        # format bằng Prettier (--write)

# Backend (thư mục backend/) — FastAPI, Python 3.11, dependency quản lý bằng uv (pyproject.toml + uv.lock)
uv sync                          # cài đúng dependency đã lock vào backend/.venv (cần .env đã copy từ .env.example)
uv run uvicorn app.main:app --reload   # chạy dev server FastAPI
uv run alembic revision --autogenerate -m "..."   # tạo migration khi đổi model (models khai báo tường minh trong app/models/__init__.py)
uv run alembic upgrade head      # áp migration
uv run alembic check             # kiểm model↔migration có khớp không (bắt buộc trước khi commit migration, chạy trong CI)
uv run ruff check .              # lint backend
uv run pytest                    # chạy test backend (cần Postgres đang chạy — xem docker compose bên dưới)
uv export --no-dev --no-hashes --format requirements-txt > requirements.txt   # export lại cho Dockerfile sau khi đổi dependency — KHÔNG sửa tay requirements.txt

# Database dev (docker-compose.yml ở root — CHỈ chạy Postgres, dùng cho máy dev local)
docker compose up -d        # khởi động container Postgres (lagroup/lagroup/lagroup, chỉ bind 127.0.0.1:5432)
docker compose down         # tắt container (thêm -v nếu muốn xoá luôn volume dữ liệu)

# Hạ tầng production (VPS) — chưa scaffold, sẽ có docker-compose riêng khi triển khai
# (Nginx reverse proxy + Certbot, Next.js standalone, FastAPI/uvicorn, PostgreSQL, n8n qua profile "automation")
docker stats                 # theo dõi RAM/CPU từng container
```

(Cập nhật danh sách này ngay khi cấu trúc project thực tế có thay đổi — đừng để mục này lệch với repo. Lệnh `seed_dev.py`/`create_user.py` sẽ thêm vào đây khi có ở P1, xem `docs/PLAN.md`.)
