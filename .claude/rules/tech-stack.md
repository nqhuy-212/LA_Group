# Tech Stack

**Frontend**
- **Framework**: Next.js (App Router) + TypeScript
- **Styling**: Tailwind CSS v4 + design tokens tập trung trong `app/globals.css` qua `@theme` (CSS-first, **không tạo `tailwind.config.ts`** — Tailwind v4 không đọc file đó theo mặc định); component nguyên tử dùng chung (`components/ui/`) tái tạo tinh thần "kiểu Bootstrap" (Button/Card/Badge/Input...) bằng React component type-safe thay vì rải class HTML tay. Dùng `@radix-ui/react-*` trực tiếp (Dialog/Dropdown/Tabs/Toast...) — **không dùng shadcn CLI** vì nó áp hệ token riêng, xung đột với `@theme` đã có (D12).
- Ứng dụng chia **2 khu vực layout khác nhau**:
  - **Site công khai** (route `/`, `/viec-lam`, `/tin-tuc`, `/gioi-thieu`, `/lien-he`...): Header/Footer marketing, dùng cho khách/người lao động, không cần tài khoản.
  - **Khu vực nội bộ** (route group `(internal)`/`/dashboard/*`): layout Sidebar + Topbar riêng cho nhân viên/quản lý LA Group, yêu cầu đăng nhập. Xem chi tiết ở `feature-admin-dashboard.md`.

**Backend**
- **Framework**: FastAPI (Python) — tách biệt hoàn toàn khỏi Next.js, giao tiếp qua REST API. Chọn FastAPI (thay vì Next.js API routes) vì cần tích hợp AI (Claude API, OCR CCCD) và tự động hoá nghiệp vụ (tính lương, in hợp đồng) — hệ sinh thái Python phù hợp hơn cho các việc này.
- **Database**: PostgreSQL **tự host trên VPS** (không dùng dịch vụ managed/Firebase) — ưu tiên chi phí thấp nhất và tự chủ hoàn toàn dữ liệu (dữ liệu lao động, CCCD, hợp đồng là dữ liệu nhạy cảm). Có lợi thế JSONB (dữ liệu OCR/rule tính lương linh hoạt). *(Ghi chú: chatbot RAG dùng tool-use gọi thẳng DB ở MVP, chưa cần extension `pgvector` — xem D11/`feature-chatbot-ai.md`.)*
- **ORM/Migration**: SQLAlchemy (sync) + Alembic (không dùng Prisma vì backend là Python).
- **Auth**: JWT tự triển khai trong FastAPI bằng `PyJWT` + `bcrypt` trực tiếp (không dùng `passlib`, không tương thích bcrypt ≥4.1), lưu trong **httpOnly/Secure/SameSite=Strict cookie** — dùng cho **khu vực nội bộ/Dashboard** (nhân sự LA Group). Không dùng `OAuth2PasswordBearer` — kể cả khi test qua `/docs` ở dev, Swagger UI vẫn gọi thẳng `POST /api/auth/login` và trình duyệt tự lưu cookie như luồng thật (đã triển khai đầy đủ ở P2, xem `security.md`). Có RBAC 3 role tối thiểu: `admin`/`manager`/`staff` (`app/api/deps.py` — `get_current_user`/`require_roles`), kiểm tra quyền ở cả middleware Next.js lẫn dependency FastAPI (không tin tưởng một lớp duy nhất). Người lao động (ứng viên) không cần tài khoản để xem tin và dùng chatbot.
- **AI Chatbot**: Anthropic Claude API gọi từ FastAPI (Python SDK `anthropic`, không phải `@anthropic-ai/sdk` phía Next.js) — mọi logic nghiệp vụ/RAG nằm ở backend. Next.js chỉ chứa UI widget gọi qua FastAPI. Xem chi tiết ở `feature-chatbot-ai.md`.

**Hạ tầng & Deploy**
- **VPS**: Tino, gói "N8N Basic" (4GB RAM/30GB NVMe, ~239.000đ/tháng), có đường nâng cấp "N8N Pro" (6GB RAM/60GB NVMe, ~379.000đ/tháng) nếu thiếu tài nguyên.
- **Kiến trúc**: Docker Compose (Nginx reverse proxy + Certbot SSL, Next.js `standalone` build, FastAPI/uvicorn, PostgreSQL, n8n là container **tuỳ chọn** qua profile riêng — không phải core dependency). Không build Next.js trên VPS (build local/CI để tránh OOM trên RAM thấp). **Một origin qua Nginx** (`lahr.vn/` → Next.js, `lahr.vn/api/*` → FastAPI); dev dùng `next.config.ts` `rewrites()` để mô phỏng. Hệ quả: **không tạo `frontend/app/api/`**.
- **n8n**: chỉ dùng cho tích hợp nhẹ (webhook → thông báo khi có ứng viên mới), **không** chứa logic nghiệp vụ chính (OCR, tính lương, hợp đồng) — các việc đó viết bằng Python trong FastAPI (dùng `APScheduler` cho tác vụ định kỳ) để dễ test/versioning.
- **Bảo mật hạ tầng**: HTTPS bắt buộc, firewall `ufw` chỉ mở 80/443 + SSH đổi port, các service nội bộ (Postgres/FastAPI/n8n) chỉ giao tiếp qua Docker network, không expose ra ngoài; `fail2ban` cho SSH; secrets trong `.env` không commit git; CORS FastAPI giới hạn đúng domain Next.js.
- **Backup**: `pg_dump` cron hằng đêm, mã hoá rồi đẩy ra ngoài VPS (rclone lên Backblaze B2/Google Drive) vì tự host không có backup tự động như dịch vụ managed.

> `frontend/` (Next.js App Router + TypeScript + Tailwind) và `backend/` (FastAPI, venv Python 3.11, dependency pin bằng `pyproject.toml` + `uv.lock` + `.python-version`, xem D6) đã được scaffold — xem `commands.md` để biết lệnh chạy dev thực tế. Docker Compose ở root hiện chỉ chạy PostgreSQL cho dev local; stack production đầy đủ (Nginx/Certbot/n8n) sẽ thêm khi triển khai VPS. CI (`.github/workflows/ci.yml`) chạy lint + typecheck + build (frontend) và ruff + `alembic check` + pytest (backend) trên mọi PR/push.
