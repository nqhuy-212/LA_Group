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
# Export lại cho backend/Dockerfile (dùng pip) sau khi đổi dependency — KHÔNG sửa tay requirements.txt.
# BẮT BUỘC có --quiet: thiếu nó, dòng trạng thái "Resolved N packages in Xms" lọt vào đầu
# file và pip đọc thành requirement rồi fail ngay lúc docker build (đã dính một lần).
uv export --no-dev --no-hashes --quiet --format requirements-txt > requirements.txt
uv run python -m scripts.seed_dev   # seed dữ liệu dev idempotent (tỉnh/KCN/danh mục/công ty/job/post khớp mock-data.ts cũ)
uv run python -m scripts.create_user --email you@lahr.vn --role admin   # tạo tài khoản nội bộ đầu tiên (không có endpoint đăng ký public)

# Database dev (docker-compose.yml ở root — CHỈ chạy Postgres, dùng cho máy dev local)
docker compose up -d        # khởi động container Postgres (lagroup/lagroup/lagroup, chỉ bind 127.0.0.1:5432)
docker compose down         # tắt container (thêm -v nếu muốn xoá luôn volume dữ liệu)

# Build & push image production: KHÔNG làm tay nữa — job `images` trong
# .github/workflows/ci.yml tự build và push lên GHCR mỗi lần push lên main
# (ghcr.io/<owner>/lahr-backend, ghcr.io/<owner>/lahr-frontend). Tuyệt đối
# không build trên VPS: `npm run build` của Next ăn 2-3GB, VPS 4GB sẽ OOM.

# Hạ tầng production (VPS) — quy trình đầy đủ ở VPS.md, tóm tắt lệnh:
# LUÔN dùng ./scripts/dc.sh thay cho `docker compose` trần — nó tự kèm
# `--env-file .env.prod`. Thiếu cờ đó thì mọi ${...} trong compose rỗng
# (env_file: chỉ nạp biến VÀO container, không dùng cho thay thế biến).
cp .env.prod.example .env.prod && nano .env.prod   # điền giá trị thật, KHÔNG commit
./scripts/dc.sh pull
./scripts/dc.sh up -d
./scripts/dc.sh --profile automation up -d   # thêm n8n nếu cần (mặc định tắt)
./scripts/dc.sh logs -f backend
docker stats                 # theo dõi RAM/CPU — mục tiêu <2GB (DoD P9)

# Xin chứng chỉ SSL lần đầu — phải chạy khi NGINX_CONF=bootstrap.conf.template,
# vì cấu hình đầy đủ tham chiếu file cert chưa tồn tại (nginx sẽ crash-loop).
./scripts/dc.sh run --rm certbot certonly --webroot -w /var/www/certbot \
  --agree-tos --no-eff-email -m <email> -d $DOMAIN -d www.$DOMAIN
# Xong thì đổi NGINX_CONF=lahr.conf.template trong .env.prod rồi:
./scripts/dc.sh up -d --force-recreate nginx

# Nạp danh mục nền + tạo tài khoản admin đầu tiên (DB sau migrate là RỖNG)
./scripts/dc.sh exec backend python -m scripts.seed_dev
./scripts/dc.sh exec -it backend python -m scripts.create_user --email you@lahr.vn --role admin

# Backup / restore — biến đọc thẳng từ .env.prod, không cần truyền tay
./scripts/backup.sh                                        # DB + volume uploads
./scripts/restore.sh /root/backups/lagroup-<ts>.sql.gz.enc # database
./scripts/restore.sh /root/backups/uploads-<ts>.tar.gz.enc # file CV
# Cron hằng đêm: crontab -e -> 0 2 * * * cd /opt/lahr && ./scripts/backup.sh >> /var/log/lahr-backup.log 2>&1
```

⚠️ **Windows + `npm run test`**: nếu vitest báo lỗi `Cannot find native binding` (rolldown), đây là bug cài optional dependency của npm trên Windows (xem [npm/cli#4828](https://github.com/npm/cli/issues/4828)), không phải lỗi code. Sửa: `npm install --no-save @rolldown/binding-win32-x64-msvc@<version khớp với rolldown trong package-lock.json>`.

(Cập nhật danh sách này ngay khi cấu trúc project thực tế có thay đổi — đừng để mục này lệch với repo.)
