# Tech Stack

**Frontend**
- **Framework**: Next.js (App Router) + TypeScript
- **Styling**: Tailwind CSS + design tokens tập trung trong `tailwind.config.ts`; component nguyên tử dùng chung (`components/ui/`) tái tạo tinh thần "kiểu Bootstrap" (Button/Card/Badge/Input...) bằng React component type-safe thay vì rải class HTML tay. Có thể dùng thêm shadcn/ui (Radix + Tailwind, copy-paste vào source) cho Dialog/Dropdown/Tabs/Toast.
- Ứng dụng chia **2 khu vực layout khác nhau**:
  - **Site công khai** (route `/`, `/viec-lam`, `/tin-tuc`, `/gioi-thieu`, `/lien-he`...): Header/Footer marketing, dùng cho khách/người lao động, không cần tài khoản.
  - **Khu vực nội bộ** (route group `(internal)`/`/dashboard/*`): layout Sidebar + Topbar riêng cho nhân viên/quản lý LA Group, yêu cầu đăng nhập. Xem chi tiết ở `feature-admin-dashboard.md`.

**Backend**
- **Framework**: FastAPI (Python) — tách biệt hoàn toàn khỏi Next.js, giao tiếp qua REST API. Chọn FastAPI (thay vì Next.js API routes) vì cần tích hợp AI (Claude API, OCR CCCD) và tự động hoá nghiệp vụ (tính lương, in hợp đồng) — hệ sinh thái Python phù hợp hơn cho các việc này.
- **Database**: PostgreSQL **tự host trên VPS** (không dùng dịch vụ managed/Firebase) — ưu tiên chi phí thấp nhất và tự chủ hoàn toàn dữ liệu (dữ liệu lao động, CCCD, hợp đồng là dữ liệu nhạy cảm). Có lợi thế JSONB (dữ liệu OCR/rule tính lương linh hoạt) và extension `pgvector` cho semantic search của chatbot RAG.
- **ORM/Migration**: SQLAlchemy + Alembic (không dùng Prisma vì backend là Python).
- **Auth**: JWT tự triển khai trong FastAPI (`OAuth2PasswordBearer` + `passlib`/`bcrypt` hash mật khẩu), lưu trong httpOnly/Secure cookie — dùng cho **khu vực nội bộ/Dashboard** (nhân sự LA Group). Có RBAC 3 role tối thiểu: `admin`/`manager`/`staff`, kiểm tra quyền ở cả middleware Next.js lẫn dependency FastAPI (không tin tưởng một lớp duy nhất). Người lao động (ứng viên) không cần tài khoản để xem tin và dùng chatbot.
- **AI Chatbot**: Anthropic Claude API gọi từ FastAPI (Python SDK `anthropic`, không phải `@anthropic-ai/sdk` phía Next.js) — mọi logic nghiệp vụ/RAG nằm ở backend. Next.js chỉ chứa UI widget gọi qua FastAPI. Xem chi tiết ở `feature-chatbot-ai.md`.

**Hạ tầng & Deploy**
- **VPS**: Tino, gói "N8N Basic" (4GB RAM/30GB NVMe, ~239.000đ/tháng), có đường nâng cấp "N8N Pro" (6GB RAM/60GB NVMe, ~379.000đ/tháng) nếu thiếu tài nguyên.
- **Kiến trúc**: Docker Compose (Nginx reverse proxy + Certbot SSL, Next.js `standalone` build, FastAPI/uvicorn, PostgreSQL, n8n là container **tuỳ chọn** qua profile riêng — không phải core dependency). Không build Next.js trên VPS (build local/CI để tránh OOM trên RAM thấp).
- **n8n**: chỉ dùng cho tích hợp nhẹ (webhook → thông báo khi có ứng viên mới), **không** chứa logic nghiệp vụ chính (OCR, tính lương, hợp đồng) — các việc đó viết bằng Python trong FastAPI (dùng `APScheduler` cho tác vụ định kỳ) để dễ test/versioning.
- **Bảo mật hạ tầng**: HTTPS bắt buộc, firewall `ufw` chỉ mở 80/443 + SSH đổi port, các service nội bộ (Postgres/FastAPI/n8n) chỉ giao tiếp qua Docker network, không expose ra ngoài; `fail2ban` cho SSH; secrets trong `.env` không commit git; CORS FastAPI giới hạn đúng domain Next.js.
- **Backup**: `pg_dump` cron hằng đêm, mã hoá rồi đẩy ra ngoài VPS (rclone lên Backblaze B2/Google Drive) vì tự host không có backup tự động như dịch vụ managed.

> Dự án hiện chưa được scaffold. Khi khởi tạo `frontend/` (`npx create-next-app`) và `backend/` (FastAPI), cập nhật lại `commands.md` cho khớp thực tế.
