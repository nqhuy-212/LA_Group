# Lệnh thường dùng

```bash
# Frontend (thư mục frontend/) — Next.js App Router + TypeScript + Tailwind, đã scaffold
npm run dev         # chạy dev server Next.js
npm run build        # build production (output: 'standalone')
npm run lint         # kiểm tra lint
npm run typecheck    # kiểm tra type (script riêng, không lồng vào build)
npm run format        # format bằng Prettier (--write)
npm run test          # chạy vitest (chỉ test lib/format.ts + lib/view-models/* — pure function)
npm run gen:api        # sinh lại lib/api/schema.d.ts từ OpenAPI thật của backend (cần backend đang chạy ở :8000), commit file này

# Backend (thư mục backend/) — FastAPI, Python 3.11, dependency quản lý bằng uv (pyproject.toml + uv.lock)
uv sync                          # cài đúng dependency đã lock vào backend/.venv (cần .env đã copy từ .env.example)
uv run uvicorn app.main:app --reload   # chạy dev server FastAPI
uv run alembic revision --autogenerate -m "..."   # tạo migration khi đổi model (models khai báo tường minh trong app/models/__init__.py)
uv run alembic upgrade head      # áp migration
uv run alembic check             # kiểm model↔migration có khớp không (bắt buộc trước khi commit migration, chạy trong CI)
uv run ruff check .              # lint backend
uv run pytest                    # chạy test backend (tự tạo DB lagroup_test + migrate qua conftest.py, chỉ cần Postgres đang chạy)
uv export --no-dev --no-hashes --format requirements-txt > requirements.txt   # export lại cho Dockerfile sau khi đổi dependency — KHÔNG sửa tay requirements.txt
uv run python -m scripts.seed_dev   # seed dữ liệu dev idempotent (tỉnh/KCN/danh mục/công ty/job/post khớp mock-data.ts cũ)
uv run python -m scripts.create_user --email you@lahr.vn --role admin   # tạo tài khoản nội bộ đầu tiên (không có endpoint đăng ký public)

# Database dev (docker-compose.yml ở root — CHỈ chạy Postgres, dùng cho máy dev local)
docker compose up -d        # khởi động container Postgres (lagroup/lagroup/lagroup, chỉ bind 127.0.0.1:5432)
docker compose down         # tắt container (thêm -v nếu muốn xoá luôn volume dữ liệu)

# Hạ tầng production (VPS) — chưa scaffold, sẽ có docker-compose riêng khi triển khai
# (Nginx reverse proxy + Certbot, Next.js standalone, FastAPI/uvicorn, PostgreSQL, n8n qua profile "automation")
docker stats                 # theo dõi RAM/CPU từng container
```

⚠️ **Windows + `npm run test`**: nếu vitest báo lỗi `Cannot find native binding` (rolldown), đây là bug cài optional dependency của npm trên Windows (xem [npm/cli#4828](https://github.com/npm/cli/issues/4828)), không phải lỗi code. Sửa: `npm install --no-save @rolldown/binding-win32-x64-msvc@<version khớp với rolldown trong package-lock.json>`.

(Cập nhật danh sách này ngay khi cấu trúc project thực tế có thay đổi — đừng để mục này lệch với repo.)
