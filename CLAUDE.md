# LA Group — Job Portal Website

Website chính thức của **LA Group** (pháp nhân: LAHR — Công ty Cổ phần Dịch vụ Cung ứng Nhân lực LA), kết nối doanh nghiệp/nhà máy đối tác với người lao động: tuyển dụng, chatbot AI tư vấn việc làm, và trang thông tin công ty. Đối tượng dùng chính là lao động phổ thông, chủ yếu truy cập bằng điện thoại di động.

## Ngôn ngữ giao tiếp

**Luôn giao tiếp và trả lời bằng Tiếng Việt** trong toàn bộ project này (chat, tóm tắt, giải thích, commit message, tài liệu nội bộ) — trừ khi người dùng chủ động chuyển sang ngôn ngữ khác trong phiên. Code (tên biến/hàm/bảng) và thuật ngữ kỹ thuật chuẩn (framework, thư viện, HTTP method...) vẫn giữ tiếng Anh như quy ước ngành.

## Bản đồ tài liệu

| Nơi | Chứa gì |
|---|---|
| [`docs/PLAN.md`](docs/PLAN.md) | **Việc phải làm tiếp** — roadmap P0→P9, 15 quyết định đã khoá (D1–D15), DoD từng phase, primitive có sẵn để tái dùng, việc còn nợ. **Đọc trước khi bắt đầu bất kỳ phase nào.** Mỗi phiên nhận đúng một phase (hoặc một nửa phase). |
| `.claude/rules/*.md` | Quy tắc thường trực, tự nạp vào mọi phiên |
| File này | Trạng thái hiện tại + điều hướng sang các file chuyên đề bên dưới |
| [`docs/DECISIONS.md`](docs/DECISIONS.md) · [`docs/PITFALLS.md`](docs/PITFALLS.md) | Quyết định kiến trúc phát sinh · bẫy kỹ thuật đã gặp — **không tự nạp, phải chủ động đọc** |
| [`VPS.md`](VPS.md) · [`VPS_tracking.md`](VPS_tracking.md) | Quy trình deploy VPS · trạng thái thật + việc còn nợ trên VPS đang chạy |
| `git log` | Lịch sử chi tiết từng phase — không chép lại vào tài liệu |

Rule theo chủ đề: [`overview`](.claude/rules/overview.md) · [`company-info`](.claude/rules/company-info.md) · [`tech-stack`](.claude/rules/tech-stack.md) · [`commands`](.claude/rules/commands.md) · [`design-system`](.claude/rules/design-system.md) · [`data-models`](.claude/rules/data-models.md) · [`security`](.claude/rules/security.md) · [`seo`](.claude/rules/seo.md) · [`testing`](.claude/rules/testing.md) · [`code-conventions`](.claude/rules/code-conventions.md) · [`out-of-scope`](.claude/rules/out-of-scope.md) · [`feature-recruitment`](.claude/rules/feature-recruitment.md) · [`feature-chatbot-ai`](.claude/rules/feature-chatbot-ai.md) · [`feature-company-content`](.claude/rules/feature-company-content.md) · [`feature-admin-dashboard`](.claude/rules/feature-admin-dashboard.md)

Có quyết định kiến trúc/nghiệp vụ mới → cập nhật đúng file rule theo chủ đề, không dồn ngược về file này.

### Cập nhật tài liệu sau mỗi phase — bắt buộc

Làm trong **cùng commit** với code của phase, đúng theo bảng phân vai trên:

1. **[`docs/PLAN.md`](docs/PLAN.md)** — tích `- [x]` DoD; đổi trạng thái phiên trong bảng *Lộ trình*; thêm **đúng 1 dòng** vào bảng *Đã hoàn thành* (liệt kê file/module đã dựng, không phải đoạn văn); bổ sung primitive mới vào § *Primitive có sẵn*; cập nhật § *Việc còn nợ*.
2. **File này** — chỉ cập nhật bảng *Trạng thái dự án*.
3. **[`docs/DECISIONS.md`](docs/DECISIONS.md) / [`docs/PITFALLS.md`](docs/PITFALLS.md)** — quyết định kiến trúc mới / bẫy mới gặp, **mỗi mục 1 dòng kèm lý do ngắn**.
4. **`.claude/rules/*`** — chỉ khi phase làm đổi quy tắc thường trực (schema, lệnh chạy, quy ước SEO/bảo mật/testing).

**Không được làm:**
- **Không kể lại diễn biến phase** (đã làm gì, verify thế nào, test nào pass) — `git log` giữ việc đó, tài liệu chỉ giữ thứ còn dùng về sau.
- **Không chép cùng một thông tin sang file thứ hai.** Mỗi sự việc tồn tại đúng một nơi: *việc phải làm tiếp* → `PLAN.md`; *trạng thái* → file này; *quyết định* → `docs/DECISIONS.md`; *bẫy* → `docs/PITFALLS.md`; *quy tắc thường trực* → `.claude/rules/`; *tình trạng VPS thật* → `VPS_tracking.md`.
- **Không giữ nội dung đã hết hiệu lực** (mục đã sửa xong, mâu thuẫn đã giải quyết, phụ lục đã dùng hết) — xoá hẳn, đừng đánh dấu "đã xong" rồi để lại.

**Tripwire**: nếu `CLAUDE.md` vượt ~150 dòng, `docs/PLAN.md` vượt ~250 dòng, hoặc bạn đọc được cùng một sự việc ở hai file — tài liệu đã phình, phải nén lại (hoặc tách sang file chuyên đề mới rồi trỏ từ bảng *Bản đồ tài liệu*) trước khi làm phase tiếp theo.

## Model Usage Policy

- 🔴 **OPUS 5** — thiết kế kiến trúc, chọn tech stack, security audit, performance bottleneck phức tạp, review tổng thể trước release.
- 🔵 **SONNET 5** — business logic, API endpoint có validation/error handling, auth flow, state management, schema và query join nhiều bảng.
- ⚪ **HAIKU 4.5** — boilerplate (router/controller/CRUD), CSS/Tailwind, unit test pure function, config/`.env`/Dockerfile cơ bản, seed data.

**Bắt buộc**: trước mỗi response, ghi một dòng `Recommended model: [OPUS/SONNET/HAIKU] — [lý do ngắn gọn]`.

---

## Trạng thái dự án (2026-08-09, đã lên VPS thật — Phase 1 xong)

**P0–P9 xong về mã nguồn; đã deploy thành công lên VPS thật tại `https://rg-nqhuy.io.vn`** (SSL Let's Encrypt hợp lệ, HSTS+gzip bật, admin đăng nhập được, dữ liệu seed thật hiển thị). Chi tiết tiến độ + việc còn nợ trên VPS: [`VPS_tracking.md`](VPS_tracking.md). Việc tiếp theo: Phase 2 — chuyển sang tên miền khách hàng (`VPS.md` §10).

**Deploy thật đã verify**: SSL/HTTPS, HSTS, gzip, `/api/docs` 404 ở prod, resiliency (`force-recreate backend` không gây 502 vĩnh viễn), `certbot renew --dry-run`, `docker stats` ~260MB (dưới xa mục tiêu 2GB), disk 28%. **Chưa verify**: nmap từ máy ngoài, SSL Labs rating, backup nightly + rclone offsite (khách chưa có tài khoản B2/Drive — xem `VPS_tracking.md` §việc còn nợ), Google Rich Results/Facebook Debugger (đợi sang domain khách hàng theo quy ước ở `seo.md`). Chatbot dùng OpenAI API và **đã verify hành vi LLM thật** (tool `search_jobs` trả đúng tin có trong DB kèm link, không bịa, từ chối lịch sự câu ngoài phạm vi).

| Vùng | Trạng thái |
|---|---|
| `feature-recruitment` | ✅ Danh sách + chi tiết + lọc qua URL (P4); form ứng tuyển thật + upload CV + anti-spam + chống trùng (P6); tiêu chí `employment_type` (chính thức/thời vụ) + `salary_period` (lương tuần/tháng) enum hoá, admin chọn qua dropdown, hiện ở card/chi tiết + lọc được ở `SearchBar` (6 chiều, thu gọn sau nút "Bộ lọc" trên mobile) và `GET /api/jobs` |
| `feature-company-content` | ✅ Tin tức/chính sách trang chủ + `/tin-tuc` + `/chinh-sach-bao-mat` (P4); CMS đăng bài qua Admin UI (P5) |
| `security` | ✅ Auth backend đầy đủ (P2); UI đăng nhập + `proxy.ts` + RBAC thật ở FastAPI (P5); endpoint public ghi PII đủ rate limit/sniff file/consent NĐ13 + purge (P6); `POST /api/leads` (lead chatbot) dùng chung cơ chế chống spam qua `core/antispam.py` |
| `seo` | ✅ JSON-LD `JobPosting`/`Organization`, sitemap/robots, OG (P4). ⏳ Rich Results Test + Facebook Debugger thật cần domain public thật |
| `data-models` | ✅ 11 model + migration 0001+`d1def644e25b`+`6875eab5dcc5` (P1/P9/mở rộng); API đọc (P3); Admin API ghi + audit log (P5); list/filter/assign/export ứng viên + stats (P7); `Job.employment_type`/`salary_period` enum, `Application.notes` |
| `feature-admin-dashboard` | ✅ `(internal)` + đăng nhập + RBAC 3 role + CRUD Job/Post/Company (P5); Dashboard tổng quan + Quản lý ứng viên (P7). ❌ Nhân sự, Nhập liệu, Hợp đồng, Chấm công/OCR — giai đoạn sau |
| `feature-chatbot-ai` | ✅ RAG qua tool `search_jobs` + SSE streaming thật (P8); đổi sang OpenAI API, đã verify hành vi LLM thật bằng `OPENAI_API_KEY`; quiz 4 câu hỏi có thứ tự + nút quay lại kể cả sau "gọi trực tiếp" (state máy ở frontend), sau câu 3 gọi thẳng `GET /api/jobs` hiện việc làm phù hợp thật (không qua LLM) → lead qua `POST /api/leads`; bóng chào chủ động sau 2.5s (không tự mở panel — xem `docs/DECISIONS.md` §Frontend) |
| `tech-stack` | ✅ Dockerfile BE/FE + `docker-compose.prod.yml` + `nginx/*.conf.template` + backup/restore; CI tự build & push image lên GHCR; `mem_limit`/log rotation/pin tag đầy đủ. ⏳ Deploy thật cần VPS/domain |

---

## Quyết định kiến trúc & bẫy kỹ thuật — đọc trước khi code

Hai khối này đã tách ra file riêng (CLAUDE.md tự nạp mọi phiên nên phải giữ ngắn); **chúng KHÔNG tự nạp, phải chủ động đọc**:

| File | Khi nào bắt buộc đọc |
|---|---|
| [`docs/DECISIONS.md`](docs/DECISIONS.md) | Trước khi viết code mới ở vùng liên quan (môi trường & build, data model, backend & bảo mật, triển khai, frontend, SEO). Đây là các quyết định đã cân nhắc kèm lý do — đi ngược lại mà không có lý do mới là lặp lại sai lầm đã trả giá. D1–D15 gốc vẫn ở [`docs/PLAN.md`](docs/PLAN.md). |
| [`docs/PITFALLS.md`](docs/PITFALLS.md) | Trước khi debug, hoặc trước khi sửa code ở vùng đang có lỗi. Toàn bộ là lỗi đã thực sự xảy ra, phần lớn **không phát hiện được bằng đọc code** — chỉ lộ ra khi chạy thật (deploy, restore DB, test trình duyệt thật). |
| [`VPS_tracking.md`](VPS_tracking.md) | Trước khi đụng tới VPS/hạ tầng production — trạng thái thật hiện tại + việc còn nợ. Quy trình từng bước ở [`VPS.md`](VPS.md). |

Có quyết định mới hoặc bẫy mới → thêm **1 dòng kèm lý do ngắn** vào đúng file trên, không dồn ngược về đây.
