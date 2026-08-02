# LA Group — Job Portal Website

Website chính thức của **LA Group** (pháp nhân: LAHR — Công ty Cổ phần Dịch vụ Cung ứng Nhân lực LA), kết nối doanh nghiệp/nhà máy đối tác với người lao động: tuyển dụng, chatbot AI tư vấn việc làm, và trang thông tin công ty. Đối tượng dùng chính là lao động phổ thông, chủ yếu truy cập bằng điện thoại di động.

Toàn bộ quy tắc chi tiết của dự án được tách theo chủ đề trong `.claude/rules/` (chuẩn rule của Claude Code — mỗi file luôn được nạp vào ngữ cảnh phiên làm việc, không cần khai báo gì thêm trong file này):

- [`overview.md`](.claude/rules/overview.md) — Tổng quan dự án, đối tượng người dùng, mục tiêu UX
- [`company-info.md`](.claude/rules/company-info.md) — Thông tin pháp nhân/liên hệ chính thức của LA Group (LAHR)
- [`tech-stack.md`](.claude/rules/tech-stack.md) — Kiến trúc kỹ thuật: frontend (Next.js), backend (FastAPI), database (PostgreSQL tự host), hạ tầng VPS
- [`commands.md`](.claude/rules/commands.md) — Lệnh thường dùng để chạy/build/migrate dự án
- [`design-system.md`](.claude/rules/design-system.md) — Design system, mobile-first, yêu cầu đối chiếu thiết kế bắt buộc
- [`feature-recruitment.md`](.claude/rules/feature-recruitment.md) — Tính năng tuyển dụng
- [`feature-chatbot-ai.md`](.claude/rules/feature-chatbot-ai.md) — Chatbot AI tư vấn việc làm
- [`feature-company-content.md`](.claude/rules/feature-company-content.md) — Trang thông tin công ty
- [`feature-admin-dashboard.md`](.claude/rules/feature-admin-dashboard.md) — Admin/CMS & Dashboard nội bộ cho nhân viên/quản lý
- [`data-models.md`](.claude/rules/data-models.md) — Data models hiện tại và các entity mở rộng cho roadmap tương lai
- [`security.md`](.claude/rules/security.md) — Yêu cầu bảo mật (bắt buộc, không phải làm sau)
- [`seo.md`](.claude/rules/seo.md) — Yêu cầu SEO (slug, JSON-LD `JobPosting`, sitemap/robots) — kênh khách hàng chính
- [`testing.md`](.claude/rules/testing.md) — Triết lý testing, CI, những gì nên/không nên test
- [`code-conventions.md`](.claude/rules/code-conventions.md) — Quy ước code
- [`out-of-scope.md`](.claude/rules/out-of-scope.md) — Phạm vi MVP (chưa làm ở giai đoạn này)

Khi có quyết định kiến trúc/nghiệp vụ mới, cập nhật đúng file rule liên quan theo chủ đề — không dồn nội dung mới trở lại file này.

## Roadmap triển khai

**[`docs/PLAN.md`](docs/PLAN.md) là nguồn sự thật duy nhất cho kế hoạch triển khai** — roadmap 10 phase (P0→P9) có thứ tự phụ thuộc, Definition of Done từng phase, và 15 quyết định kỹ thuật đã khoá (D1–D15). Đọc file đó trước khi bắt đầu bất kỳ phase nào; mỗi phiên làm việc chỉ nhận một phase. Mục "Tiến độ dự án" bên dưới ghi trạng thái thực tế, `docs/PLAN.md` ghi việc phải làm tiếp.

## Model Usage Policy

Áp dụng cho mọi task trong project LA Group Job Portal.

### 🔴 OPUS 5 — Dùng khi:
- Thiết kế kiến trúc, chọn tech stack
- Security audit (auth, injection, CORS, data exposure)
- Performance bottleneck phức tạp (query optimization, caching strategy)
- Review tổng thể trước khi release

### 🔵 SONNET 5 — Dùng khi:
- Viết business logic, domain rules
- API endpoints có validation và error handling
- Authentication / Authorization flow
- State management, data transformation phức tạp
- Database schema và query có join nhiều bảng

### ⚪ HAIKU 4.5 — Dùng khi:
- Boilerplate: router skeleton, controller template, model CRUD
- CSS, Tailwind component styling
- Unit test cho pure function đơn giản
- Config files, .env template, Dockerfile cơ bản
- Tạo seed data, mock data

### Rule bắt buộc:
Trước mỗi response, Claude phải ghi một dòng:
> Recommended model: [OPUS/SONNET/HAIKU] — [lý do ngắn gọn]

## Tiến độ dự án (cập nhật gần nhất: 2026-08-02)

### Đã hoàn thành

- **Môi trường dev**: cài Python 3.11 (song song Python 3.9 cũ), Docker Desktop; scaffold `frontend/` (Next.js 16 App Router + TypeScript + Tailwind v4) và `backend/` (FastAPI + SQLAlchemy + Alembic, venv Python 3.11 riêng); `docker-compose.yml` ở root chạy PostgreSQL cho dev local; đã verify Alembic kết nối và migrate được vào Postgres thật.
- **Trang chủ site công khai** (`frontend/app/(public)/page.tsx`): dựng đầy đủ theo `design-system.md` — header (topbar + nav sticky + thanh tìm kiếm), hero, sự kiện (carousel scroll-snap), danh sách việc làm mới nhất (tabs lọc theo ngành, client-side), ngành nghề nổi bật, banner giới thiệu chatbot AI, tin tức & chính sách, feed "doanh nghiệp mới", feed "cảnh báo lừa đảo" + warn box, CTA cho doanh nghiệp, giới thiệu công ty, footer đầy đủ thông tin liên hệ (theo `company-info.md`), chatbot widget (UI demo, chưa nối API thật). Toàn bộ dùng mock data (`frontend/lib/mock-data.ts`), animation scroll-reveal qua `ScrollReveal` (IntersectionObserver toàn cục, tôn trọng `prefers-reduced-motion`), design tokens tập trung trong `frontend/app/globals.css` (Tailwind v4 `@theme`).
- Đã đối chiếu thiết kế bắt buộc (mobile 390px + desktop 1440px, chụp qua Edge headless) với `vieclamhaiphong.net_.png`: đạt tinh thần tối giản/hiện đại, không tràn ngang, tông xanh dương + nhãn đỏ "HOT" đúng yêu cầu.
- **PHASE 0 — Nền móng & khoá quyết định** (xem `docs/PLAN.md`): code đã commit (trước đó chưa hề commit ngoài prototype tĩnh); backend chuyển sang pin dependency bằng `pyproject.toml` + `uv.lock` + `.python-version` (`uv`), gỡ `passlib`/`python-jose` (cặp hỏng + gần như không maintain) sang `bcrypt` trực tiếp + `PyJWT`; `requirements.txt` giờ là file export tự động cho Dockerfile; sửa bug `.env` load theo CWD trong `config.py` + thêm `environment` (`dev/staging/prod`) với validator chặn deploy nhầm secret mặc định/CORS localhost ở prod; khoá naming convention constraint DB (`app/db/base.py`) + `app/db/mixins.py`; vá bẫy mất dữ liệu Alembic (`app/models/__init__.py` import tường minh thay vì `import *`, bật `compare_type`/`compare_server_default`); thêm CI (`.github/workflows/ci.yml`, 2 job backend/frontend, chưa push nên chưa có lần chạy thật); Postgres dev chỉ bind `127.0.0.1`; sửa 11 mâu thuẫn giữa `.claude/rules/*` và code thật (Phụ lục A trong `docs/PLAN.md`), thêm mới `seo.md` + `testing.md`.

### Trạng thái từng phần (theo rule file)

| Rule file | Trạng thái |
|---|---|
| `feature-recruitment.md` | Trang chủ (danh sách rút gọn + tabs lọc client-side) xong. Trang chi tiết việc làm, tìm kiếm/lọc qua API thật, form ứng tuyển — **chưa làm**. |
| `feature-chatbot-ai.md` | UI widget xong (demo, câu trả lời cứng). Tích hợp Claude API + RAG ở FastAPI — **chưa làm**. |
| `feature-company-content.md` | Khối tin tức/chính sách trên trang chủ (mock data) xong. Trang chi tiết bài viết + CMS thật — **chưa làm**. |
| `feature-admin-dashboard.md` | **Chưa bắt đầu** (route `(internal)`, JWT/RBAC, Dashboard tổng quan...). |
| `data-models.md` | **Chưa có** model SQLAlchemy nào ngoài skeleton `Base` (đã khoá naming convention + mixin sẵn ở P0); mock data ở frontend là placeholder, chưa map vào entity thật. |
| `security.md` | **Chưa triển khai luồng auth thật** (JWT/RBAC/rate limiting ở P2) — nhưng primitive nền (bcrypt/PyJWT đã pin, cookie-only đã chốt trong rule) xong ở P0. |
| `tech-stack.md` / `commands.md` | Dev env xong (Python 3.11, Docker Postgres, scaffold FE/BE, dependency pin bằng uv, CI). Stack production VPS (Nginx/Certbot/n8n) — **chưa làm**. |

### Bước tiếp theo

**Theo đúng thứ tự phụ thuộc ở [`docs/PLAN.md`](docs/PLAN.md) — nguồn sự thật duy nhất cho roadmap, đọc trước khi bắt đầu:**

1. **PHASE 1 — Data model + migration 0001 + seed**: model SQLAlchemy đầu tiên (`provinces`, `address_mappings`, `industrial_parks`, `job_categories`, `companies`, `jobs`, `applications`, `posts`, `users`, `refresh_tokens`, `audit_logs`) + `backend/scripts/seed_dev.py` (idempotent, khớp `lib/mock-data.ts`) + `backend/scripts/create_user.py`.
2. **PHASE 2 — Lõi bảo mật + Auth** (backend-only, chặn P6).
3. **PHASE 3 — API đọc công khai + FE bỏ mock data**.
4. Các phase sau theo đúng đồ thị phụ thuộc trong `docs/PLAN.md` (P4 SEO → P5 Admin đăng tin/go-live → P6 Form ứng tuyển → P7 Dashboard → P8 Chatbot → P9 Deploy).

### Quyết định quan trọng & lý do

- **Python 3.11 cài song song 3.9 cũ, không upgrade in-place** — tránh ảnh hưởng các công cụ khác trên máy đang phụ thuộc Python 3.9.
- **PostgreSQL dev chạy qua Docker container thay vì cài native Windows** — khớp kiến trúc production tự host trên VPS đã chốt ở `tech-stack.md`, tránh lệch môi trường dev/prod.
- **Design tokens định nghĩa trong `app/globals.css` qua Tailwind v4 `@theme`, không tạo `tailwind.config.ts`** — Next.js 16 dùng Tailwind v4, vốn chuyển hẳn sang cấu hình CSS-first; `tailwind.config.ts` không còn là nơi Tailwind v4 đọc mặc định, nên bám theo quy ước v4 thay vì tạo file config không được đọc.
- **Dùng font hệ thống (system-ui stack: -apple-system, Segoe UI, Roboto...) thay vì Google Font "Geist" mặc định của `create-next-app`** — Geist không có subset tiếng Việt (thiếu dấu), trong khi nội dung site 100% tiếng Việt; font hệ thống vừa đảm bảo hiển thị đúng dấu vừa không tốn băng thông tải font, phù hợp đối tượng lao động phổ thông dùng mobile mạng 3G/4G (`code-conventions.md`).
- **Tạo route group `app/(public)/` ngay từ trang chủ đầu tiên** thay vì để phẳng ở `app/` — chuẩn bị sẵn cho route group `(internal)`/Dashboard sau này đúng kiến trúc "2 khu vực layout" đã chốt ở `tech-stack.md`, tránh phải refactor cấu trúc thư mục khi thêm khu vực nội bộ.
- **Ẩn topbar (điện thoại/email) dưới breakpoint `sm` (640px)** — khác với bản tham khảo/prototype tĩnh (luôn hiện topbar mọi kích thước); ưu tiên quy tắc "không có horizontal scroll ở bất kỳ breakpoint nào" trong `design-system.md` vì nhồi đủ số điện thoại + email + 2 link vào một hàng ở 390px sẽ tràn ngang.
- **Chatbot widget hiện chỉ là demo UI (trả lời cứng), chưa gọi API thật** — vì backend endpoint chat theo RAG (`feature-chatbot-ai.md`) chưa được xây trong giai đoạn này; tránh làm dở dang một tính năng cần backend thực sự đứng sau.
- **Toàn bộ nội dung trang chủ dùng mock data trong `lib/mock-data.ts`, chưa nối API** — vì chưa có model/API `Job` thật; giữ tách biệt rõ giữa UI và nguồn dữ liệu để dễ thay bằng fetch/server action thật khi có API mà không phải viết lại UI.
