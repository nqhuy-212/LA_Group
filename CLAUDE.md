# LA Group — Job Portal Website

Website chính thức của **LA Group** (pháp nhân: LAHR — Công ty Cổ phần Dịch vụ Cung ứng Nhân lực LA), kết nối doanh nghiệp/nhà máy đối tác với người lao động: tuyển dụng, chatbot AI tư vấn việc làm, và trang thông tin công ty. Đối tượng dùng chính là lao động phổ thông, chủ yếu truy cập bằng điện thoại di động.

## Ngôn ngữ giao tiếp

**Luôn giao tiếp và trả lời bằng Tiếng Việt** trong toàn bộ project này (chat, tóm tắt, giải thích, commit message, tài liệu nội bộ) — trừ khi người dùng chủ động chuyển sang ngôn ngữ khác trong phiên làm việc. Code (tên biến/hàm/bảng), thuật ngữ kỹ thuật chuẩn (framework, thư viện, HTTP method...) vẫn giữ nguyên tiếng Anh như quy ước ngành.

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

## Tiến độ dự án (cập nhật gần nhất: 2026-08-02, sau P4)

### Đã hoàn thành

- **Môi trường dev**: cài Python 3.11 (song song Python 3.9 cũ), Docker Desktop; scaffold `frontend/` (Next.js 16 App Router + TypeScript + Tailwind v4) và `backend/` (FastAPI + SQLAlchemy + Alembic, venv Python 3.11 riêng); `docker-compose.yml` ở root chạy PostgreSQL cho dev local; đã verify Alembic kết nối và migrate được vào Postgres thật.
- **Trang chủ site công khai** (`frontend/app/(public)/page.tsx`): dựng đầy đủ theo `design-system.md` — header (topbar + nav sticky + thanh tìm kiếm), hero, sự kiện (carousel scroll-snap), danh sách việc làm mới nhất (tabs lọc theo ngành, client-side), ngành nghề nổi bật, banner giới thiệu chatbot AI, tin tức & chính sách, feed "doanh nghiệp mới", feed "cảnh báo lừa đảo" + warn box, CTA cho doanh nghiệp, giới thiệu công ty, footer đầy đủ thông tin liên hệ (theo `company-info.md`), chatbot widget (UI demo, chưa nối API thật). Toàn bộ dùng mock data (`frontend/lib/mock-data.ts`), animation scroll-reveal qua `ScrollReveal` (IntersectionObserver toàn cục, tôn trọng `prefers-reduced-motion`), design tokens tập trung trong `frontend/app/globals.css` (Tailwind v4 `@theme`).
- Đã đối chiếu thiết kế bắt buộc (mobile 390px + desktop 1440px, chụp qua Edge headless) với `vieclamhaiphong.net_.png`: đạt tinh thần tối giản/hiện đại, không tràn ngang, tông xanh dương + nhãn đỏ "HOT" đúng yêu cầu.
- **PHASE 0 — Nền móng & khoá quyết định** (xem `docs/PLAN.md`, commit `859421b`): code đã commit và **đã push lên GitHub** (`origin/main`, trước đó chưa hề commit ngoài prototype tĩnh); backend chuyển sang pin dependency bằng `pyproject.toml` + `uv.lock` + `.python-version` (`uv`), gỡ `passlib`/`python-jose` (cặp hỏng + gần như không maintain) sang `bcrypt` trực tiếp + `PyJWT`; `requirements.txt` giờ là file export tự động cho Dockerfile; sửa bug `.env` load theo CWD trong `config.py` + thêm `environment` (`dev/staging/prod`) với validator chặn deploy nhầm secret mặc định/CORS localhost ở prod; khoá naming convention constraint DB (`app/db/base.py`) + `app/db/mixins.py`; vá bẫy mất dữ liệu Alembic (`app/models/__init__.py` import tường minh thay vì `import *`, bật `compare_type`/`compare_server_default`); thêm CI (`.github/workflows/ci.yml`, 2 job backend/frontend); Postgres dev chỉ bind `127.0.0.1`; sửa 11 mâu thuẫn giữa `.claude/rules/*` và code thật (Phụ lục A trong `docs/PLAN.md`), thêm mới `seo.md` + `testing.md`.
- **Verify chạy local sau P0**: `docker compose up -d` (Postgres) → `uvicorn app.main:app --reload` (`GET /api/health` = 200) và `npm run dev` (Next.js, `http://localhost:3000` = 200) chạy song song không lỗi.
- **PHASE 1 — Data model + migration 0001 + seed** (commit `78f4a07`, đã push, CI xanh): 11 model SQLAlchemy (`Province`, `AddressMapping`, `IndustrialPark`, `JobCategory`, `Company`, `Job`, `Application`, `Post`, `User`, `RefreshToken`, `AuditLog`) trong `backend/app/models/`, enum dùng chung ở `app/models/enums.py` (Postgres native enum qua `values_callable`); migration 0001 (`7dcb960fdfb3`) đã autogenerate + patch tay 2 chỗ Alembic không tự làm được: (1) unaccent search — extension `unaccent` + hàm wrapper `immutable_unaccent` IMMUTABLE + expression index `ix_jobs_title_unaccent` trên `jobs`, loại khỏi so sánh autogenerate qua `include_object` trong `alembic/env.py` vì index này nằm ngoài `Base.metadata`; (2) `downgrade()` tự thêm `DROP TYPE` cho 6 Postgres ENUM (Alembic không tự sinh khi hạ cấp). Verify full cycle từ DB rỗng: `upgrade head` → `alembic check` sạch → `downgrade base` (0 bảng, 0 enum còn sót) → `upgrade head` lại thành công. `backend/scripts/seed_dev.py` (idempotent qua `ON CONFLICT DO UPDATE` theo slug/code, khớp `lib/mock-data.ts` cũ: 1 tỉnh Hải Dương, 5 KCN, 4 danh mục, 6 công ty, 6 job, 3 post) và `backend/scripts/create_user.py` (CLI tạo tài khoản nội bộ, chặn mật khẩu >72 byte theo D2, không có endpoint đăng ký public). `backend/tests/conftest.py` dùng Postgres thật (`lagroup_test`, tự tạo + migrate 1 lần/session), mỗi test 1 transaction rollback qua `Session(..., join_transaction_mode="create_savepoint")` — đã verify bằng test 2 bước (insert+commit rồi assert rỗng ở test sau).
- **PHASE 2 — Lõi bảo mật + Auth (backend-only)**: `app/core/security.py` (bcrypt trực tiếp + PyJWT, refresh token hash bằng SHA-256 vì là random token chứ không phải mật khẩu), `app/core/rate_limit.py` (slowapi, `get_client_ip` chỉ tin `X-Forwarded-For` khi `environment=="prod"` — tránh cạm bẫy IP giả sau Nginx), `app/core/storage.py` (lưu CV: sniff magic bytes bằng `filetype`, tên file luôn `uuid4`, chặn dung lượng theo stream không đọc hết body trước), `app/core/errors.py` (envelope lỗi thống nhất, không rò traceback), `app/core/audit.py`. `app/api/deps.py` (`get_current_user`, `require_roles`) + `app/api/v1/auth.py` (`POST /api/auth/login|refresh|logout`, `GET /api/auth/me`) — login chặn brute-force **2 lớp độc lập** (rate limit IP qua slowapi + khoá riêng từng email qua `failed_login_count`/`locked_until`, ngưỡng khác nhau có chủ đích để không che lấp nhau khi test); thông báo lỗi giống hệt nhau cho mọi lý do đăng nhập thất bại + verify bằng hash giả cố định khi email không tồn tại (chống timing side-channel); refresh token xoay vòng, dùng lại token đã revoke → tự động revoke toàn bộ session của user. `app/main.py` thêm security headers, tắt `/docs`+`/redoc`+`/openapi.json` khi `environment=="prod"` (verify bằng test reload module). 28 test (`test_security.py`, `test_auth.py`, `test_main.py`) + verify thủ công qua curl thật vào server dev (cookie có đủ `HttpOnly`/`Secure`/`SameSite=Strict`, khoá tài khoản sau 5 lần sai, `/api/auth/me` đúng/sai cookie). Lưu ý khi test qua trình duyệt: dùng `http://localhost` chứ không phải `127.0.0.1` để cookie `Secure` hoạt động qua HTTP thường ở dev (Chrome/Edge/Firefox đặc cách `localhost` là secure context).
- **PHASE 3 — API đọc công khai + FE bỏ mock data**: backend thêm `app/schemas/{common,job,post}.py` + `app/api/v1/public/{jobs,posts,taxonomies,companies}.py` — `GET /api/jobs` (filter `q`/`category`/`industrial_park`/`province`/`salary_min`, phân trang tối đa 50, tìm không dấu qua hàm `immutable_unaccent` đã tạo ở P1), `GET /api/jobs/{slug}` (draft luôn 404, closed/archived vẫn xem được để phục vụ SEO ở P4), `GET /api/job-categories` (kèm `job_count` qua `GROUP BY`), `GET /api/industrial-parks`, `GET /api/posts` (hỗ trợ nhiều `type` phân tách dấu phẩy để trộn news/policy/guide cho khối "Tin tức & Chính sách"), `GET /api/posts/{slug}`, `GET /api/companies/recent` (nguồn cho feed "doanh nghiệp mới" — dùng bảng `companies` thay vì đè thêm ý nghĩa lên `posts.type`, vì enum đã khoá ở P1 không có giá trị "đối tác mới" riêng). Thêm quan hệ `Job.province` (thuần ORM, không cần migration) để trả `province_name` — API trả dữ liệu có cấu trúc (`salary_min: 9000000`), không trả chuỗi đã format. 10 test `test_jobs_public.py`.
  Frontend: `openapi-typescript` sinh `lib/api/schema.d.ts` (script `npm run gen:api`, đã verify chạy 2 lần không diff) từ OpenAPI thật của backend; `lib/api/client.ts` (`serverFetch` dùng `INTERNAL_API_URL` cho Server Component, `browserFetch` dùng path tương đối `/api/...` cho Client Component nhờ D5) — lỗi mạng trả `{ok:false}` thay vì throw, mỗi section trên trang chủ tự hiện "Đang cập nhật..." khi rỗng thay vì sập trang; `lib/format.ts` (`formatSalary/formatDate/formatDeadline/formatPhone/initials`, pin `timeZone: "Asia/Ho_Chi_Minh"` — vì giá trị được format **trên server** trong Server Component rồi truyền xuống dưới dạng chuỗi qua props nên không có nguy cơ hydration mismatch do lệch múi giờ); `lib/view-models/{types,job,post}.ts` (mapper DTO → view-model, giữ nguyên 100% field hiển thị của `lib/mock-data.ts` cũ — nay đã xoá hẳn). `next.config.ts` thêm `rewrites()` proxy `/api/*` cho dev (mô phỏng D5) + `images.remotePatterns`. Thêm `app/(public)/{not-found,error,loading}.tsx` (đặt trong route group `(public)` để kế thừa header/footer, không phải ở `app/` gốc). `app/(public)/page.tsx` chuyển thành async Server Component, `Promise.all` 6 request song song, `export const revalidate = 300`. 25 test `vitest` cho `lib/format.ts` + view-models (cần cài tay `@rolldown/binding-win32-x64-msvc` — bug cài optional dependency của npm trên Windows, xem npm/cli#4828). Vá bẫy tự phát hiện khi viết test: Next.js Data Cache (`fetch` với `next.revalidate`) **persist qua đĩa** ở `.next/cache`, sống sót qua cả restart dev server — muốn test thật "tắt backend" phải xoá hẳn `.next/` trước.
  ⚠️ Ghi nhận (ngoài phạm vi P3, chưa sửa): ảnh chụp 390px cho thấy hàng thống kê trong `HeroSection` có dấu hiệu cắt lề phải — cần một phiên riêng về thiết kế để xác nhận có phải lỗi thật hay chỉ do công cụ chụp headless.
- **PHASE 4 — Trang chi tiết + danh sách + SEO**: `app/(public)/viec-lam/page.tsx` (danh sách lọc qua URL searchParams `q`/`nganh`/`kv`/`luong`, chip ngành nghề, phân trang Prev/Next) + `viec-lam/[slug]/page.tsx` (chi tiết, banner "hết hạn" khi `status != published` thay vì 404, việc làm tương tự cùng ngành, CTA hotline vì form ứng tuyển thật chưa có tới P6); `tin-tuc/page.tsx` (tab lọc theo `type` qua query `loai`) + `tin-tuc/[slug]/page.tsx`; `chinh-sach-bao-mat/page.tsx` (nội dung tĩnh thật theo NĐ13/2023, bắt buộc có trước P6). JSON-LD `JobPosting` (`lib/view-models/job.ts` — `buildJobPostingJsonLd`, tự sinh `description` fallback khi DB rỗng, `validThrough` fallback +30 ngày khi thiếu `deadline`) + `Organization` (`components/layout/OrganizationJsonLd.tsx`, dữ liệu khớp `company-info.md`) — đã verify bằng cách parse trực tiếp script JSON-LD từ response thật, đủ field Google yêu cầu (chưa chạy được Rich Results Test thật vì cần domain public, để dành P9). `app/sitemap.ts` (loop phân trang hết `/api/jobs` + `/api/posts`, try/catch → fallback 4 route tĩnh nếu API lỗi) + `app/robots.ts` (disallow `/dashboard`, `/api`) + `app/opengraph-image.tsx` (`next/og` sinh ảnh 1200×630 từ code, chữ không dấu vì satori không kèm font tiếng Việt) + `metadataBase`/OG mặc định ở `app/layout.tsx`.
  Bộ lọc `SearchBar` (header, dùng chung mọi trang) đổi từ 4 field tĩnh không hoạt động sang lọc thật theo đúng 4 chiều ở `feature-recruitment.md` (từ khoá/ngành nghề/khu vực/mức lương — bỏ hẳn "loại hình" cũ vì không có trong spec và dữ liệu không hỗ trợ), lấy danh mục/KCN thật qua `app/(public)/layout.tsx` (giờ là async Server Component). Enrich `backend/scripts/seed_dev.py` thêm mô tả/yêu cầu/quyền lợi cho 6 job + nội dung `content` riêng (khác `excerpt`) cho 9 post — cần thiết để trang chi tiết mới có nội dung thật để hiển thị/kiểm thử, không còn rỗng.
  **2 bug hạ tầng phát hiện và sửa trong lúc làm P4** (không phải lỗi mới của P4, đã tồn tại từ P0–P3 nhưng chỉ lộ ra khi có nhiều trang): (1) `ScrollReveal` chỉ quét `[data-reveal]` một lần lúc mount (`useEffect` deps rỗng) — layout `(public)` không remount khi chuyển route bằng `<Link>` nên section ở trang mới sẽ mãi mãi `opacity:0`; sửa bằng thêm `usePathname()` vào dependency. (2) `MainNav`/`SiteFooter`/`JobListSection`/`NewsSection` có nhiều link neo `#viec-lam`/`#tin-tuc`/`#chatbot-ai` trỏ tới id chỉ tồn tại trên trang chủ — vô hiệu ở mọi trang khác; đã đổi `#viec-lam`→`/viec-lam`, `#tin-tuc`→`/tin-tuc` (còn `#chatbot-ai` vẫn để nguyên, ngoài phạm vi vì chatbot là widget không có route riêng).
  Verify nghiêm ngặt "tắt backend vẫn 200" cho `sitemap.xml`/`robots.txt`/`/viec-lam`/`/tin-tuc`: phải xoá **toàn bộ** `.next/` (không chỉ `.next/cache`) rồi build lại trong lúc backend đang tắt hẳn, vì `sitemap.xml` là static/ISR — snapshot lúc build trước sống sót qua cả xoá cache thường. Verify job `closed` → đổi thật 1 job trong DB, xác nhận vẫn 200 + banner + `noindex`, rồi revert. Đối chiếu thiết kế 390px/1440px qua Edge headless: phát hiện + sửa ngay 1 lỗi thật (2 select trong `SearchBar` tràn chữ ở desktop do đổi nhãn dài hơn bản cũ) và xác nhận hiện tượng "cắt lề phải" ghi nhận ở P3 lặp lại y hệt trên nhiều section khác **không hề đổi code trong P4** — kết luận chắc chắn đó là artifact của công cụ chụp Edge headless, không phải lỗi CSS thật.

### Trạng thái từng phần (theo rule file)

| Rule file | Trạng thái |
|---|---|
| `feature-recruitment.md` | Danh sách + chi tiết việc làm xong, tìm kiếm/lọc qua URL xong (P4). Form ứng tuyển thật — **chưa làm** (P6, hiện CTA trỏ hotline). |
| `feature-chatbot-ai.md` | UI widget xong (demo, câu trả lời cứng). Tích hợp Claude API + RAG ở FastAPI — **chưa làm**. |
| `feature-company-content.md` | Khối tin tức/chính sách trang chủ + trang danh sách/chi tiết `/tin-tuc` + `/chinh-sach-bao-mat` xong (P4). CMS thật (đăng bài qua Admin UI) — **chưa làm** (P5). |
| `feature-admin-dashboard.md` | **Chưa bắt đầu** (route `(internal)`, JWT/RBAC, Dashboard tổng quan...). |
| `data-models.md` | 11 model SQLAlchemy + migration 0001 xong (P1). API đọc công khai xong (P3), frontend đã dùng hết cho trang chi tiết/danh sách (P4). |
| `security.md` | Auth backend đầy đủ xong (P2). Chưa có UI đăng nhập (đó là P5); RBAC middleware Next.js cũng chờ P5. |
| `seo.md` | JSON-LD `JobPosting`/`Organization`, sitemap/robots, OG/Twitter card, slug bất biến — xong (P4). Google Rich Results Test thật + share Facebook thật — chưa test được (cần domain public, để dành P9). |
| `tech-stack.md` / `commands.md` | Dev env xong (Python 3.11, Docker Postgres, scaffold FE/BE, dependency pin bằng uv, CI). Frontend 100% chạy trên API thật, đủ trang công khai chính (P0–P4). Stack production VPS (Nginx/Certbot/n8n) — **chưa làm**. |

### Bước tiếp theo

**Theo đúng thứ tự phụ thuộc ở [`docs/PLAN.md`](docs/PLAN.md) — nguồn sự thật duy nhất cho roadmap, đọc trước khi bắt đầu:**

1. **PHASE 5 — Admin tối thiểu: nhân viên tự đăng tin** (mốc go-live sớm, site công khai read-only): backend `app/api/v1/admin/{jobs,posts,companies}.py` (CRUD + RBAC + audit log), frontend route group `(internal)` (Sidebar + Topbar, `dang-nhap`, `dashboard/viec-lam`, `dashboard/tin-tuc`) + `frontend/middleware.ts` (chưa tồn tại) chặn `/dashboard/*` khi thiếu cookie hợp lệ.
2. Các phase sau theo đúng đồ thị phụ thuộc trong `docs/PLAN.md` (P6 Form ứng tuyển → P7 Dashboard → P8 Chatbot → P9 Deploy).
3. Ghi chú riêng: xác nhận lại nghi vấn tràn lề ở `HeroSection` mobile 390px trong một phiên có tập trung vào thiết kế — P4 đã xác nhận thêm đây là artifact công cụ chụp headless (lặp lại y hệt ở nhiều section không đổi code), không phải lỗi CSS thật, nhưng vẫn nên dùng công cụ đo khác (DevTools thật) để chốt hẳn.

### Quyết định quan trọng & lý do

- **Python 3.11 cài song song 3.9 cũ, không upgrade in-place** — tránh ảnh hưởng các công cụ khác trên máy đang phụ thuộc Python 3.9.
- **PostgreSQL dev chạy qua Docker container thay vì cài native Windows** — khớp kiến trúc production tự host trên VPS đã chốt ở `tech-stack.md`, tránh lệch môi trường dev/prod.
- **Design tokens định nghĩa trong `app/globals.css` qua Tailwind v4 `@theme`, không tạo `tailwind.config.ts`** — Next.js 16 dùng Tailwind v4, vốn chuyển hẳn sang cấu hình CSS-first; `tailwind.config.ts` không còn là nơi Tailwind v4 đọc mặc định, nên bám theo quy ước v4 thay vì tạo file config không được đọc.
- **Dùng font hệ thống (system-ui stack: -apple-system, Segoe UI, Roboto...) thay vì Google Font "Geist" mặc định của `create-next-app`** — Geist không có subset tiếng Việt (thiếu dấu), trong khi nội dung site 100% tiếng Việt; font hệ thống vừa đảm bảo hiển thị đúng dấu vừa không tốn băng thông tải font, phù hợp đối tượng lao động phổ thông dùng mobile mạng 3G/4G (`code-conventions.md`).
- **Tạo route group `app/(public)/` ngay từ trang chủ đầu tiên** thay vì để phẳng ở `app/` — chuẩn bị sẵn cho route group `(internal)`/Dashboard sau này đúng kiến trúc "2 khu vực layout" đã chốt ở `tech-stack.md`, tránh phải refactor cấu trúc thư mục khi thêm khu vực nội bộ.
- **Ẩn topbar (điện thoại/email) dưới breakpoint `sm` (640px)** — khác với bản tham khảo/prototype tĩnh (luôn hiện topbar mọi kích thước); ưu tiên quy tắc "không có horizontal scroll ở bất kỳ breakpoint nào" trong `design-system.md` vì nhồi đủ số điện thoại + email + 2 link vào một hàng ở 390px sẽ tràn ngang.
- **Chatbot widget hiện chỉ là demo UI (trả lời cứng), chưa gọi API thật** — vì backend endpoint chat theo RAG (`feature-chatbot-ai.md`) chưa được xây trong giai đoạn này; tránh làm dở dang một tính năng cần backend thực sự đứng sau.
- **Dependency backend pin bằng `uv` (`pyproject.toml` + `uv.lock` + `.python-version`), không dùng `pip`/`poetry`** — đảm bảo môi trường dev/CI/VPS cài đúng y hệt một bộ version, `requirements.txt` chỉ còn là file export tự động cho Dockerfile.
- **Bỏ `passlib` + `python-jose`, dùng `bcrypt` trực tiếp + `PyJWT`** — `passlib 1.7.4` đọc `bcrypt.__about__.__version__`, thuộc tính đã bị xoá từ `bcrypt` ≥4.1 (cặp hỏng, chưa nổ vì chưa có dòng auth nào lúc phát hiện); `python-jose` gần như không maintain và có lịch sử CVE.
- **JWT lưu trong httpOnly + Secure + SameSite=Strict cookie, không dùng `OAuth2PasswordBearer`** — tránh token lộ ra qua XSS/localStorage; kể cả test qua `/docs` ở dev vẫn đi qua cookie như luồng thật.
- **Refresh token hash bằng SHA-256 trước khi lưu DB (không phải `bcrypt`)** — token là random 48-byte entropy do server sinh, không phải mật khẩu người dùng chọn, nên không cần cost factor chậm của bcrypt; đổi lại có xoay vòng (rotation) + phát hiện tái sử dụng token đã revoke để tự động revoke toàn bộ session.
- **Chống brute-force login bằng 2 lớp độc lập** (rate limit theo IP qua `slowapi` + khoá riêng từng email qua `failed_login_count`/`locked_until`) — hai ngưỡng khác nhau có chủ đích để không lớp nào che lấp lớp kia khi test; thông báo lỗi giống hệt nhau cho mọi lý do đăng nhập thất bại để chống dò email người dùng (user enumeration).
- **`X-Forwarded-For` chỉ được tin khi `environment == "prod"`** — sau Nginx thật thì `request.client.host` luôn là IP nội bộ proxy nên phải đọc header; ở dev/staging (chưa có Nginx) client có thể tự giả header này nên không được tin.
- **Naming convention constraint DB khoá cứng từ P0** (`pk_/fk_/uq_/ix_/ck_` trong `app/db/base.py`) — nếu để Postgres tự đặt tên, mọi migration sau muốn drop/rename constraint phải tra tên thật trong DB thay vì biết trước theo quy ước.
- **`Company` là bảng bắt buộc, không được bỏ qua** (D7) — LAHR hoạt động theo mô hình cung ứng/cho thuê lại lao động, nên `Company` mang nghĩa "nhà máy/đối tác nơi lao động sẽ làm việc", không phải "bên tự đăng tin" như job board trung lập; có `display_name_public` riêng cho đối tác muốn ẩn danh.
- **`applications` không lưu cột `age`, chỉ lưu `birth_date`** — Dashboard tự tính độ tuổi/bucket tại thời điểm truy vấn, tránh dữ liệu tuổi bị "đông cứng" sai theo thời gian.
- **`applications` không có cột `industrial_park_id`/`category_id` riêng** — các chiều này truy qua `applications.job_id → jobs.industrial_park_id/category_id`, tránh trùng lặp dữ liệu và nguy cơ lệch giữa 2 nguồn.
- **`posts` gộp 4 loại nội dung (news/policy/guide/scam_alert/event) qua một cột `type`, không tách 4 bảng riêng** — 4 loại có schema gần như giống hệt nhau, tách bảng chỉ tạo thêm JOIN không cần thiết cho khối "Tin tức & Chính sách" vốn cần trộn nhiều loại cùng lúc.
- **Feed "doanh nghiệp mới" trên trang chủ lấy từ bảng `companies` (`is_partner=true`), không nhét thêm ý nghĩa vào `posts.type`** — enum `post_type` đã khoá ở P1 không có giá trị riêng cho "đối tác mới"; dùng đúng bảng đã mang ngữ nghĩa đó thay vì lách qua bảng khác.
- **Mock→API áp dụng kiến trúc D14: `openapi-typescript` codegen (`schema.d.ts`) → lớp mapper (`lib/view-models/*`) → component giữ nguyên view-model type** — đổi field ở backend sẽ báo lỗi TypeScript ngay tại mapper thay vì lệch âm thầm; component UI không phải viết lại khi đổi nguồn dữ liệu.
- **API công khai trả dữ liệu có cấu trúc (`salary_min: 9000000`), không trả chuỗi đã format sẵn (`"9 – 12 triệu"`)** — cùng một dữ liệu phải render khác nhau ở card trang chủ, trang chi tiết, JSON-LD `JobPosting`, và câu trả lời chatbot; format hoá ở tầng view-model/frontend, không ở backend.
- **`TestClient` trong pytest phải dùng `base_url="https://testserver"`, không dùng mặc định `http://testserver`** — cookie có flag `Secure` bị cookie jar của `httpx` âm thầm bỏ qua giữa các request nếu base URL không phải HTTPS, gây lỗi 401 khó hiểu ở các test xoay vòng nhiều request (login → refresh → me).
- **Next.js Data Cache (`fetch` với `next: {revalidate}`) persist qua đĩa ở `.next/cache`, sống sót qua cả restart dev server** — muốn test thật "tắt backend vẫn render đúng" phải xoá hẳn `.next/` trước, nếu không sẽ thấy dữ liệu cache cũ và tưởng nhầm là đang gọi API thành công.
