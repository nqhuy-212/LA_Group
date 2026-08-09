# Kế hoạch triển khai — LA Group Job Portal

> **Trạng thái**: P0–P9 xong về mã nguồn — không còn phase code nào. Đang ở giai đoạn **triển khai production**, xem §Triển khai production bên dưới.
> **Repo đã sẵn sàng deploy** — 22 vấn đề của artifact P9 đã sửa xong (GĐ A + B). Việc tiếp theo là commit + push để CI đẩy image lên GHCR.
> Việc phải làm trên VPS: [`VPS.md`](../VPS.md) — viết cho một phiên Claude chạy trực tiếp trên VPS qua Remote SSH.
> File này là **nguồn sự thật duy nhất cho việc phải làm tiếp**. Trạng thái hiện tại + bẫy kỹ thuật đã gặp nằm ở [CLAUDE.md](../CLAUDE.md); quy tắc thường trực nằm ở `.claude/rules/*`.

## Cách dùng

Mỗi phiên chỉ nhận **một** vai trò:

- **Phiên plan** — cập nhật chính file này, không sửa code.
- **Phiên thực thi** — chọn đúng **một phiên** trong bảng "Lộ trình" bên dưới, làm trọn vẹn, chạy DoD, đổi `- [ ]` → `- [x]` trong cùng commit với code.

Đọc **D1–D15** trước khi code — đã khoá, không tự ý đổi. Cần đổi thì dừng lại và báo, đừng làm khác plan rồi mới nói.

**Vì sao chia phiên theo phase chứ không theo lớp (frontend/backend/database)**: đồ thị phụ thuộc bắt buộc xen kẽ (frontend chờ API ở P3; backend chờ trang chính sách ở P4 trước khi mở P6). Chia theo lớp vẫn ra đúng thứ tự đó nhưng mất DoD và phình ngữ cảnh. P5/P6/P7 lại là lát cắt dọc — làm xong backend mà chưa có UI thì không verify được. Độ sạch của code đến từ cấu trúc thư mục + [code-conventions.md](../.claude/rules/code-conventions.md) + CI, không đến từ ranh giới phiên.

---

## Quyết định đã khoá (D1–D15)

| Mã | Quyết định |
|---|---|
| D1 | **SQLAlchemy sync**; chỉ endpoint chatbot dùng `async def`, không đụng DB trong coroutine đó |
| D2 | **Bỏ passlib**, dùng `bcrypt` trực tiếp; chặn `max_length=72` ở Pydantic (bcrypt cắt ở 72 byte) |
| D3 | **python-jose → PyJWT 2.x** |
| D4 | **JWT trong httpOnly cookie**, không dùng `OAuth2PasswordBearer` cho luồng thật |
| D5 | **Một origin qua Nginx** (`lahr.vn/` → Next, `lahr.vn/api/*` → FastAPI); dev dùng `rewrites()`. ⚠️ **Không được tạo `frontend/app/api/`** |
| D6 | Pin backend bằng `pyproject.toml` + `uv.lock` + `.python-version` |
| D7 | **Giữ `Company`** — nhà máy/đối tác nơi lao động làm việc, không phải bên tự đăng tin; có `display_name_public` cho đối tác ẩn danh |
| D8 | Ngành nghề là **bảng `job_categories`**, giữ slug `sx/kt/dv/kv` |
| D9 | CV chỉ nhận **PDF + JPG + PNG**, bỏ DOCX (lao động chụp ảnh hồ sơ; DOCX = zip, thêm bề mặt tấn công) |
| D10 | Anti-spam: **honeypot + timing + rate limit**; captcha (Turnstile) chỉ khi bị spam thật |
| D11 | Chatbot: **tool-use `search_jobs()` vào DB**, không dùng embeddings/pgvector ở MVP |
| D12 | UI primitive: **`@radix-ui/react-*` trực tiếp**, không dùng shadcn CLI (xung đột `@theme`) |
| D13 | Địa chỉ: lưu `province_code` hiện hành + `hometown_text` nguyên văn; **không ghi đè mã cũ**, roll-up qua `address_mappings` |
| D14 | Mock→API: **`openapi-typescript` codegen + lớp mapper**, component giữ nguyên view-model type |
| D15 | Admin **tách 2 giai đoạn**: P5 (đăng tin — go-live được) và P7 (Dashboard + ứng viên) |

---

## Lộ trình

```
P0 ─> P1 ─> P2 ─┬─> P3 ─> P4 ─┬─> P6 ─> P7 ─> P9
                └─> P5 ───────┘         P8 ─┘
```

| # | Phiên | Phase | Lớp | Ước lượng | Chặn bởi | Trạng thái |
|---|---|---|---|---|---|---|
| 1 | Nền móng & khoá quyết định | P0 | devops | 0.5–1 ngày | — | ✅ |
| 2 | Data model + migration 0001 + seed | P1 | database | 1–1.5 ngày | 1 | ✅ |
| 3 | Lõi bảo mật + Auth | P2 | backend | 1–1.5 ngày | 2 | ✅ |
| 4 | API đọc công khai | P3.1 | backend | 0.5–1 ngày | 2 | ✅ |
| 5 | FE bỏ mock data | P3.2–3.4 | frontend | 1–1.5 ngày | 4 | ✅ |
| 6 | Trang chi tiết + danh sách + SEO | P4 | frontend | 1.5–2 ngày | 5 | ✅ |
| 7 | Admin API: CRUD + RBAC | P5-be | backend | 1 ngày | 3, 4 | ✅ |
| 8 | Admin UI: `(internal)` + `proxy.ts` | P5-fe | frontend | 1 ngày | 7 | ✅ |
| 9 | Endpoint ứng tuyển (PII + upload) | P6-be | backend | 1 ngày | 3, 6 | ✅ |
| 10 | Form ứng tuyển mobile | P6-fe | frontend | 0.5–1 ngày | 9 | ✅ |
| 11 | Quản lý ứng viên + API stats | P7-be | backend | 1 ngày | 10 | ✅ |
| 12 | Dashboard tổng quan + biểu đồ | P7-fe | frontend | 1 ngày | 11 | ✅ |
| 13 | Chatbot RAG | P8 | backend | 2 ngày | 4 | ✅ (đổi sang OpenAI API, đã verify hành vi LLM thật bằng `OPENAI_API_KEY`) |
| 14 | Deploy VPS | P9 | devops | 1–2 ngày | tất cả | ✅ (artifact + verify local xong; DoD cần VPS/domain/SSH thật — xem Việc còn nợ) |

**Khi tách be/fe trong cùng phase**: phiên backend kết thúc bằng pytest xanh + gọi thử qua `/docs`; **DoD của phase chỉ tích khi phiên frontend xong** (DoD viết theo trải nghiệm người dùng cuối). Đừng tích sớm.

**Mốc go-live**: sau P5 đã mở được site công khai read-only; P6 đã mở nhận hồ sơ online. Còn thiếu P9 (domain + HTTPS thật).

---

## Đã hoàn thành — P0→P6

Chi tiết triển khai xem git log; các quyết định và bẫy rút ra đã chuyển sang [CLAUDE.md](../CLAUDE.md).

| Phase | Đã dựng |
|---|---|
| **P0** | Commit + push toàn bộ code; pin dependency bằng `uv`; sửa bug `.env` load theo CWD + validator chặn deploy prod với secret mặc định; khoá `naming_convention` + `mixins.py`; vá bẫy `import *` trong `alembic/env.py`; CI 2 job; Postgres bind `127.0.0.1`; sửa 11 mâu thuẫn rules + thêm `seo.md`, `testing.md` |
| **P1** | 11 model + `enums.py`; migration `7dcb960fdfb3` (patch tay: `immutable_unaccent` + expression index, `DROP TYPE` khi downgrade); `seed_dev.py` idempotent; `create_user.py`; `conftest.py` dùng Postgres thật + rollback mỗi test |
| **P2** | `core/{security,rate_limit,storage,errors,audit}.py`; `api/deps.py` (`get_current_user`, `require_roles`); `POST /api/auth/login\|refresh\|logout` + `GET /me`; security headers; `/docs` tắt ở prod. 28 test |
| **P3** | `schemas/{common,job,post}.py` + `api/v1/public/{jobs,posts,taxonomies,companies}.py`. FE: `lib/api/{schema.d.ts,client.ts}`, `lib/format.ts`, `lib/view-models/*`; xoá `mock-data.ts`; `rewrites()`; `(public)/{not-found,error,loading}.tsx`. 10 test BE + 25 test vitest |
| **P4** | `/viec-lam` + `[slug]`, `/tin-tuc` + `[slug]`, `/chinh-sach-bao-mat`; JSON-LD `JobPosting` + `Organization`; `sitemap.ts`, `robots.ts`, `opengraph-image.tsx`; `SearchBar` lọc thật 4 chiều; enrich seed. Sửa 2 bug hạ tầng: `ScrollReveal` không quét lại khi đổi route, link neo `#` vô hiệu ngoài trang chủ |
| **P5** | `api/v1/admin/{jobs,posts,companies}.py` + `core/slug.py`; audit log mọi thao tác ghi. FE: `(internal)/` + `InternalShell.tsx`, `/dang-nhap`, `dashboard/{viec-lam,tin-tuc}/{page,moi,[id]}`, `proxy.ts`, `lib/auth/current-user.ts`, `lib/api/server-auth-client.ts`. 33 test |
| **P6** | `api/v1/public/applications.py` + `core/{reference_code,notify}.py` + `schemas/application.py`; `api/v1/admin/applications.py` (mới có `GET /{id}/cv` + `POST /{id}/purge`). FE: `components/forms/ApplyForm.tsx` + `/viec-lam/[slug]/ung-tuyen`. 16 test (78/78 backend pass) |
| **P7** | `api/v1/admin/applications.py` mở rộng (list/filter/PATCH status+assign/export CSV) + `api/v1/admin/stats.py` (overview/by-province/by-age-group/by-industrial-park) + `api/v1/admin/users.py` (chỉ đọc); `schemas/admin.py`/`schemas/stats.py` bổ sung; seed `address_mappings`. FE: `dashboard/page.tsx` (số liệu thật), `dashboard/ung-vien/{page,ApplicationRowActions}.tsx`, `components/internal/charts.tsx` (bar chart SVG/CSS thuần). 19 test mới (97/97 backend pass) |
| **P8** | `app/services/chat_service.py` (system prompt + tool `search_jobs` + vòng lặp streaming SSE + trần token/ngày) + `api/v1/public/chat.py` (`POST /api/chat`, async def duy nhất — D1) + `schemas/chat.py`; tách `core/search.py` (`unaccent_ilike` dùng chung với `public/jobs.py`). FE: `components/chatbot/ChatWidget.tsx` gọi `/api/chat` qua SSE thật thay `setTimeout`. 13 test mới (110/110 backend pass) |
| **P9** | `backend/Dockerfile`, `frontend/Dockerfile` (multi-stage standalone), `docker-compose.prod.yml`, `scripts/{backup,restore}.sh`, `.env.prod.example`; migration `d1def644e25b` sửa bug `immutable_unaccent` (phát hiện qua test restore thật — xem CLAUDE.md § Bẫy đã gặp) |
| **GĐ A+B** | Vá 22 vấn đề của artifact P9: `nginx/{lahr,bootstrap}.conf.template` (thay `nginx/lahr.conf`) + `scripts/dc.sh`; `SITE_URL` runtime thay `NEXT_PUBLIC_SITE_URL`; `mem_limit`/log rotation/pin tag/`INTERNAL_API_URL` trong compose; backup thêm volume `uploads`; job CI `images` push GHCR |
| **Mở rộng (sau P9)** | Tiêu chí việc làm `employment_type`/`salary_period` enum hoá (migration `6875eab5dcc5`) + `Application.notes`; `chat_service.py` mở rộng tool `search_jobs`; `core/antispam.py` (trích từ `applications.py`) + `api/v1/public/leads.py` (`POST /api/leads`, lead chatbot); `public/jobs.py` filter công khai `employment_type`/`salary_period`; `JobListItem` schema thêm 2 field (hiện ở cả list lẫn detail). FE: `JobForm.tsx` dropdown; `SearchBar.tsx` 6 chiều lọc; `JobCard.tsx` badge loại hình/kỳ lương; `components/chatbot/{ChatQuiz,LeadForm}.tsx` (quiz 4 câu + nút quay lại kể cả sau "gọi trực tiếp", tự động hiện khi mở chat, sau câu 3 gọi thẳng `GET /api/jobs` hiện danh sách việc thật — không qua LLM). Sửa bug `seed_dev.py` ghi free-text cũ vào cột enum + 2 test flaky do lệch timezone local/UTC. 14 test mới (125/125 backend pass) |

---

## Primitive có sẵn — tái dùng, đừng viết lại

Không còn phase nào tiếp theo trong roadmap gốc — kiểm mục này trước khi thêm bất kỳ tính năng mới nào (Employee/Contract/Timesheet... xem § Entity giai đoạn sau).

**Backend**
- `app/api/deps.py` — `get_current_user`, `require_roles(...)` → dùng cho mọi endpoint admin mới
- `app/core/audit.py` — ghi `audit_logs`; `app/core/rate_limit.py` — `get_client_ip` (đã xử đúng `X-Forwarded-For`)
- `app/core/storage.py` — lưu/đọc file có sniff magic bytes; `app/core/slug.py` — `generate_unique_slug`
- `app/core/reference_code.py`, `app/core/notify.py` (webhook n8n, no-op nếu env rỗng)
- `app/core/errors.py` — envelope lỗi thống nhất (đừng tự trả `exc.errors()` thô)
- `app/core/search.py` — `unaccent_ilike(column, term)` dùng chung cho mọi tìm kiếm không dấu (public jobs API + chatbot tool)
- `app/core/antispam.py` — `is_bot()`, `count_recent_submissions_by_phone()` dùng chung cho mọi endpoint public ghi PII mới (đã dùng ở `applications.py` + `leads.py`), giới hạn spam cộng dồn đúng theo SĐT dù nguồn khác nhau
- `backend/tests/conftest.py` — fixture Postgres thật + rollback; pattern `monkeypatch.setattr("app.core.storage.settings.upload_dir", str(tmp_path))` khi test upload
- `api/v1/admin/stats.py` — pattern roll-up `address_mappings` (`outerjoin` + `func.coalesce`) và bucket tuổi bằng `case()`/`func.age()`; tái dùng khi cần thống kê GROUP BY khác
- `api/v1/admin/users.py` — `GET /api/admin/users` (chỉ đọc, 3 role) phục vụ mọi dropdown "chọn nhân viên nội bộ" sau này
- `app/services/chat_service.py` — pattern tool-use streaming với OpenAI SDK (`client.chat.completions.create(..., stream=True)` + `run_in_threadpool` cho phần đụng DB); `has_budget()`/`_record_usage()` cho trần chi tiêu ngày kiểu đếm token in-memory; tool JSON schema dùng `"enum": [...]` khi field chỉ có tập giá trị cố định (ép model không tự bịa) + validate defensive bằng `try/except ValueError` phía server

**Frontend**
- `lib/api/client.ts` — `serverFetch` / `browserFetch`; `lib/api/server-auth-client.ts` — `serverFetchAuthed` (**để riêng, đừng gộp lại**)
- `lib/auth/current-user.ts` — `getCurrentUser` bọc `react.cache()`
- `lib/format.ts`, `lib/view-models/*` — mapper DTO → VM; `npm run gen:api` sau mỗi lần đổi schema backend
- `components/internal/InternalShell.tsx` — Sidebar + Topbar đã responsive
- `components/internal/charts.tsx` — `HorizontalBarList`/`TimeSeriesBars`/`StatCard`, bar chart SVG/CSS thuần (không dùng recharts) cho mọi thống kê nội bộ sau này
- `components/ui/*` — Button, Badge, Container, SectionHeading, ScrollReveal, `icons.tsx`
- `components/chatbot/ChatQuiz.tsx` — pattern quiz nhiều bước có nút quay lại đặt hoàn toàn ở frontend (không để LLM tự dẫn dắt thứ tự), đẩy Q&A vào transcript qua callback rồi tái dùng `sendMessage()` gốc — tham khảo khi cần thêm luồng hỏi-đáp có thứ tự khác cho chatbot

---

## Việc còn nợ (chưa gắn vào phase nào)

| Việc | Ghi chú |
|---|---|
| `HeroSection` nghi tràn lề 390px | P4 xác nhận là artifact công cụ chụp headless (lặp lại y hệt ở section không đổi code). Nên đo lại bằng DevTools thật để đóng hẳn |
| Test trên điện thoại thật / mạng 4G | P6 đã verify tương đương qua viewport 375/390/414px + luồng thao tác thật qua CDP, nhưng chưa chạm thiết bị thật |
| `#chatbot-ai` còn là link neo | Chỉ hoạt động ở trang chủ. Chatbot là widget không có route riêng |
| Entity giai đoạn sau | `Employee`, `Document`, `Contract`, `TimesheetImport`/`AttendanceRecord`, `PayrollRule` — xem `.claude/rules/data-models.md` §Entity mở rộng |
| Lighthouse Performance | Đo local qua `next start` được 49/85 (SEO 100 đạt). Không qua Nginx/gzip thật nên chưa kết luận được — đo lại trên hạ tầng thật ở §Nghiệm thu của `VPS.md` |

---

## Triển khai production — kế hoạch 2 giai đoạn domain

Mã nguồn xong, artifact deploy xong, restore đã verify thật. Còn lại là hạ tầng.

**Chiến lược**: chạy demo trên domain riêng của dev (`rg-nqhuy.io.vn`) trước, chốt với khách rồi mới chuyển sang tên miền khách hàng (đã mua ở tino.vn, chưa dùng). Cả hai domain đều **chưa từng có website** → không có rủi ro cutover, không cần hạ TTL/pre-issue cert/`--resolve` như phương án cho `lahr.vn` trước đây.

| Bước | Việc | Ai làm | Tài liệu | Trạng thái |
|---|---|---|---|---|
| 0 | **GĐ A + B** — sửa 22 vấn đề của artifact P9, tham số hoá `DOMAIN`, thêm job CI push GHCR | Claude, phiên repo | [`DEPLOY.md`](DEPLOY.md) §Phần 2 | ✅ |
| 1 | Commit + push `main`, đợi CI xanh và image lên GHCR | người dùng | — | ⬅ tiếp theo |
| 2 | Thuê VPS Ubuntu, kết nối Remote SSH từ IDE | người dùng | — | ⬜ |
| 3 | `git clone https://github.com/nqhuy-212/LA_Group.git` | người dùng | — | ⬜ |
| 4 | Phiên Claude **mới trên VPS** tự động triển khai | Claude, phiên VPS | [`../VPS.md`](../VPS.md) §1–§9 | ⬜ |
| 5 | Site demo chạy thật ở `https://rg-nqhuy.io.vn` | — | `VPS.md` §9 Nghiệm thu | ⬜ |
| 6 | Sau khi demo xong → chuyển sang tên miền khách hàng | Claude, phiên VPS | `VPS.md` §10 | ⬜ |

**Chưa verify được ở bước 0** (Docker Desktop không chạy lúc làm): `pytest` + `alembic check` backend, `docker build` 2 image, và `docker compose up` thật. Backend Python code không bị GĐ A đụng tới, nhưng working tree có sẵn ~70 file P7/P8 chưa qua CI lần nào → **CI ở bước 1 là hàng rào thật, phải đợi xanh trước khi sang bước 2**.

**Quyết định mới phát sinh** (khác `DEPLOY.md` vốn viết cho `lahr.vn`):
- **Tham số hoá `DOMAIN`** qua cơ chế template của image nginx (`nginx/*.conf.template` + `NGINX_ENVSUBST_FILTER`), vì domain còn đổi ít nhất 1 lần nữa (demo → khách hàng).
- **`NEXT_PUBLIC_SITE_URL` → `SITE_URL` (biến runtime)** — cả 4 chỗ dùng đều là Server Component nên không cần tiền tố `NEXT_PUBLIC_`. Nhờ vậy đổi domain chỉ cần sửa `.env.prod` + restart thay vì build lại image.
- **`frontend` và `n8n` không nạp `.env.prod`** — chỉ `postgres`/`backend` cần secret. Nạp cả file sẽ đẩy mật khẩu DB + `OPENAI_API_KEY` vào những container không bao giờ dùng tới.
- **Bỏ toàn bộ GĐ E/F cutover** trong `DEPLOY.md` (hạ TTL, pre-issue cert DNS-01, `curl --resolve`) — chỉ cần khi domain đích đang có website chạy; `rg-nqhuy.io.vn` và domain khách đều trống.

---

## Testing

Triết lý và phạm vi đã chuyển thành rule thường trực: [`.claude/rules/testing.md`](../.claude/rules/testing.md). Tóm tắt: chỉ test thứ **(a) đắt khi sai** và **(b) khó phát hiện bằng mắt** — auth/RBAC, endpoint ứng tuyển, filter/phân trang job, `draft` không rò ra public; pure function ở frontend. Không RTL, không Playwright, không mock DB, không SQLite.
