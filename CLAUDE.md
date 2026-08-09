# LA Group — Job Portal Website

Website chính thức của **LA Group** (pháp nhân: LAHR — Công ty Cổ phần Dịch vụ Cung ứng Nhân lực LA), kết nối doanh nghiệp/nhà máy đối tác với người lao động: tuyển dụng, chatbot AI tư vấn việc làm, và trang thông tin công ty. Đối tượng dùng chính là lao động phổ thông, chủ yếu truy cập bằng điện thoại di động.

## Ngôn ngữ giao tiếp

**Luôn giao tiếp và trả lời bằng Tiếng Việt** trong toàn bộ project này (chat, tóm tắt, giải thích, commit message, tài liệu nội bộ) — trừ khi người dùng chủ động chuyển sang ngôn ngữ khác trong phiên. Code (tên biến/hàm/bảng) và thuật ngữ kỹ thuật chuẩn (framework, thư viện, HTTP method...) vẫn giữ tiếng Anh như quy ước ngành.

## Bản đồ tài liệu

| Nơi | Chứa gì |
|---|---|
| [`docs/PLAN.md`](docs/PLAN.md) | **Việc phải làm tiếp** — roadmap P0→P9, 15 quyết định đã khoá (D1–D15), DoD từng phase, primitive có sẵn để tái dùng, việc còn nợ. **Đọc trước khi bắt đầu bất kỳ phase nào.** Mỗi phiên nhận đúng một phase (hoặc một nửa phase). |
| `.claude/rules/*.md` | Quy tắc thường trực, tự nạp vào mọi phiên |
| File này | Trạng thái hiện tại + quyết định kiến trúc + bẫy kỹ thuật đã gặp |
| `git log` | Lịch sử chi tiết từng phase — không chép lại vào tài liệu |

Rule theo chủ đề: [`overview`](.claude/rules/overview.md) · [`company-info`](.claude/rules/company-info.md) · [`tech-stack`](.claude/rules/tech-stack.md) · [`commands`](.claude/rules/commands.md) · [`design-system`](.claude/rules/design-system.md) · [`data-models`](.claude/rules/data-models.md) · [`security`](.claude/rules/security.md) · [`seo`](.claude/rules/seo.md) · [`testing`](.claude/rules/testing.md) · [`code-conventions`](.claude/rules/code-conventions.md) · [`out-of-scope`](.claude/rules/out-of-scope.md) · [`feature-recruitment`](.claude/rules/feature-recruitment.md) · [`feature-chatbot-ai`](.claude/rules/feature-chatbot-ai.md) · [`feature-company-content`](.claude/rules/feature-company-content.md) · [`feature-admin-dashboard`](.claude/rules/feature-admin-dashboard.md)

Có quyết định kiến trúc/nghiệp vụ mới → cập nhật đúng file rule theo chủ đề, không dồn ngược về file này.

### Cập nhật tài liệu sau mỗi phase — bắt buộc

Làm trong **cùng commit** với code của phase, đúng theo bảng phân vai trên:

1. **[`docs/PLAN.md`](docs/PLAN.md)** — tích `- [x]` DoD; đổi trạng thái phiên trong bảng *Lộ trình*; thêm **đúng 1 dòng** vào bảng *Đã hoàn thành* (liệt kê file/module đã dựng, không phải đoạn văn); bổ sung primitive mới vào § *Primitive có sẵn*; cập nhật § *Việc còn nợ*.
2. **File này** — cập nhật bảng *Trạng thái dự án*; thêm quyết định kiến trúc mới và bẫy mới gặp, **mỗi mục 1 dòng kèm lý do ngắn**.
3. **`.claude/rules/*`** — chỉ khi phase làm đổi quy tắc thường trực (schema, lệnh chạy, quy ước SEO/bảo mật/testing).

**Không được làm:**
- **Không kể lại diễn biến phase** (đã làm gì, verify thế nào, test nào pass) — `git log` giữ việc đó, tài liệu chỉ giữ thứ còn dùng về sau.
- **Không chép cùng một thông tin sang file thứ hai.** Mỗi sự việc tồn tại đúng một nơi: *việc phải làm tiếp* → `PLAN.md`; *trạng thái, quyết định, bẫy* → file này; *quy tắc thường trực* → `.claude/rules/`.
- **Không giữ nội dung đã hết hiệu lực** (mục đã sửa xong, mâu thuẫn đã giải quyết, phụ lục đã dùng hết) — xoá hẳn, đừng đánh dấu "đã xong" rồi để lại.

**Tripwire**: nếu `CLAUDE.md` vượt ~150 dòng hoặc `docs/PLAN.md` vượt ~250 dòng, hoặc bạn đọc được cùng một sự việc ở cả hai file — tài liệu đã phình, phải nén lại trước khi làm phase tiếp theo.

## Model Usage Policy

- 🔴 **OPUS 5** — thiết kế kiến trúc, chọn tech stack, security audit, performance bottleneck phức tạp, review tổng thể trước release.
- 🔵 **SONNET 5** — business logic, API endpoint có validation/error handling, auth flow, state management, schema và query join nhiều bảng.
- ⚪ **HAIKU 4.5** — boilerplate (router/controller/CRUD), CSS/Tailwind, unit test pure function, config/`.env`/Dockerfile cơ bản, seed data.

**Bắt buộc**: trước mỗi response, ghi một dòng `Recommended model: [OPUS/SONNET/HAIKU] — [lý do ngắn gọn]`.

---

## Trạng thái dự án (2026-08-09, sau GĐ A+B chuẩn bị deploy)

**P0–P9 xong về mã nguồn; artifact deploy đã vá xong 22 vấn đề và sẵn sàng lên VPS.** Việc tiếp theo là commit + push để CI đẩy image lên GHCR, rồi chạy [`VPS.md`](VPS.md) trên VPS thật. Domain demo: `rg-nqhuy.io.vn`; chuyển sang tên miền khách hàng sau (VPS.md §10).

**Môi trường phiên làm việc này không có VPS/domain/SSH thật** — SSL, nmap, cron backup, Google/Facebook debugger đều chưa verify được. Chatbot dùng OpenAI API và **đã verify hành vi LLM thật** (tool `search_jobs` trả đúng tin có trong DB kèm link, không bịa, từ chối lịch sự câu ngoài phạm vi).

| Vùng | Trạng thái |
|---|---|
| `feature-recruitment` | ✅ Danh sách + chi tiết + lọc qua URL (P4); form ứng tuyển thật + upload CV + anti-spam + chống trùng (P6); tiêu chí `employment_type` (chính thức/thời vụ) + `salary_period` (lương tuần/tháng) enum hoá, admin chọn qua dropdown, hiện ở card/chi tiết + lọc được ở `SearchBar` (6 chiều) và `GET /api/jobs` |
| `feature-company-content` | ✅ Tin tức/chính sách trang chủ + `/tin-tuc` + `/chinh-sach-bao-mat` (P4); CMS đăng bài qua Admin UI (P5) |
| `security` | ✅ Auth backend đầy đủ (P2); UI đăng nhập + `proxy.ts` + RBAC thật ở FastAPI (P5); endpoint public ghi PII đủ rate limit/sniff file/consent NĐ13 + purge (P6); `POST /api/leads` (lead chatbot) dùng chung cơ chế chống spam qua `core/antispam.py` |
| `seo` | ✅ JSON-LD `JobPosting`/`Organization`, sitemap/robots, OG (P4). ⏳ Rich Results Test + Facebook Debugger thật cần domain public thật |
| `data-models` | ✅ 11 model + migration 0001+`d1def644e25b`+`6875eab5dcc5` (P1/P9/mở rộng); API đọc (P3); Admin API ghi + audit log (P5); list/filter/assign/export ứng viên + stats (P7); `Job.employment_type`/`salary_period` enum, `Application.notes` |
| `feature-admin-dashboard` | ✅ `(internal)` + đăng nhập + RBAC 3 role + CRUD Job/Post/Company (P5); Dashboard tổng quan + Quản lý ứng viên (P7). ❌ Nhân sự, Nhập liệu, Hợp đồng, Chấm công/OCR — giai đoạn sau |
| `feature-chatbot-ai` | ✅ RAG qua tool `search_jobs` + SSE streaming thật (P8); đổi sang OpenAI API, đã verify hành vi LLM thật bằng `OPENAI_API_KEY`; quiz 4 câu hỏi có thứ tự + nút quay lại kể cả sau "gọi trực tiếp" (state máy ở frontend), sau câu 3 gọi thẳng `GET /api/jobs` hiện việc làm phù hợp thật (không qua LLM) → lead qua `POST /api/leads` |
| `tech-stack` | ✅ Dockerfile BE/FE + `docker-compose.prod.yml` + `nginx/*.conf.template` + backup/restore; CI tự build & push image lên GHCR; `mem_limit`/log rotation/pin tag đầy đủ. ⏳ Deploy thật cần VPS/domain |

---

## Quyết định kiến trúc

D1–D15 nằm ở [`docs/PLAN.md`](docs/PLAN.md). Dưới đây là các quyết định phát sinh trong lúc triển khai — **không mâu thuẫn với chúng khi viết code mới**.

### Môi trường & build
- **Python 3.11 cài song song 3.9 cũ** (không upgrade in-place, tránh vỡ công cụ khác) và **Postgres dev chạy qua Docker** (không cài native Windows — khớp kiến trúc tự host trên VPS, tránh lệch dev/prod).
- **Design tokens ở `app/globals.css` qua Tailwind v4 `@theme`, KHÔNG tạo `tailwind.config.ts`** — v4 chuyển sang cấu hình CSS-first, không đọc file đó nữa.
- **Dùng font hệ thống, không dùng Geist mặc định của `create-next-app`** — Geist thiếu subset tiếng Việt (mất dấu); font hệ thống vừa đúng dấu vừa không tốn băng thông trên 3G/4G.
- **Route group `app/(public)/` tạo ngay từ trang đầu** — chuẩn bị sẵn cho `(internal)`, khỏi refactor cấu trúc sau.

### Data model
- **Naming convention constraint khoá cứng từ P0** (`pk_/fk_/uq_/ix_/ck_` trong `app/db/base.py`) — nếu để Postgres tự đặt tên, mọi migration sau muốn drop/rename phải tra tên thật trong DB.
- **`applications` không lưu `age` (chỉ `birth_date`) và không có `industrial_park_id`/`category_id` riêng** — tuổi tính lúc query để không bị "đông cứng" sai theo thời gian; hai chiều còn lại truy qua `job_id → jobs.*` để tránh trùng lặp và lệch giữa 2 nguồn.
- **`posts` gộp 5 loại nội dung qua cột `type`**, không tách 5 bảng — schema gần giống hệt nhau, mà khối "Tin tức & Chính sách" lại cần trộn nhiều loại cùng lúc.
- **Feed "doanh nghiệp mới" lấy từ bảng `companies` (`is_partner=true`)**, không nhét nghĩa mới vào `posts.type` — enum đã khoá ở P1 không có giá trị "đối tác mới".
- **`Job.employment_type` enum hoá tại chỗ** (`official`/`seasonal`, migration `6875eab5dcc5`) thay vì tạo cột mới — cột này đã tồn tại từ P1 dạng free-text nhưng chưa từng có dữ liệu seed, khớp đúng ngữ nghĩa "chính thức/thời vụ" nên tái dùng an toàn (migration tự `UPDATE ... SET employment_type = NULL WHERE NOT IN (...)` trước khi ALTER phòng dữ liệu tự do cũ gõ tay qua `JobForm.tsx`). Thêm cột mới `Job.salary_period` (`weekly`/`monthly`) cùng cơ chế — không có cột free-text tương đương để tái dùng.
- **`Application.notes` (Text, nullable) dùng chung cho mọi nguồn**, không tách riêng cột theo từng use-case — hiện chỉ `POST /api/leads` ghi (tóm tắt lựa chọn quiz chatbot), nhưng để mở cho ghi chú thủ công của nhân viên sau này.

### Backend & bảo mật
- **Refresh token hash bằng SHA-256, không phải bcrypt** — là random 48-byte entropy do server sinh, không phải mật khẩu người chọn, nên không cần cost factor chậm. Bù lại có xoay vòng + phát hiện tái sử dụng token đã revoke → revoke toàn bộ session.
- **Chống brute-force login 2 lớp độc lập** (rate limit IP qua `slowapi` + khoá từng email qua `failed_login_count`/`locked_until`), hai ngưỡng khác nhau có chủ đích để không lớp nào che lấp lớp kia khi test. Thông báo lỗi **giống hệt nhau** cho mọi lý do thất bại + verify bằng hash giả cố định khi email không tồn tại (chống user enumeration + timing side-channel).
- **`X-Forwarded-For` chỉ được tin khi `environment == "prod"`** — sau Nginx thật thì `request.client.host` luôn là IP nội bộ; ở dev/staging chưa có Nginx nên client tự giả được header này.
- **`POST /api/applications` là `def` đồng bộ, không `async def`** — đúng D1; Starlette tự chạy trong threadpool, tránh chặn event loop khi vừa ghi DB vừa đọc stream file.
- **Honeypot/timing và chống trùng xử lý khác nhau có chủ đích** — honeypot bị điền hoặc `elapsed_ms < 2000` là bot: trả **y hệt** response thành công (mã hồ sơ hợp lệ nhưng không lưu DB) để bot không học được là đã bị phát hiện. Trùng `(job_id, phone)` trong 7 ngày là **người thật**: báo thân thiện + trả lại `reference_code` cũ.
- **Giới hạn 10 đơn/ngày/SĐT bằng `COUNT` trực tiếp trong endpoint**, không dùng `key_func` của `slowapi` — slowapi áp limit ở tầng request trước khi FastAPI parse xong multipart, chưa có `phone` để làm khoá.
- **`CONSENT_VERSION` cố định ở backend**, không nhận từ client — client không đáng tin để tự khai đã đọc phiên bản chính sách nào.
- **Webhook n8n dùng `urllib.request` (stdlib), không thêm `httpx` vào runtime deps** — chỉ 1 lệnh POST fire-and-forget; `httpx` vốn chỉ ở `dependency-groups.dev`.
- **RBAC phân theo mức rủi ro dữ liệu**, không đồng nhất "admin làm hết, staff chỉ xem": Job/Post là việc hằng ngày nên cả 3 role tạo/sửa được, chỉ xoá mới thu hẹp admin+manager; `Company` là dữ liệu nền tảng nhiều Job tham chiếu → tạo/sửa admin+manager, xoá chỉ admin, staff chỉ xem để chọn khi đăng tin.
- **Admin API dùng `company_slug`/`category_slug`/`industrial_park_slug`, không dùng int ID** — nhất quán với API công khai (D8) và khỏi mở thêm endpoint chỉ để lộ ID nội bộ.
- **Slug tự sinh qua `python-slugify` + tự thêm hậu tố `-2/-3...` khi trùng**, và **bất biến sau khi publish** (`published_at is None` mới cho regenerate). `Company` không có draft nên slug đông cứng ngay từ lúc tạo.
- **Application admin API dựng dần qua nhiều phase** (P6: chỉ `GET /{id}/cv` + `POST /{id}/purge`; P7: thêm list/filter/đổi trạng thái/gán người phụ trách/export CSV) — `purge` giữ `reference_code`/`job_id`/`status`/`created_at` để không phá thống kê. Xem/đổi trạng thái/gán mở cho cả 3 role (việc hằng ngày); **export CSV thu hẹp admin+manager** — kéo PII hàng loạt, rủi ro cao hơn xem từng hồ sơ, xếp cùng nhóm với `purge`.
- **`GET /api/admin/users` chỉ đọc, không có endpoint tạo/sửa** — thêm tối thiểu chỉ để phục vụ dropdown "gán người phụ trách" ở P7; tạo tài khoản vẫn qua `scripts/create_user.py` (giữ nguyên từ P0, xem `security.md`).
- **CV trong `POST /api/applications` là optional** (`cv: UploadFile | None = File(None)`), đổi từ bắt buộc ban đầu — lao động phổ thông không phải lúc nào cũng có sẵn file CV; SĐT/họ tên mới là bắt buộc, LAHR chủ động gọi lại. `cv_file_path` và các cột liên quan vốn đã nullable từ P1 nên không cần migration; admin API (`has_cv`, `GET /{id}/cv`) đã xử lý `None` từ trước.
- **Stats (`/api/admin/stats/*`) mở cho cả 3 role xem**, khác với export/purge — vì Dashboard tổng quan là trang mặc định sau đăng nhập của mọi role (D15/feature-admin-dashboard.md), không riêng admin/manager.
- **Biểu đồ Dashboard dùng SVG/CSS thuần (`components/internal/charts.tsx`), không thêm dependency `recharts`** — 4 biểu đồ P7 chỉ là bar chart đơn giản, đủ dùng bằng div/SVG, tránh phình bundle cho lợi ích không tương xứng.
- **Export CSV ghi thêm BOM (`﻿`) ở đầu file** — Excel mở file UTF-8 không có BOM sẽ hiển thị sai dấu tiếng Việt.
- **Chatbot dùng OpenAI, không dùng Anthropic** (`chat_service.py` + SDK `openai`, `settings.chat_model` mặc định `gpt-4o-mini`) — LAHR có sẵn ngân sách/API key OpenAI. Dùng Chat Completions streaming với `parallel_tool_calls=False` vì vòng lặp tool-use giả định đúng 1 tool call mỗi lượt.
- **Tool `search_jobs` nhận free-text cho `province`/`category` (không phải slug)**, so khớp qua `unaccent_ilike` trên tên Tỉnh/KCN/Ngành nghề — model chỉ cần hiểu ngôn ngữ tự nhiên, không cần biết trước slug nội bộ. Riêng `employment_type`/`salary_period` dùng `"enum"` cứng trong JSON schema tool (`official`/`seasonal`, `weekly`/`monthly`) thay vì fuzzy-match — chỉ 2 giá trị cố định, ép model không tự bịa; `_search_jobs_sync` vẫn tự `try/except ValueError` trước khi so sánh (không tin tuyệt đối model luôn trả đúng enum qua nhiều lượt hội thoại).
- **`POST /api/leads` tách hẳn khỏi `POST /api/applications`**, dù cùng ghi vào bảng `applications` (`job_id=NULL`, `source=CHATBOT` hardcode server-side) — không nới `job_slug` thành optional trên endpoint cũ vì đó là endpoint PII nhạy cảm nhất hệ thống, và logic chống trùng/`notify_new_application` giả định `job` luôn tồn tại. Hai endpoint dùng chung `core/antispam.py` nên giới hạn 10 đơn/ngày/SĐT cộng dồn đúng giữa 2 nguồn.
- **Quiz 4 câu hỏi của chatbot là state máy THUẦN FRONTEND** (`components/chatbot/ChatQuiz.tsx`), không để LLM dẫn dắt qua system prompt — LLM qua nhiều lượt không giữ đúng thứ tự và không hỗ trợ "quay lại" đáng tin cậy. Sau câu 3 (KCN), quiz gọi **thẳng `GET /api/jobs`** (không qua LLM) để hiện việc làm phù hợp cùng lúc với câu 4: nhanh hơn, không tốn token, và chắc chắn không bịa. Câu 4 "gọi trực tiếp" vẫn giữ nút quay lại (không phải ngõ cụt); "để lại SĐT" mount `LeadForm.tsx` (cùng pattern honeypot/timing/consent với `ApplyForm.tsx`).
- **`_search_jobs_sync` nhận `Session` làm tham số thay vì tự mở `SessionLocal()`** — để unit-test trực tiếp bằng `db_session` fixture; hàm tự mở session riêng (`_search_jobs_with_own_session`) chỉ dùng ở luồng thật, chạy qua `run_in_threadpool` (D1: chat là async def duy nhất, không đụng DB đồng bộ trực tiếp trong coroutine).
- **Trần chi tiêu ngày đếm token trong bộ nhớ tiến trình, không bảng DB riêng** — chấp nhận được vì kiến trúc chỉ 1 worker/VPS 4GB (tech-stack.md); soft-cap gần đúng đủ dùng cho MVP.
- **SSE tự parse bằng `fetch` + `ReadableStream` (không `EventSource`, chỉ hỗ trợ GET còn chat cần POST kèm JSON), response set thêm header `X-Accel-Buffering: no`** — thiếu header này Nginx sẽ buffer response proxy (D5), người dùng không thấy chữ chạy dần theo stream ở production.
- **`backend/Dockerfile` tự chạy `alembic upgrade head` trước `uvicorn` mỗi lần start container** — chấp nhận được vì chỉ 1 instance duy nhất (không có nhiều container chạy migration song song); `frontend/Dockerfile` dùng user `node` có sẵn trong base image thay vì tự tạo user mới (base `node:*-slim` đã có UID 1000, tạo trùng sẽ lỗi `useradd`).
- **Backup mã hoá bằng `openssl enc -aes-256-cbc -pbkdf2`, không dùng `age`/gpg** — đã có sẵn trên mọi VPS Linux, không cần cài thêm gói, đủ an toàn cho nhu cầu MVP. Backup gồm **cả volume `uploads`**, không chỉ `pg_dump`: DB chỉ lưu đường dẫn tới file CV, mất volume là mất hẳn dữ liệu cá nhân của ứng viên.

### Triển khai
- **`DOMAIN` tham số hoá qua cơ chế template của image nginx** (`nginx/*.conf.template` → envsubst → `conf.d/`), chọn file qua biến `NGINX_CONF` — domain còn đổi ít nhất 1 lần (demo `rg-nqhuy.io.vn` → tên miền khách hàng), hardcode thì mỗi lần đổi phải sửa file cấu hình.
- **Hai template nginx: `bootstrap.conf.template` (chỉ `:80`) và `lahr.conf.template` (đầy đủ SSL)** — cấu hình SSL tham chiếu file cert chưa tồn tại sẽ làm nginx crash-loop, mà certbot lại cần nginx phục vụ `/.well-known/` mới cấp được cert. Bootstrap phá thế bí đó, và cũng là cách chạy thử toàn stack qua HTTP trên máy dev.
- **`proxy_pass` dùng BIẾN (`set $upstream_be ...`) + `resolver 127.0.0.11`**, không dùng hằng số — với hằng số nginx resolve tên container đúng 1 lần lúc nạp config, nên mỗi lần `docker compose up -d` tạo container mới (IP khác) là **502 vĩnh viễn cho tới khi reload**, tức mọi lần deploy đều làm sập site.
- **Nginx tự reload mỗi 6h** (vòng lặp trong `command:`) — certbot gia hạn cert trong volume dùng chung nhưng nginx đã nạp cert cũ vào bộ nhớ; không reload thì sau ~90 ngày site phục vụ cert hết hạn, lỗi câm. Chọn cách này thay vì mount docker socket vào container certbot (đỡ mở rộng bề mặt tấn công).
- **`frontend`/`n8n` KHÔNG nạp `env_file: .env.prod`**, chỉ `postgres`/`backend` nạp — frontend chỉ cần `INTERNAL_API_URL` + `SITE_URL`; nạp cả file sẽ đẩy mật khẩu DB và `OPENAI_API_KEY` vào tiến trình không bao giờ dùng tới chúng.
- **`SITE_URL` là biến runtime, KHÔNG dùng `NEXT_PUBLIC_*`** — cả 4 chỗ dùng (`app/layout.tsx`, `app/robots.ts`, `app/sitemap.ts`, `components/layout/OrganizationJsonLd.tsx`) đều là Server Component. Next đóng băng mọi `NEXT_PUBLIC_*` vào bundle lúc build, nên nếu giữ tiền tố đó thì mỗi lần đổi domain phải build + push lại image. Vẫn truyền `SITE_URL` làm build-arg để HTML prerender mang sẵn domain đúng; đổi lúc chạy thì các trang ISR tự cập nhật sau ≤5 phút (`sitemap.xml` ≤1h).
- **CI tự build & push image lên GHCR** (job `images`, chỉ chạy khi push `main` và 2 job test đã xanh) — build trên VPS 4GB chắc chắn OOM (`npm run build` của Next ăn 2–3GB), còn build tay trên máy dev cũng rủi ro vì máy này cũng chỉ ~4GB.

### Frontend
- **API công khai trả dữ liệu có cấu trúc (`salary_min: 9000000`), không trả chuỗi đã format** — cùng dữ liệu phải render khác nhau ở card / trang chi tiết / JSON-LD / chatbot; format ở tầng view-model.
- **`frontend/proxy.ts` chỉ làm "optimistic check"** (kiểm cookie `access_token` tồn tại, **không** decode/verify JWT) — đúng khuyến nghị chính thức của Next.js. Lớp bắt buộc thật là `require_roles(...)` ở FastAPI; `(internal)/layout.tsx` gọi thêm `GET /api/auth/me` làm lớp 2 (bắt cookie đã hết hạn/bị revoke mà Proxy không biết).
- **`/dang-nhap` đặt NGOÀI route group `(internal)`** — lồng vào thì layout tự bắt chính trang đăng nhập phải đăng nhập trước → vòng lặp redirect vô hạn.
- **`LoginForm` và form đăng tin/đăng bài là Client Component gọi `browserFetch`, không dùng Server Action** — endpoint nhận `application/json` (Pydantic), trong khi form HTML thuần luôn gửi `x-www-form-urlencoded`. `ApplyForm` cũng vậy (cần `FormData` cho multipart).
- **`serverFetchAuthed` phải ở file riêng `lib/api/server-auth-client.ts`** — gộp vào `lib/api/client.ts` sẽ kéo `next/headers` vào bundle của Client Component nào lỡ import `browserFetch` từ cùng file → Turbopack build vỡ.
- **Ẩn topbar (điện thoại/email) dưới breakpoint `sm`** — khác prototype tĩnh; ưu tiên quy tắc "không horizontal scroll ở mọi breakpoint" vì nhồi đủ SĐT + email + 2 link vào 390px sẽ tràn.
- **Favicon thật sinh từ `public/logo-icon.png` qua `app/icon.png`/`app/apple-icon.png`/`app/favicon.ico`** (dùng `sharp` sẵn có trong `node_modules`, không thêm dependency) — scaffold ban đầu để nguyên icon mặc định của Next.js (tam giác Vercel), phát hiện qua test thật (tiêu đề tab trình duyệt). `favicon.ico` là container ICO tối thiểu bọc PNG 48×48 (đủ cho mọi trình duyệt hiện đại, không cần thư viện convert riêng).
- **TopBar "Đăng nhập"/"Dành cho doanh nghiệp" từng là `href="#"` (link chết, sót lại từ prototype tĩnh)** — phát hiện qua test thật. Đã trỏ `/dang-nhap` và `#lien-he` (khớp hành vi các CTA doanh nghiệp khác trên site — cuộn tới khối liên hệ ở footer, chưa có trang `/lien-he` riêng theo `out-of-scope.md`).
- **Header công khai (`MainNav.tsx`) bỏ hẳn nút "Nộp CV" và "Đăng tuyển dụng"/"Đăng tuyển"** — quyết định nghiệp vụ: đăng tin chỉ thực hiện qua khu vực nội bộ sau đăng nhập (không phải self-service), còn nộp hồ sơ đã có nút "Ứng tuyển ngay" riêng ở từng tin — hai nút header là dư thừa/gây hiểu nhầm.
- **Mọi phần tử `data-reveal` bắt buộc kèm `suppressHydrationWarning`** — xem bẫy hydration mismatch bên dưới; đây là quy ước bắt buộc khi thêm section/component mới dùng `data-reveal` (xem `design-system.md` §animation).
- **View-model tự dịch enum sang nhãn tiếng Việt** (`EMPLOYMENT_TYPE_LABELS`/`SALARY_PERIOD_LABELS` trong `lib/view-models/job.ts`) — API trả `"official"`/`"seasonal"` (tiếng Anh, khớp DB enum), component không tự map lại rải rác nhiều nơi; `JobForm.tsx` (admin) dùng `<select>` thay input text tự do từ khi enum hoá (D-mới, xem §Data model), không còn free-text không kiểm soát.

### SEO
- **Job `closed`/`archived` hiện banner "hết hạn" + `noindex`, KHÔNG BAO GIỜ 404** — 404 xoá backlink đã tích luỹ; Google for Jobs tự loại tin theo `validThrough`.
- **`sitemap.ts`/`robots.ts` không được phép throw dù backend sập** — chỉ đọc `res.ok` rồi dừng vòng lặp, cộng try/catch bọc ngoài; sitemap tự rút gọn về route tĩnh thay vì crash 500 (tín hiệu rất xấu với Google).
- **JSON-LD `JobPosting` tự sinh `description` fallback khi DB rỗng, `validThrough` fallback = `datePosted` + 30 ngày khi thiếu `deadline`** — Google coi `description` rỗng là lỗi bắt buộc; mapper phải tự đảm bảo output hợp lệ bất kể nội dung Admin nhập thiếu.
- **`hiringOrganization` dùng `Job.company` (nhà máy đối tác), không dùng LAHR** — nhất quán với card/trang chi tiết; LAHR chỉ xuất hiện ở JSON-LD `Organization` riêng.
- **Ảnh OG sinh bằng `next/og` với chữ KHÔNG DẤU** — satori không kèm font hỗ trợ dấu tiếng Việt, chữ có dấu sẽ vỡ glyph (tofu) khi share.
- **Canonical của `/viec-lam` và `/tin-tuc` luôn trỏ URL gốc không lọc** — tránh Google index hàng loạt biến thể theo tổ hợp filter như thin content.
- **`SearchBar` lọc 6 chiều** (từ khoá/ngành/khu vực/lương/loại hình/kỳ lương) — mở rộng từ 4 chiều ban đầu sau khi `employment_type`/`salary_period` enum hoá + có dữ liệu seed thật (xem §Data model); URL param `hinh_thuc`/`ky_luong` map sang `employment_type`/`salary_period` của `GET /api/jobs`. Form cho phép wrap (`md:flex-wrap`) thay vì ép 1 hàng ngang để không tràn ngang khi thêm field.
- **Field "khu vực" dùng danh sách KCN thật từ `/api/industrial-parks`, không dùng danh sách tỉnh tĩnh** — hiện chỉ seed 1 tỉnh (Hải Dương) nên lọc theo tỉnh vô nghĩa; KCN mới là chiều địa lý có ý nghĩa ở quy mô này.

---

## Bẫy đã gặp — đừng dẫm lại

- **`TestClient` phải dùng `base_url="https://testserver"`** — cookie có flag `Secure` bị cookie jar của `httpx` âm thầm bỏ qua nếu base URL là `http`, gây 401 khó hiểu ở test nhiều bước (login → refresh → me).
- **Test cookie `Secure` qua trình duyệt: dùng `http://localhost`, KHÔNG dùng `127.0.0.1`** — trình duyệt chỉ đặc cách `localhost` là secure context.
- **Next.js Data Cache persist qua đĩa ở `.next/cache`**, sống sót qua cả restart dev server — muốn test thật "tắt backend vẫn render" phải xoá cache trước, không thì thấy dữ liệu cũ và tưởng API đang chạy.
- **`sitemap.xml`/`robots.txt` là route static/ISR** — snapshot lúc build sống sót qua cả việc xoá `.next/cache`. Muốn test "tắt backend" phải xoá **toàn bộ `.next/`** rồi build lại trong lúc backend đang tắt hẳn.
- **`next start` tắt hẳn `rewrites()`** (đúng thiết kế D5 — prod dùng Nginx) → gọi `/api/...` từ trình duyệt sẽ 404 nếu test bằng production build không có Nginx. **Test luồng UI thật phải dùng `npm run dev`.**
- **Next.js 16 đổi tên `middleware.ts` → `proxy.ts`** (hành vi giữ nguyên, export `proxy`). Cần thêm logic chặn route thì sửa `frontend/proxy.ts` sẵn có, đừng tạo `middleware.ts` mới. Nói chung: `frontend/AGENTS.md` bắt buộc đọc `node_modules/next/dist/docs/` trước khi code Next — API đã đổi so với trí nhớ.
- **Pydantic v2 nhét object exception gốc vào field `ctx`** khi `@field_validator` raise `ValueError` — trả thẳng `exc.errors()` cho `JSONResponse` sẽ vỡ thành 500 thay vì 422. `app/core/errors.py` đã loại `ctx` trước khi trả; đừng bypass handler này.
- **Alembic không tự sinh `DROP TYPE` cho Postgres ENUM khi downgrade** — migration nào tạo enum mới phải tự thêm vào cuối `downgrade()`. Index/hàm tạo tay ngoài `Base.metadata` phải loại khỏi autogenerate qua `include_object` trong `alembic/env.py`.
- **Bẫy quên re-export model**: thêm model mới phải khai báo tường minh trong `app/models/__init__.py`, không thì `--autogenerate` sinh `drop_table`. Hàng rào thật là `alembic check` trong CI.
- **npm trên Windows cài thiếu optional dependency** ([npm/cli#4828](https://github.com/npm/cli/issues/4828)) — vitest báo `Cannot find native binding` thì cài tay `@rolldown/binding-win32-x64-msvc` đúng version, không phải lỗi code.
- **Chụp/điều khiển trình duyệt**: máy không có Playwright/`chromium-cli`; dùng Edge headless qua CDP thô (script Node với `WebSocket`/`fetch` built-in). Gắn file vào `<input type=file>` phải dùng `DOM.setFileInputFiles` (JS không set được `.value` của file input); chụp trang đã đăng nhập thì tiêm cookie qua `Network.setCookie`.
- **Ảnh chụp headless hay báo "cắt lề phải" giả** — P4 xác nhận hiện tượng này lặp lại y hệt ở các section không hề đổi code, là artifact của công cụ chứ không phải lỗi CSS. Đừng vội sửa layout khi chỉ thấy qua screenshot headless.
- **`docker compose` KHÔNG đọc `.env.prod` cho phép thay thế `${...}`** — `env_file:` chỉ nạp biến *vào trong* container. Thiếu `--env-file .env.prod` thì `${BACKEND_IMAGE}` rỗng (compose lỗi ngay) và `${POSTGRES_USER}` rỗng ở khối `environment:` **đè lên** giá trị đúng từ `env_file:` → Postgres init sai user, backend không kết nối được. Luôn dùng `./scripts/dc.sh`.
- **`backend/requirements.txt` là đường code duy nhất KHÔNG được CI che** — dev và CI đều chạy `uv sync`, chỉ `backend/Dockerfile` mới dùng `pip install -r`. Đã dính: `uv export` thiếu `--quiet` ghi dòng `Resolved N packages in Xms` vào đầu file, pip đọc thành requirement và `docker build` fail. Nay có bước kiểm parse riêng trong CI job `backend`.
- **`envsubst` của image nginx nuốt sạch biến của nginx nếu không lọc** — không đặt `NGINX_ENVSUBST_FILTER: "^DOMAIN$$"` thì `$host`, `$scheme`, `$proxy_add_x_forwarded_for`, `$upstream_be` đều thành chuỗi rỗng: `proxy_pass ;`, `return 301 https://;`. Đã xác nhận bằng phản chứng chạy `envsubst` thật. Hai dấu `$$` trong compose là cố ý (compose escape thành một `$`).
- **Bug thật xác nhận qua Console lỗi trình duyệt thật (khác artifact chụp headless ở trên)**: `ScrollReveal` gây hydration mismatch warning trên mọi trang public. Nguyên nhân gốc: `(public)/loading.tsx` khiến Next tự bọc `{children}` trong Suspense boundary riêng, tách khỏi `ScrollReveal` ở layout — `useEffect` của `ScrollReveal` có thể chạy và mutate `classList` (`is-visible`) trên các node `[data-reveal]` **trước khi** React hydrate xong boundary chứa chúng. Thử trì hoãn bằng `setTimeout(0)` chỉ giảm xác suất chứ không hết hẳn (đã xác nhận bằng test lặp lại). Fix đúng: thêm `suppressHydrationWarning` vào **mọi** phần tử `data-reveal` (cờ chính thức của React cho thuộc tính biết trước sẽ đổi sau mount) — không sửa được từ một chỗ tập trung vì `data-reveal` được viết tay rải rác ở 16 file component/page.
- **Turbopack dev server (`npm run dev`) crash "memory allocation ... failed" (panic Rust) trên máy dev này** — tổng RAM chỉ ~4GB, dễ hết bộ nhớ khả dụng khi chạy đồng thời Docker Desktop + backend + nhiều tiến trình Edge headless test song song. Không phải lỗi code; nếu gặp, kill hết `msedge.exe`/node thừa (`tasklist`/`taskkill //F //IM ... //T`) trước khi `npm run dev` lại. Tránh chạy nhiều phiên headless browser cùng lúc với dev server trên máy này.
- **`address_mappings.old_code` không tự đứng một mình được** — `applications.province_code` có FK tới `provinces.code`, nên mọi mã tỉnh cũ muốn roll-up qua D13 phải có một dòng `Province(is_active=False)` tương ứng, nếu không insert Application với mã cũ sẽ vỡ `IntegrityError` (P7 phát hiện qua test, đã sửa `seed_dev.py`).
- **Chỉnh sửa file backend trong lúc pytest nền đang chạy có thể gây fail giả** — test nào gọi `importlib.reload(app.main)` (VD `test_docs_disabled_in_prod`) đọc lại file `main.py` mới nhất từ đĩa nhưng vẫn dùng `sys.modules` cũ cho các submodule đã import trước đó → lệch trạng thái, `ImportError` không tái lập được ở lần chạy sạch. Đừng sửa code khi một lần chạy pytest đầy đủ đang chờ kết quả.
- **`router.push(x); router.refresh();` gọi liên tiếp không điều hướng được** — phát hiện khi test thật luồng đăng nhập (nút "Đăng nhập" nhận đúng cookie, gọi API đúng, nhưng không rời khỏi `/dang-nhap`). Tái hiện y hệt ở `JobForm`/`PostForm` (tạo/sửa xong không quay lại danh sách) và logout — cứ `push` ngay sau một thao tác vừa đổi state phía server (login/logout/tạo/sửa) là dính. Đã thay toàn bộ bằng `window.location.href = path` (full page load, luôn đọc cookie/dữ liệu mới nhất). **`router.refresh()` gọi ĐƠN LẺ (không kèm push, ở lại cùng trang)** vẫn hoạt động bình thường (`JobRowActions`/`PostRowActions`/`ApplicationRowActions`) — chỉ tổ hợp `push+refresh` mới vỡ.
- **Bug thật phát hiện qua test restore (P9)**: `pg_dump` luôn set `search_path` rỗng đầu bản dump để buộc mọi tham chiếu phải schema-qualify — hàm `immutable_unaccent` gọi `unaccent('unaccent', $1)` không schema-qualify (cả tên hàm lẫn tên dictionary) chạy bình thường được (search_path mặc định có `public`) nhưng **vỡ đúng lúc restore** (`CREATE INDEX` inline lại function body, search_path rỗng không resolve được). Fix: `public.unaccent('public.unaccent', $1)`, cả hàm lẫn literal dictionary đều phải qualify. Bài học: **test restore thật vào DB trống** là cách duy nhất bắt được lớp bug này — `alembic check`/pytest không chạm tới.
- **Test filter `date_from`/`date_to` dùng `date.today()` (giờ local) bị fail giả vào khung 00:00–06:59 giờ VN** — máy dev chạy UTC+7 (`SE Asia Standard Time`), trong khi backend (`admin/applications.py`, `admin/stats.py`) lọc theo **UTC**. `date.today()` trả về ngày local đã sang hôm sau trong khi `created_at` (UTC) vẫn còn ở hôm trước → record rơi ngoài khoảng lọc, test báo `total=0`. Fix: `test_admin_applications.py::test_date_range_filter` + `test_admin_stats.py::test_overview_respects_date_range` đổi sang `datetime.now(UTC).date()`. Nếu thấy 2 test này fail bất thường mà không đụng gì tới code liên quan, kiểm giờ hệ thống trước khi nghi ngờ logic.
