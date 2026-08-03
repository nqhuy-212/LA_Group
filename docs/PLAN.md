# Kế hoạch triển khai — LA Group Job Portal

> **Trạng thái**: P0–P9 xong về mã nguồn. Chỉ còn thao tác tay trên VPS/domain thật (xem [CLAUDE.md](../CLAUDE.md) §Giới hạn môi trường + mục "Verify hạ tầng thật" bên dưới) — dự án không còn phase code nào.
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
| 13 | Chatbot RAG | P8 | backend | 2 ngày | 4 | ✅ (mã nguồn xong; DoD hành vi LLM cần `ANTHROPIC_API_KEY` thật để verify) |
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
| **P9** | `backend/Dockerfile`, `frontend/Dockerfile` (multi-stage standalone), `nginx/lahr.conf`, `docker-compose.prod.yml`, `scripts/{backup,restore}.sh`, `.env.prod.example`; migration `d1def644e25b` sửa bug `immutable_unaccent` (phát hiện qua test restore thật — xem CLAUDE.md § Bẫy đã gặp) |

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
- `backend/tests/conftest.py` — fixture Postgres thật + rollback; pattern `monkeypatch.setattr("app.core.storage.settings.upload_dir", str(tmp_path))` khi test upload
- `api/v1/admin/stats.py` — pattern roll-up `address_mappings` (`outerjoin` + `func.coalesce`) và bucket tuổi bằng `case()`/`func.age()`; tái dùng khi cần thống kê GROUP BY khác
- `api/v1/admin/users.py` — `GET /api/admin/users` (chỉ đọc, 3 role) phục vụ mọi dropdown "chọn nhân viên nội bộ" sau này
- `app/services/chat_service.py` — pattern tool-use streaming với Anthropic SDK (`client.messages.stream` + `run_in_threadpool` cho phần đụng DB); `has_budget()`/`_record_usage()` cho trần chi tiêu ngày kiểu đếm token in-memory

**Frontend**
- `lib/api/client.ts` — `serverFetch` / `browserFetch`; `lib/api/server-auth-client.ts` — `serverFetchAuthed` (**để riêng, đừng gộp lại**)
- `lib/auth/current-user.ts` — `getCurrentUser` bọc `react.cache()`
- `lib/format.ts`, `lib/view-models/*` — mapper DTO → VM; `npm run gen:api` sau mỗi lần đổi schema backend
- `components/internal/InternalShell.tsx` — Sidebar + Topbar đã responsive
- `components/internal/charts.tsx` — `HorizontalBarList`/`TimeSeriesBars`/`StatCard`, bar chart SVG/CSS thuần (không dùng recharts) cho mọi thống kê nội bộ sau này
- `components/ui/*` — Button, Badge, Container, SectionHeading, ScrollReveal, `icons.tsx`

---

## Việc còn nợ (chưa gắn vào phase nào)

| Việc | Ghi chú |
|---|---|
| `ScrollReveal` hydration mismatch warning | Class `is-visible` thêm bằng `classList` không khớp HTML server-render. Tái hiện ở `/` và `/tin-tuc`. Chỉ thấy khi capture headless — có thể không phải lỗi thật với người dùng cuộn thật. Cần một phiên riêng + DevTools thật để chốt |
| `HeroSection` nghi tràn lề 390px | P4 xác nhận là artifact công cụ chụp headless (lặp lại y hệt ở section không đổi code). Nên đo lại bằng DevTools thật để đóng hẳn |
| Test trên điện thoại thật / mạng 4G | P6 đã verify tương đương qua viewport 375/390/414px + luồng thao tác thật qua CDP, nhưng chưa chạm thiết bị thật |
| `#chatbot-ai` còn là link neo | Chỉ hoạt động ở trang chủ. Chatbot là widget không có route riêng |
| Entity giai đoạn sau | `Employee`, `Document`, `Contract`, `TimesheetImport`/`AttendanceRecord`, `PayrollRule` — xem `.claude/rules/data-models.md` §Entity mở rộng |
| **Verify hành vi LLM thật của chatbot (P8)** | Môi trường dev hiện chưa có `ANTHROPIC_API_KEY` thật nên chưa gọi được Claude API sống. Đã verify bằng test (mock Anthropic client): rate limit 10/10phút hoạt động đúng, không sập server, key không lộ ở client bundle. **Chưa verify được** (cần key thật + `uv run uvicorn` rồi hỏi qua UI): (1) câu hỏi có tin thật → trả đúng tin kèm link, (2) hỏi việc không tồn tại → không bịa, (3) hỏi ngoài phạm vi → từ chối lịch sự |
| **Verify hạ tầng thật trên VPS (P9)** | Môi trường hiện tại **không có VPS/domain/SSH thật** — chỉ verify được phần chạy cục bộ trên máy dev: `docker build` cả 2 image thành công; container backend chạy đúng ở `ENVIRONMENT=prod` (`/docs` trả 404 xác nhận thật, không chỉ suy luận); `docker stats` idle ~215MB tổng 3 container (dev machine, không phải RAM thật của VPS Tino); **restore thật đã chạy vào DB trống và đối chiếu số dòng khớp 100%** — quá trình này phát hiện + sửa 1 bug thật (xem CLAUDE.md § Bẫy đã gặp: `immutable_unaccent` vỡ khi restore vì pg_dump set search_path rỗng, migration `d1def644e25b` đã sửa). Lighthouse mobile chạy local qua `next start` (không phải domain thật, không qua Nginx/gzip thật): SEO trang chủ = 100 (đạt), Performance = 49 (**dưới mục tiêu 85** — TBT cao, cần đo lại trên hạ tầng thật trước khi kết luận, có thể cần tối ưu thêm). **Cần user tự làm khi có VPS thật**: thuê VPS + trỏ domain `lahr.vn`, `cp .env.prod.example` → `.env.prod` điền secret thật, `docker build`+push 2 image, chạy `docker-compose.prod.yml`, xin SSL qua certbot, cấu hình `ufw`/`fail2ban`/ SSH đổi port, cấu hình `rclone` cho backup, và chạy lại đúng 5 hạng mục không thể giả lập cục bộ: SSL Labs, `nmap` ngoài, cron backup thật, Google Rich Results Test, Facebook Sharing Debugger (xem `commands.md` §lệnh deploy) |

---

## Testing

Triết lý và phạm vi đã chuyển thành rule thường trực: [`.claude/rules/testing.md`](../.claude/rules/testing.md). Tóm tắt: chỉ test thứ **(a) đắt khi sai** và **(b) khó phát hiện bằng mắt** — auth/RBAC, endpoint ứng tuyển, filter/phân trang job, `draft` không rò ra public; pure function ở frontend. Không RTL, không Playwright, không mock DB, không SQLite.
