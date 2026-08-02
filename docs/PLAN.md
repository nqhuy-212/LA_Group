# Kế hoạch triển khai LA Group Job Portal (v2 — sau phản biện)

> **Trạng thái**: đã duyệt 2026-08-02. Chưa bắt đầu thực thi phase nào.
> **Nguồn sự thật duy nhất** cho roadmap. Khi có quyết định mới, cập nhật file này — đừng để lệch với `.claude/rules/*` và `CLAUDE.md`.

## Cách dùng file này

Mỗi phiên làm việc chỉ nhận **một** trong hai vai trò:

- **Phiên plan** — tạo/review/cập nhật chính file này. Không sửa code.
- **Phiên thực thi** — chọn đúng **một phase** (hoặc một nửa phase theo bảng "Chia phiên thực thi" bên dưới), làm trọn vẹn, chạy DoD, tích checkbox rồi commit.

Trước khi làm bất kỳ phase nào: đọc mục **Quyết định đã chốt (D1–D15)** — các quyết định đó đã khoá, không tự ý đổi. Nếu thấy cần đổi, dừng lại và báo, đừng làm khác plan rồi mới nói.

**Quy ước tích tiến độ**: đổi `- [ ]` → `- [x]` trong DoD ngay khi verify xong, kèm trong cùng commit với code của phase đó.

### Vì sao chia theo phase, không chia theo lớp (frontend/backend/database)

Chia phiên theo lớp nghe hợp lý nhưng **không chạy được với đồ thị phụ thuộc của dự án này**:

- P3.2 (frontend bỏ mock) chặn ở P3.1 (API) → frontend chờ backend
- P6 (endpoint ứng tuyển) chặn ở P4 (trang `/chinh-sach-bao-mat` phải live trước, theo NĐ13) → backend chờ frontend
- P7 (stats) chặn ở P6 có dữ liệu thật

Một "phiên backend" trọn vẹn sẽ là P2 + P3.1 + P5-be + P6-be + P7-be + P8 ≈ 8 ngày công, và vẫn buộc phải dừng giữa chừng chờ frontend. Kết cục vẫn là thứ tự phase, chỉ mất thêm DoD và ngữ cảnh phình to.

Ngoài ra P5/P6/P7 là **lát cắt dọc** (backend + frontend + middleware của cùng một tính năng). Làm xong `POST /api/applications` mà chưa có form thì không verify được — DoD P6 yêu cầu "nộp đơn thật trên điện thoại 4G ≤60 giây".

**Độ sạch của code không đến từ ranh giới phiên** mà từ: cấu trúc thư mục đã chốt trong plan này, [code-conventions.md](../.claude/rules/code-conventions.md), và CI ép tuân thủ (`ruff` / `eslint` / `typecheck` / `alembic check`). Ranh giới phiên chỉ quyết định lượng ngữ cảnh phải nạp và khả năng tự verify.

---

## Context

Dự án **chưa có file plan nào**. "Kế hoạch" trước đây chỉ là 4 gạch đầu dòng trong mục *Bước tiếp theo* của [CLAUDE.md](../CLAUDE.md) — không có Definition of Done, không có thứ tự phụ thuộc, không có tiêu chí nghiệm thu.

Sau khi đối chiếu kế hoạch đó với **code thực tế** và với `.claude/rules/*`, phát hiện 7 vấn đề đủ nghiêm trọng để phải xếp lại thứ tự trước khi viết dòng code tiếp theo:

1. **Toàn bộ code chưa commit.** `git log` chỉ có 1 commit (prototype tĩnh). `backend/`, `frontend/`, `docker-compose.yml` đều untracked; `CLAUDE.md` + 3 rule file đang modified. Mất máy = mất sạch, không rollback được.
2. **Có sẵn một blocker kỹ thuật chưa lộ.** `passlib 1.7.4` + `bcrypt 5.0.0` đã cài trong venv là **cặp hỏng** — passlib đọc `bcrypt.__about__.__version__`, thuộc tính bị xóa từ bcrypt 4.1. Chưa nổ vì chưa có dòng auth nào. Sẽ nổ đúng lúc làm đăng nhập. `python-jose` cũng gần như không maintain và có lịch sử CVE. `requirements.txt` không pin một version nào → deploy VPS chắc chắn lệch môi trường dev.
3. **Bẫy mất dữ liệu trong Alembic.** [alembic/env.py](../backend/alembic/env.py) dùng `from app.models import *`, trong khi [app/models/\_\_init\_\_.py](../backend/app/models/__init__.py) rỗng 0 byte. Khi đã có bảng thật, chỉ cần quên re-export một model là `--autogenerate` sinh `drop_table` cho nó.
4. **Kế hoạch cũ đặt form ứng tuyển (bước 3) trước bảo mật (bước 4).** Đó là endpoint **public, ghi PII, nhận upload file** — rủi ro cao nhất cả dự án — lại mở ra khi chưa có rate limit, chưa validate MIME, chưa có chỗ lưu ngoài web-root, chưa có consent NĐ13/2023. Mâu thuẫn trực tiếp với [security.md](../.claude/rules/security.md) ("bảo mật phải được thiết kế từ đầu, không thêm sau").
5. **Nghịch lý dữ liệu.** Admin để sau cùng ⇒ API Job xong nhưng không ai nhập được Job. Dev trở thành người nhập liệu, và không thể go-live.
6. **Mock data shape ≠ API shape.** [lib/mock-data.ts](../frontend/lib/mock-data.ts) toàn field đã format sẵn (`salaryLabel: "9 – 12 triệu"`, `deadlineLabel: "Hạn nộp: 15/08/2026"`, `location` free-text). Bước "đổi mock sang API" nếu làm ngây thơ sẽ phải viết lại cả 10 section component.
7. **SEO vắng mặt hoàn toàn** trong mọi rule file. Với mô hình cung ứng lao động sống bằng traffic Google/Facebook, thiếu JSON-LD `JobPosting` + sitemap là bỏ kênh khách hàng chính.

Ngoài ra có **11 điểm mâu thuẫn** giữa `.claude/rules/*` và thực tế code (Phụ lục A).

**Kết quả mong muốn:** một roadmap 10 phase có thứ tự phụ thuộc đúng, mỗi phase có DoD kiểm được, khóa xong mọi quyết định "đắt khi sửa sau" trước migration đầu tiên.

### Quyết định đã chốt (D1–D15)
| Mã | Quyết định |
|---|---|
| D1 | **SQLAlchemy sync** (psycopg2 đã cài); chỉ endpoint chatbot dùng `async def`, không đụng DB trong coroutine đó |
| D2 | **Bỏ passlib**, dùng `bcrypt` trực tiếp; chặn `max_length=72` ở Pydantic (bcrypt cắt ở 72 byte) |
| D3 | **python-jose → PyJWT 2.x** |
| D4 | **JWT trong httpOnly cookie**, không dùng `OAuth2PasswordBearer` cho luồng thật |
| D5 | **Một origin qua Nginx** (`lahr.vn/` → Next, `lahr.vn/api/*` → FastAPI); dev dùng `rewrites()`. ⚠️ Hệ quả: **không được tạo `frontend/app/api/`** |
| D6 | Pin backend bằng `pyproject.toml` + `uv.lock` + `.python-version` |
| D7 | **Giữ `Company`** — LAHR cung ứng cho nhiều nhà máy đối tác; thêm `display_name_public` cho đối tác ẩn danh |
| D8 | Ngành nghề là **bảng `job_categories`**, giữ slug `sx/kt/dv/kv` để FE không vỡ |
| D9 | CV chỉ nhận **PDF + JPG + PNG**, bỏ DOCX (lao động chụp ảnh hồ sơ bằng điện thoại; DOCX = zip, thêm bề mặt tấn công) |
| D10 | Anti-spam: **honeypot + timing + rate limit**; captcha (Turnstile) chỉ khi bị spam thật |
| D11 | Chatbot: **tool-use `search_jobs()` vào DB**, không dùng embeddings/pgvector ở MVP |
| D12 | UI primitive: **`@radix-ui/react-*` trực tiếp**, không dùng shadcn CLI (áp hệ token riêng, xung đột `@theme` hiện có) |
| D13 | Địa chỉ: lưu `province_code` hiện hành + `hometown_text` nguyên văn; **không ghi đè mã cũ**, roll-up qua `address_mappings` |
| D14 | Mock→API: **`openapi-typescript` codegen + lớp mapper**, component giữ nguyên view-model type |
| D15 | Admin **tách 2 giai đoạn**: P5 (đăng tin — go-live được) và P7 (Dashboard + ứng viên) |

---

## Thứ tự phụ thuộc

```
P0 Nền móng ──> P1 Data model + seed ──> P2 Lõi bảo mật + Auth ──┐
                        │                                        │
                        └──> P3 API đọc + bỏ mock ───────────────┤
                                     │                           │
                        P4 Chi tiết + SEO <──────────────────────┤
                                     │                           │
                        P5 Admin đăng tin <──────────────────────┘
                                     │
                        P6 Form ứng tuyển  (BẮT BUỘC có P2)
                                     │
                        P7 Ứng viên + Dashboard
                                     │
                        P8 Chatbot RAG ──> P9 Deploy VPS
```

**Mốc go-live sớm: sau P5** — site công khai read-only (xem tin, SEO chạy, hiển thị hotline thay vì form). P6 mới mở nhận hồ sơ online.

## Chia phiên thực thi

**13 phiên.** Phase là trục chính; lớp (backend/frontend) chỉ dùng để tách *bên trong* phase khi phase đủ lớn. Mỗi phiên phải kết thúc ở một trạng thái verify được.

| # | Phiên | Phase | Lớp | Ước lượng | Chặn bởi |
|---|---|---|---|---|---|
| 1 | Nền móng & khoá quyết định | P0 | setup/devops | 0.5–1 ngày | — |
| 2 | Data model + migration 0001 + seed | P1 | database | 1–1.5 ngày | 1 |
| 3 | Lõi bảo mật + Auth | P2 | backend | 1–1.5 ngày | 2 |
| 4 | API đọc công khai | P3.1 | backend | 0.5–1 ngày | 2 |
| 5 | FE bỏ mock data (codegen + mapper + format) | P3.2–3.4 | frontend | 1–1.5 ngày | 4 |
| 6 | Trang chi tiết + danh sách + SEO | P4 | frontend | 1.5–2 ngày | 5 |
| 7 | Admin API: CRUD Job/Post/Company + RBAC | P5-be | backend | 1 ngày | 3, 4 |
| 8 | Admin UI: layout `(internal)` + middleware | P5-fe | frontend | 1 ngày | 7 |
| 9 | Endpoint ứng tuyển (PII + upload) | P6-be | backend | 1 ngày | 3, 6 |
| 10 | Form ứng tuyển mobile | P6-fe | frontend | 0.5–1 ngày | 9 |
| 11 | Quản lý ứng viên + API stats | P7-be | backend | 1 ngày | 10 |
| 12 | Dashboard tổng quan + biểu đồ | P7-fe | frontend | 1 ngày | 11 |
| 13 | Chatbot RAG | P8 | backend | 2 ngày | 4 |
| 14 | Deploy VPS | P9 | devops | 1–2 ngày | tất cả |

**Ghi chú khi tách be/fe trong cùng phase**: phiên backend kết thúc bằng test pytest xanh + gọi thử qua `/docs`; **DoD đầy đủ của phase chỉ tích khi phiên frontend tương ứng xong** (vì DoD viết theo trải nghiệm người dùng cuối). Đừng tích sớm.

**Có thể chạy song song** (không chặn nhau): phiên 6 và 7; phiên 13 chỉ cần phiên 4 nên có thể chen vào bất cứ lúc nào sau đó.

---

## PHASE 0 — Nền móng & khóa quyết định (~0.5–1 ngày)

Chặn toàn bộ phase sau. Mọi thứ ở đây bị **migration 0001 khóa cứng**.

**0.1 Git** — commit `backend/`, `frontend/`, `docker-compose.yml` + 4 file modified. Bổ sung [.gitignore](../.gitignore) gốc: `uploads/`, `.pytest_cache/`, `.ruff_cache/`, `.coverage`, `htmlcov/`.

⚠️ **Sửa [frontend/.gitignore](../frontend/.gitignore) trước khi commit**: dòng 34 `.env*` sẽ **nuốt luôn `frontend/.env.example`** (file cần commit theo mục 0.4). `.gitignore` gốc có `!.env.example` nhưng `.gitignore` ở thư mục con **được ưu tiên hơn** → phải thêm `!.env.example` vào chính `frontend/.gitignore`.

*(Đã verify: repo hiện tracked đúng 34 file, `frontend/` hoàn toàn untracked → `tsconfig.tsbuildinfo` **chưa** lọt vào commit nào, và sẽ bị `*.tsbuildinfo` ở `frontend/.gitignore` chặn. Không cần `git rm --cached`.)*

**0.2 Pin backend** — tạo [backend/pyproject.toml](../backend/pyproject.toml) (`requires-python = ">=3.11,<3.12"`, deps pin `==`), `uv.lock`, `.python-version`. **Gỡ** `passlib[bcrypt]` + `python-jose[cryptography]`; **thêm** `bcrypt`, `PyJWT`, `slowapi`, `python-slugify`, `filetype`. Dev deps: `pytest`, `httpx`, `ruff`. Giữ `requirements.txt` như file export tự động cho Dockerfile (kèm header "không sửa tay").

**0.3 Pin frontend** — [package.json](../frontend/package.json): thêm `engines.node >= 20.9`, script `format`; tạo `.nvmrc` + `.prettierrc`.

**0.4 Sửa 2 bug trong [app/core/config.py](../backend/app/core/config.py)**
- `env_file=".env"` là **đường dẫn tương đối theo CWD** → chạy uvicorn từ thư mục khác là mất sạch config, im lặng rơi về default (kể cả `jwt_secret_key="change-me"`). Đổi sang `Path(__file__).resolve().parents[2] / ".env"`.
- Thêm `environment: Literal["dev","staging","prod"]` + `model_validator` **raise khi prod mà secret vẫn là `change-me`** hoặc `cors_origins` chứa localhost. Đây là hàng rào duy nhất chặn deploy nhầm.
- Thêm sẵn: `upload_dir`, `max_upload_bytes`, `n8n_webhook_url`, `public_site_url`.
- Tạo `frontend/.env.example` (`INTERNAL_API_URL`, `NEXT_PUBLIC_SITE_URL`).

**0.5 Khóa quy ước DB** *(bắt buộc trước migration 0001)*
- [app/db/base.py](../backend/app/db/base.py): thêm `MetaData(naming_convention={...})` với prefix `pk_/fk_/uq_/ix_/ck_`. Bỏ qua bước này thì Postgres tự đặt tên constraint, mọi migration sau muốn drop/rename phải tra tên thật trong DB.
- Tạo `app/db/mixins.py`: `IdMixin`, `TimestampMixin` (`DateTime(timezone=True)`, UTC, `server_default=func.now()`), `SoftDeleteMixin`.
- Quy ước URL công khai: **dùng `slug` unique, không dùng int ID** (bắt buộc cho SEO ở P4).

**0.6 Chống bẫy re-export** — [app/models/\_\_init\_\_.py](../backend/app/models/__init__.py) import tường minh + `__all__`; [alembic/env.py](../backend/alembic/env.py) đổi `from app.models import *` → `import app.models  # noqa: F401`, bật `compare_type=True` + `compare_server_default=True`. Hàng rào thật là `alembic check` trong CI.

**0.7 Lint / test / CI** — `[tool.ruff]` + `[tool.pytest.ini_options]` trong pyproject; `backend/tests/conftest.py` khung rỗng; `.github/workflows/ci.yml` 2 job — backend (postgres service → `ruff check` → `alembic upgrade head` → `alembic check` → `pytest`), frontend (`npm ci` → lint → typecheck → build). Không làm CD ở MVP.

**0.8 Docker dev** — [docker-compose.yml](../docker-compose.yml): `"5432:5432"` → `"127.0.0.1:5432:5432"` (đang expose ra LAN với creds `lagroup/lagroup`).

**0.9 Sửa rules** — theo Phụ lục A.

**DoD P0**
- [x] `git status` sạch, `git log` ≥ 2 commit
- [x] Clone mới → cài deps → `docker compose up -d` → `alembic upgrade head` → `uvicorn` → `GET /api/health` = 200, không thao tác tay nào ngoài copy `.env.example`
- [x] `python -c "import bcrypt, jwt"` chạy; `passlib`/`jose` **không còn** trong lockfile
- [x] `Settings(environment="prod", jwt_secret_key="change-me")` **raise ValidationError**
- [x] `ruff check .` sạch; `npm run lint && typecheck && build` sạch; **CI xanh** (push lên `origin/main`, [run #1](https://github.com/nqhuy-212/LA_Group/actions/runs/30741306603) `success`)

---

## PHASE 1 — Data model + migration 0001 + seed (~1–1.5 ngày)

**Nguyên tắc: thà thừa cột nullable còn hơn thiếu.** Cột nullable không dùng tốn ~0; thêm cột vào bảng đã có data production + backfill thì đắt và rủi ro.

Mỗi entity 1 file trong `backend/app/models/`.

| Bảng | Field then chốt |
|---|---|
| `provinces` | `code` PK, `name`, `type`, `is_active` |
| `address_mappings` | `old_code`, `old_name`, `new_code` FK, `level`, `effective_date` — **tạo bảng ngay** (đáp án cho sáp nhập đơn vị hành chính, D13) |
| `industrial_parks` | `slug`, `name`, `province_code` FK, `district_name` — **phải là FK, không free text**, vì Dashboard yêu cầu phân tích theo KCN |
| `job_categories` | `slug` unique (`sx/kt/dv/kv`+), `name`, `sort_order`, `is_active` |
| `companies` | `slug`, `name`, `display_name_public` nullable, `logo_initials`, `logo_url`, `is_partner` |
| `jobs` | `slug` unique+indexed, `title`, `company_id`, `category_id`, `industrial_park_id` nullable, `province_code`, `salary_min/max` (int VND), `salary_negotiable`, `quantity`, `age_min/max`, `shift_type`, `employment_type`, `description`, `requirements`, `benefits`, `deadline`, `status` enum(draft/published/closed/archived), `is_hot`, `published_at`, `view_count`, `meta_title`, `meta_description` |
| `applications` | `reference_code` unique, `job_id` nullable, `full_name`, `phone`, `email`, **`birth_date`** (KHÔNG lưu `age` — Dashboard tự tính bucket), `gender`, **`province_code` + `hometown_text`**, `cv_file_path/original_name/mime/size`, **`source` enum(web/chatbot/zalo/facebook/walk_in)**, `status` enum(new/contacted/interviewing/hired/rejected), `assigned_to_id`, **`consent_given/version/at/ip` + `user_agent`** (NĐ13), `purged_at` |
| `posts` | `slug`, `title`, `excerpt`, `content`, `cover_image_url`, **`type` enum(news/policy/guide/scam_alert/event)**, `status`, `published_at`, `meta_*` |
| `users` | `email` unique, `hashed_password`, `role` enum(admin/manager/staff), `is_active`, `failed_login_count`, `locked_until` |
| `refresh_tokens` | `user_id`, `token_hash`, `expires_at`, `revoked_at`, `user_agent`, `ip` |
| `audit_logs` | `user_id`, `action`, `entity_type`, `entity_id`, `ip`, `meta` JSONB |

`posts` **gộp 4 loại nội dung** (`NewsPost` + `EventItem` + `newPartnerFeed` + `scamAlertFeed` trong mock data) qua cột `type` — tránh 4 bảng gần giống nhau.

Hoãn sang migration sau, đúng [data-models.md](../.claude/rules/data-models.md) §Entity mở rộng: `Employee`, `Document`, `Contract`, `TimesheetImport`, `PayrollRule`.

**Bổ sung**
- Bật extension `unaccent` + expression index `unaccent(lower(title))` trên `jobs` — lao động gõ mobile không dấu ("cong nhan lap rap"). ~15 dòng, không phải over-engineer.
- `backend/scripts/seed_dev.py` — **idempotent** (upsert theo slug): tỉnh, 5 KCN Hải Dương, 4 danh mục, 6 công ty + 6 job + 3 post **khớp [lib/mock-data.ts](../frontend/lib/mock-data.ts)** để trang chủ nhìn y hệt sau khi bỏ mock.
- `backend/scripts/create_user.py` — CLI tạo admin đầu tiên. **Không bao giờ có endpoint đăng ký public.**
- `backend/tests/conftest.py` — DB test `lagroup_test` (Postgres thật, **không SQLite** vì JSONB/enum/unaccent là Postgres-specific), migrate 1 lần/session, mỗi test 1 transaction rollback.

**DoD P1**
- [x] `alembic upgrade head` từ DB rỗng sạch; `downgrade base` cũng sạch (kiểm enum drop) — verify full cycle: upgrade → downgrade base (0 bảng, 0 enum type còn lại, chỉ giữ `alembic_version`) → upgrade head lại thành công
- [x] `alembic check` = "No new upgrade operations detected"
- [x] Query `pg_constraint` xác nhận constraint có prefix `fk_/uq_/ix_` (0 constraint nào lệch khỏi `pk_/fk_/uq_` ngoài `alembic_version_pkc` mặc định; unique field dùng unique index nên nằm ở `pg_indexes` với prefix `ix_`)
- [x] `seed_dev.py` chạy **2 lần liên tiếp** không lỗi, không nhân đôi (1 tỉnh, 5 KCN, 4 danh mục, 6 công ty, 6 job, 3 post — đúng số lượng cả 2 lần)
- [x] **Checklist đối chiếu [feature-admin-dashboard.md](../.claude/rules/feature-admin-dashboard.md)**: ngày→`applications.created_at`, tỉnh→`applications.province_code`, tuổi→`applications.birth_date`, trạng thái→`applications.status`; KCN/ngành truy qua `applications.job_id → jobs.industrial_park_id/category_id` (không trùng lặp cột)
- [x] `data-models.md` cập nhật khớp schema thật

---

## PHASE 2 — Lõi bảo mật + Auth, backend-only (~1–1.5 ngày)

Dựng **toàn bộ primitive bảo mật trước khi bất kỳ endpoint ghi nào mở ra**. Chưa có UI; test bằng pytest + `/docs`.

**Primitive** (`app/core/`)
- `security.py` — `hash_password`/`verify_password` (bcrypt trực tiếp), `create_access_token`/`create_refresh_token`/`decode_token` (PyJWT), hash refresh token trước khi lưu DB
- `rate_limit.py` — `slowapi`. ⚠️ **Cạm bẫy phải xử ngay**: sau Nginx, nếu không cấu hình `--forwarded-allow-ips`/`ProxyHeadersMiddleware` thì mọi request cùng một IP → rate limit hoặc vô dụng hoặc chặn nhầm cả site
- `errors.py` — envelope lỗi thống nhất, **không rò traceback/tên bảng ra response**
- `storage.py` — sinh `uuid4` làm tên file, **không bao giờ tin `filename` client gửi**; lưu `{UPLOAD_DIR}/cv/{yyyy}/{mm}/{uuid}.{ext}` **ngoài web-root**; sniff magic bytes bằng `filetype` (`%PDF`, `FFD8FF`, `89504E47`); chặn size **theo stream**, không đọc hết body rồi mới check
- `audit.py` — helper ghi `audit_logs`
- [app/main.py](../backend/app/main.py) — security headers (`nosniff`, `Referrer-Policy`, `X-Frame-Options`); **tắt `/docs` + `/redoc` khi `environment == "prod"`**

**Auth** — `app/api/deps.py` (`get_current_user` đọc cookie, `require_roles(...)`), `app/api/v1/auth.py`:
- `POST /api/auth/login` — set 2 cookie `httpOnly + Secure + SameSite=strict`; rate limit 5 lần/15 phút theo IP+email; `failed_login_count` + `locked_until`; **thông báo lỗi giống hệt nhau** cho sai email và sai mật khẩu (chống user enumeration)
- `POST /api/auth/refresh` — **xoay vòng**: revoke cũ, cấp cặp mới. Refresh token đã revoke bị dùng lại = dấu hiệu bị đánh cắp → **revoke toàn bộ session của user đó**
- `POST /api/auth/logout`, `GET /api/auth/me`

**Test** `tests/test_auth.py`, `test_security.py` (~12 test) — nơi test đáng giá nhất dự án.

**DoD P2**
- [ ] Cookie có **cả 3 flag** `HttpOnly; Secure; SameSite=Strict`; response body **không chứa token**
- [ ] 6 lần login sai → bị chặn; log không ghi mật khẩu
- [ ] Refresh token dùng lại → 401 + revoke toàn bộ session
- [ ] File `.pdf` đổi đuôi `.jpg` bị từ chối; file 20MB bị từ chối **trước khi ghi đĩa**; đường dẫn nằm ngoài thư mục web
- [ ] `/docs` bị chặn ở prod; `pytest` + `ruff` + CI xanh
- [ ] `security.md` cập nhật (passlib→bcrypt, OAuth2PasswordBearer→cookie)

---

## PHASE 3 — API đọc công khai + FE bỏ mock data (~2 ngày)

### 3.1 API contract
`app/schemas/{job,post,common}.py`, `app/api/v1/public/{jobs,posts,taxonomies}.py`

`GET /api/jobs` (query `q`, `category`, `industrial_park`, `province`, `salary_min`, `page`, `page_size` max 50, `sort` → `{items,total,page,page_size}`, `q` dùng `unaccent`), `GET /api/jobs/{slug}`, `GET /api/job-categories` (kèm `job_count`), `GET /api/industrial-parks`, `GET /api/posts?type=&limit=`, `GET /api/posts/{slug}`.

**API trả dữ liệu có cấu trúc, KHÔNG trả chuỗi đã format** (`salary_min: 9000000`, `deadline: "2026-08-15"`). Lý do: cùng dữ liệu phải render khác nhau ở card / trang chi tiết / JSON-LD / chatbot.

### 3.2 Kiến trúc mock→API (D14) — điểm rủi ro rework lớn nhất

```
API DTO (snake_case)
  → lib/api/schema.d.ts     ← sinh tự động từ OpenAPI (npm run gen:api), commit file
  → lib/api/client.ts       ← serverFetch / browserFetch
  → lib/view-models/job.ts  ← MAPPER: salary_min:9000000 → salaryLabel:"9 – 12 triệu"
  → components/home/JobCard ← KHÔNG ĐỔI (trừ href)
```

1. `lib/view-models/types.ts` — **di chuyển nguyên xi** `Job`/`JobCategoryCard`/`EventItem`/`NewsPost`/`FeedItem` từ [mock-data.ts](../frontend/lib/mock-data.ts), đổi `Job` → `JobCardVM` + thêm `href`. **Giữ nguyên 100% field hiển thị.**
2. `lib/api/schema.d.ts` — `openapi-typescript` + script `npm run gen:api`. Đổi field ở backend → chạy lại gen → `tsc` báo lỗi **ngay tại mapper**, không lệch âm thầm.
3. `lib/api/client.ts` — `serverFetch` dùng `process.env.INTERNAL_API_URL`; `browserFetch` dùng path tương đối `/api/...` (nhờ D5 nên **không cần** `NEXT_PUBLIC_API_URL`). Lỗi → trả rỗng, section render "Đang cập nhật" thay vì sập cả trang.
4. `lib/format.ts` — `formatSalary`, `formatDeadline`, `formatDate`, `formatPhone`, `initials`. ⚠️ **Bắt buộc pin `timeZone: "Asia/Ho_Chi_Minh"`** trong `Intl.DateTimeFormat` — không thì server (container UTC) và client render khác nhau → hydration mismatch.
5. `lib/view-models/{job,post}.ts` — `toJobCardVM(dto)`, `toNewsPostVM(dto)`, `toFeedItemVM(dto)`.
6. Xóa `lib/mock-data.ts` (dữ liệu tương đương đã nằm trong `seed_dev.py`).

**Chỉ 6/10 component phải sửa, đều cơ học (nhận props thay vì import)**: [JobListSection.tsx](../frontend/components/home/JobListSection.tsx), [JobCard.tsx](../frontend/components/home/JobCard.tsx), [CategoriesSection.tsx](../frontend/components/home/CategoriesSection.tsx), [EventsSection.tsx](../frontend/components/home/EventsSection.tsx), [NewsSection.tsx](../frontend/components/home/NewsSection.tsx), [FeedListSection.tsx](../frontend/components/home/FeedListSection.tsx).
**Không đụng**: `HeroSection`, `AiBannerSection`, `BizCtaSection`, `AboutSection`, `WarnBox`, toàn bộ `components/ui/` và `components/layout/` (trừ `SearchBar`).

`app/(public)/page.tsx` → async Server Component, `Promise.all` 5 request song song, `export const revalidate = 300`.

### 3.3 Hạ tầng FE còn thiếu
[next.config.ts](../frontend/next.config.ts) thêm `rewrites()` proxy `/api/*` cho dev + `images.remotePatterns`; thêm `app/not-found.tsx`, `error.tsx`, `loading.tsx` (**hiện không có file nào**); [globals.css](../frontend/app/globals.css) bổ sung `--color-primary-50/200/300/400` (đang thiếu, cần cho state hover/disabled ở form + dashboard).

### 3.4 Test
Backend `test_jobs_public.py` (~8): filter, phân trang, `page_size` max, tìm không dấu, **job `draft` không lọt ra API công khai**, slug sai → 404.
Frontend: thêm `vitest`, ~10 test **chỉ cho `lib/format.ts` + `lib/view-models/*`** (pure function, rẻ, giá trị cao). Không RTL, không Playwright ở MVP.

**DoD P3**
- [ ] Trang chủ render 100% từ API; `grep -r "mock-data" frontend/` không còn kết quả
- [ ] `npm run gen:api` sinh lại `schema.d.ts` không diff
- [ ] Tắt backend → trang chủ vẫn render, không màn hình trắng
- [ ] Không có hydration warning trong console
- [ ] **Đối chiếu thiết kế bắt buộc** ([design-system.md](../.claude/rules/design-system.md)): screenshot 390px + 1440px vs `vieclamhaiphong.net_.png`, không horizontal scroll

---

## PHASE 4 — Trang chi tiết + danh sách + SEO (~1.5–2 ngày)

⚠️ [frontend/AGENTS.md](../frontend/AGENTS.md) cảnh báo *"This is NOT the Next.js you know"* — **phải đọc `node_modules/next/dist/docs/` trước khi code phase này**. Next 16 có `params`/`searchParams` là Promise, `cookies()`/`headers()` async. Không viết theo trí nhớ.

**Trang mới**: `app/(public)/viec-lam/page.tsx` (lọc qua URL searchParams, Server Component), `viec-lam/[slug]/page.tsx`, `tin-tuc/page.tsx` + `[slug]/page.tsx`, và **`chinh-sach-bao-mat/page.tsx` — BẮT BUỘC có trước P6** (form ứng tuyển phải link tới theo NĐ13). [SearchBar.tsx](../frontend/components/layout/SearchBar.tsx) chuyển thành form điều hướng tới `/viec-lam`.

**SEO** (tạo rule mới `.claude/rules/seo.md`):

| Hạng mục | Ghi chú |
|---|---|
| `metadataBase` + OG mặc định | [app/layout.tsx](../frontend/app/layout.tsx), `og:locale: vi_VN`, ảnh 1200×630 |
| `generateMetadata` động | title/description/canonical/OG theo từng tin |
| **JSON-LD `JobPosting`** | **Quan trọng nhất** — Google for Jobs là nguồn traffic thật. Bắt buộc `title`, `description`, `datePosted`, `validThrough`, `hiringOrganization`, `jobLocation`. Nên có `baseSalary` (`unitText:"MONTH"`, `currency:"VND"`), `employmentType` |
| JSON-LD `Organization` | Dùng đúng dữ liệu [company-info.md](../.claude/rules/company-info.md): tên pháp lý, MST 0801411964, địa chỉ, `telephone`, `logo` |
| `sitemap.ts` / `robots.ts` | Sitemap **try/catch → fallback route tĩnh** nếu API lỗi (sitemap 500 là tín hiệu xấu với Google); robots disallow `/dashboard`, `/api` |
| Slug | `python-slugify` (đ→d) lúc create job. **Slug bất biến sau khi publish** — đổi = mất backlink + mất index |
| Tin hết hạn | **KHÔNG 404.** Render banner "Tin đã hết hạn" + `robots:{index:false}` + gợi ý tin tương tự. 404 làm mất backlink; Google Jobs tự loại theo `validThrough` |

**DoD P4**
- [ ] `/viec-lam/{slug}` render server-side (`view-source` thấy đủ nội dung)
- [ ] JSON-LD pass **Google Rich Results Test** cho `JobPosting`, không warning field bắt buộc
- [ ] `/sitemap.xml` + `/robots.txt` đúng; tắt backend vẫn trả 200
- [ ] Share link lên Facebook hiện đúng title/mô tả/ảnh
- [ ] Job `closed` → `noindex`, không 404
- [ ] `/viec-lam?nganh=sx&kv=dai-an` share được, F5 giữ kết quả
- [ ] Đối chiếu thiết kế 390px + 1440px

---

## PHASE 5 — Admin tối thiểu: nhân viên tự đăng tin (~2 ngày)

Giải nghịch lý "ai nhập dữ liệu" (D15). Sau phase này **site công khai go-live được** mà không cần dev nhập liệu.

**Backend** `app/api/v1/admin/{jobs,posts,companies}.py` — CRUD đầy đủ, **mọi endpoint có `Depends(require_roles(...))`**. RBAC kiểm ở từng endpoint, không dựa vào UI ẩn/hiện. Sinh slug tự động, cảnh báo trùng. Ghi `audit_logs` cho create/update/delete.

**Frontend** — route group `(internal)` (đã chuẩn bị sẵn từ trước, quyết định tốt):
`app/(internal)/layout.tsx` (Sidebar + Topbar, **mobile-friendly** — quản lý xem trên điện thoại), `dang-nhap/page.tsx`, `dashboard/viec-lam/{page,[id]}.tsx`, `dashboard/tin-tuc/{page,[id]}.tsx`, và **`frontend/middleware.ts` (chưa tồn tại)** chặn `/dashboard/*` khi thiếu cookie hợp lệ — lớp 1; lớp 2 vẫn là dependency FastAPI. Đây chính là "không tin tưởng một lớp duy nhất".

**DoD P5**
- [ ] Nhân viên **không biết code** đăng được tin đầy đủ từ trình duyệt điện thoại, tin lên trang chủ + `/viec-lam` sau ≤5 phút
- [ ] `/dashboard/viec-lam` chưa đăng nhập → redirect `/dang-nhap`
- [ ] `curl POST /api/admin/jobs` không cookie → 401 (**không chỉ dựa middleware**)
- [ ] `staff` gọi endpoint chỉ dành `admin` → 403 (có test)
- [ ] Mọi thao tác có bản ghi `audit_logs`
- [ ] ⚠️ `vieclamhaiphong.net_.png` là ảnh site public, **không phải chuẩn cho dashboard** → sửa `design-system.md` (mục A6) và dùng tiêu chí riêng cho `(internal)`: responsive 375px, không tràn ngang, touch ≥44px

---

## PHASE 6 — Form ứng tuyển: endpoint public ghi PII + upload (~1.5–2 ngày)

**Endpoint rủi ro cao nhất dự án.** Nhờ P2 mọi primitive đã sẵn, phase này chỉ ráp lại.

### 10 điều kiện bắt buộc trước khi mở endpoint

| # | Yêu cầu | Nguồn |
|---|---|---|
| 1 | **Consent NĐ13/2023**: checkbox **không tick sẵn**, nêu rõ mục đích, link `/chinh-sach-bao-mat`. Lưu `consent_given/version/at/ip` | security.md |
| 2 | **Cơ chế xóa dữ liệu theo yêu cầu**: trang chính sách nêu kênh liên hệ + admin có endpoint purge (`purged_at`) | security.md |
| 3 | **Rate limit** 5 đơn/giờ/IP, 10 đơn/ngày/SĐT (dựa forwarded-IP đúng từ P2) | security.md |
| 4 | **Validate**: regex SĐT VN `^(0\|\+84)(3\|5\|7\|8\|9)\d{8}$`, giới hạn độ dài mọi field, strip HTML | security.md |
| 5 | **File**: PDF/JPG/PNG, max 5MB, **sniff magic bytes** không tin `Content-Type`, Nginx `client_max_body_size 6m` | security.md |
| 6 | **Lưu ngoài web-root** + phục vụ qua `GET /api/admin/applications/{id}/cv` có kiểm quyền, `Content-Disposition: attachment` + `nosniff`. **Không bao giờ render inline** | security.md |
| 7 | **Anti-spam**: honeypot ẩn + `elapsed_ms < 2000` = bot (D10) | — |
| 8 | **Chống trùng**: cùng `(job_id, phone)` trong 7 ngày → thông báo thân thiện, không tạo bản ghi | — |
| 9 | **Response không echo PII** — chỉ `{ok: true, reference_code}` | — |
| 10 | **Không log request body** của endpoint này (ghi chú rõ trong code) | — |

**Files**: `app/api/v1/public/applications.py`, `app/schemas/application.py`, `frontend/components/forms/ApplyForm.tsx` (Client Component, `type="tel"`/`type="date"`, trường bắt buộc tối thiểu, font ≥16px chống iOS auto-zoom), `app/(public)/viec-lam/[slug]/ung-tuyen/page.tsx`. Thông báo nội bộ: BackgroundTask POST tới `N8N_WEBHOOK_URL`, **no-op nếu env rỗng** (n8n là tùy chọn, không phải core dependency).

**Test** `tests/test_applications.py` (~12) — bộ test đáng tiền nhất: SĐT sai→422, thiếu consent→422, file 10MB→413, `.exe` đổi tên `.pdf`→415, vượt rate limit→429, honeypot→từ chối im lặng, nộp trùng→không tạo bản ghi, response không chứa `phone`, GET file không auth→401.

**DoD P6**
- [ ] 10 điều kiện trên đã thực thi, mỗi điều ≥1 test
- [ ] Nộp đơn end-to-end trên **điện thoại thật, mạng 4G**: điền ≤60 giây, upload ảnh chụp CV thành công
- [ ] `/chinh-sach-bao-mat` live, form link tới, checkbox không tick sẵn
- [ ] Admin tải được CV; người ngoài không đoán được URL file
- [ ] Thư mục upload không có quyền execute, không nằm trong static route nào
- [ ] Đối chiếu 375/390/414px, touch ≥44px

---

## PHASE 7 — Quản lý ứng viên + Dashboard tổng quan (~2 ngày)

**Trang mặc định sau đăng nhập = Dashboard tổng quan, không phải danh sách job.**

`app/api/v1/admin/applications.py` (list/filter/đổi trạng thái/gán người phụ trách/tải CV có audit/export CSV có audit) + `stats.py`:
`/api/admin/stats/overview?from=&to=`, `/by-province`, `/by-age-group` (bucket 18-24/25-34/35-44/45+ **tính từ `birth_date`**), `/by-industrial-park` — tất cả **`GROUP BY` ở SQL**, không kéo raw data về FE.

Frontend `app/(internal)/dashboard/page.tsx` + `ung-vien/page.tsx`; Sidebar render động theo `role`, **ẩn hẳn** tab không có quyền. Biểu đồ: `recharts` (chỉ nạp trong `(internal)` nên không ảnh hưởng bundle site công khai); nếu chỉ cần bar chart thì SVG/CSS thuần, khỏi thêm dep. Seed `address_mappings` + roll-up stats qua bảng này.

**DoD P7**
- [ ] Sau đăng nhập vào thẳng Dashboard tổng quan
- [ ] 4 biểu đồ đủ dữ liệu; số liệu khớp query SQL thủ công
- [ ] `staff` không thấy tab hạn chế (UI) **và** gọi API tương ứng bị 403 (backend)
- [ ] Xem CV / export CSV có `audit_logs` kèm `user_id` + `ip`
- [ ] Dashboard xem được ở 390px, biểu đồ không tràn ngang
- [ ] Ứng viên có mã tỉnh cũ vẫn gộp đúng nhóm qua `address_mappings`

---

## PHASE 8 — Chatbot AI thật (~2 ngày)

Thay [ChatWidget.tsx](../frontend/components/chatbot/ChatWidget.tsx) demo (trả lời cứng qua `setTimeout`) bằng backend thật.

`app/api/v1/public/chat.py` (`POST /api/chat`, SSE streaming) + `app/services/chat_service.py`:
- **RAG bằng tool, không bằng embeddings** (D11): khai báo tool `search_jobs(keyword, province, category, salary_min)` cho Claude gọi thẳng vào DB. Với ~50–200 tin đang tuyển thì đơn giản hơn và chính xác hơn pgvector, không phải maintain pipeline embedding.
- System prompt giới hạn phạm vi "tư vấn viên việc làm LA Group", cấm bịa lương/chính sách. Python SDK `anthropic`.
- **Chống lạm dụng (bắt buộc — endpoint public đốt tiền API)**: rate limit 10 tin/10 phút/IP, giới hạn độ dài input + số lượt hội thoại, **trần chi tiêu ngày** (đếm token) → vượt thì fallback "vui lòng gọi hotline".
- Model: mặc định `claude-opus-5`; nếu ưu tiên chi phí thì `claude-haiku-4-5`. **Quyết định này chưa chốt** — quyết ở đầu P8.

**DoD P8**
- [ ] "Có việc gì ở KCN Đại An lương trên 10 triệu?" → trả **đúng tin có trong DB** kèm link
- [ ] Hỏi việc **không tồn tại** → nói không có, **không bịa**
- [ ] Hỏi ngoài phạm vi → từ chối lịch sự
- [ ] 30 tin nhắn liên tiếp → bị rate limit, không sập, không đốt hết quota
- [ ] `ANTHROPIC_API_KEY` không xuất hiện ở client (grep bundle)

---

## PHASE 9 — Triển khai production VPS (~1–2 ngày)

`docker-compose.prod.yml` (Nginx + Certbot + Next standalone + FastAPI + Postgres; n8n qua profile `automation`), `backend/Dockerfile`, `frontend/Dockerfile`, `nginx/lahr.conf` (`/`→Next, `/api/`→FastAPI theo D5, `client_max_body_size 6m`, forwarded headers cho rate limit), `scripts/backup.sh` (`pg_dump` → **mã hóa** → rclone lên B2/Drive) **kèm script restore + test restore thật một lần** — backup chưa restore được là backup không tồn tại.

**Không build Next trên VPS** (RAM 4GB dễ OOM) — build local/CI rồi push image. `ufw` chỉ 80/443 + SSH đổi port; `fail2ban`; Postgres/FastAPI chỉ trên docker network nội bộ. Volume `uploads/` ngoài web-root, có trong backup.

**DoD P9**
- [ ] `https://lahr.vn` chạy, SSL A trên SSL Labs, HTTP→HTTPS
- [ ] `docker stats` RAM ổn định dưới 4GB
- [ ] `nmap` từ ngoài chỉ thấy 80/443/SSH-port-mới
- [ ] Cron backup chạy, file mã hóa, **đã restore thử thành công vào DB trống**
- [ ] `/docs` trả 404 ở production
- [ ] Lighthouse mobile: Performance ≥85, SEO ≥95 (trang chủ + 1 trang job)
- [ ] `commands.md` cập nhật đủ lệnh thật (test, lint, seed, backup, deploy)

---

## Phụ lục A — 11 mâu thuẫn trong rules cần sửa (làm ở P0)

| # | File | Sai | Sửa |
|---|---|---|---|
| A1 | [tech-stack.md](../.claude/rules/tech-stack.md) | "design tokens trong `tailwind.config.ts`" | globals.css qua Tailwind v4 `@theme`. `tailwind.config.ts` **không được v4 đọc** — không tạo file này. (CLAUDE.md đã ghi quyết định đúng, rules chưa cập nhật) |
| A2 | [design-system.md](../.claude/rules/design-system.md) | như A1 | như A1 |
| A3 | [data-models.md](../.claude/rules/data-models.md) | "`Company`… có thể bỏ qua" | **Bắt buộc** (D7). Ngữ nghĩa: Company = nhà máy nơi lao động làm việc, không phải bên tự đăng tin |
| A4 | [security.md](../.claude/rules/security.md) | "hash… **qua passlib**" | `bcrypt` trực tiếp (passlib 1.7.4 không tương thích bcrypt ≥4.1); giới hạn 72 byte ở schema |
| A5 | tech-stack.md vs security.md | `OAuth2PasswordBearer` (header) ⟷ httpOnly cookie | Chốt cookie (D4); `OAuth2PasswordBearer` chỉ optional cho `/docs` ở dev |
| A6 | design-system.md | Quy tắc đối chiếu `vieclamhaiphong.net_.png` áp cho **mọi** UI | Giới hạn vào site công khai; `(internal)` có tiêu chí riêng |
| A7 | tech-stack.md | gợi ý `shadcn/ui` | `@radix-ui/react-*` trực tiếp (D12) |
| A8 | tech-stack.md | `pgvector` cho chatbot | Ghi chú: MVP dùng tool-use, chưa cần pgvector (D11) |
| A9 | *(thiếu)* | Không có rule SEO | Tạo `.claude/rules/seo.md` (P4) + link vào CLAUDE.md |
| A10 | *(thiếu)* | Không có rule testing/CI | Tạo `.claude/rules/testing.md` |
| A11 | [commands.md](../.claude/rules/commands.md) | Thiếu lệnh test/lint/seed/`alembic check` | Cập nhật cuối mỗi phase |

## Phụ lục B — Mức testing đề xuất (không over-engineer)

Triết lý: chỉ test thứ **(a) đắt khi sai** và **(b) khó phát hiện bằng mắt**.

| Loại | Làm | Không làm |
|---|---|---|
| pytest backend | ~40–50 test: auth/RBAC, validate+upload+rate limit endpoint ứng tuyển, filter/phân trang job, `draft` không rò ra public | Không test CRUD happy-path toàn diện, không mock DB |
| DB test | Postgres thật (`lagroup_test`), transaction rollback mỗi test | **Không SQLite** — JSONB/enum/unaccent là Postgres-specific, cho false confidence |
| `alembic check` CI | Có — bắt cả drift model↔migration lẫn bẫy quên re-export | — |
| vitest frontend | ~10 test cho `lib/format.ts` + `lib/view-models/*` | Không RTL, không Playwright ở MVP |
| Type safety | `openapi-typescript` + `tsc --noEmit` trong CI — thay phần lớn integration test FE/BE, chi phí ~0 | — |
| Lint | `ruff` (thay black+flake8+isort), `eslint`+`prettier` | — |
| CI | 1 workflow, 2 job, chạy trên PR + push | Không CD tự động ở MVP |

---

## Verification tổng thể

Sau mỗi phase, chạy đúng DoD của phase đó. Ba mốc kiểm chứng end-to-end lớn:

1. **Sau P1** — clone sạch → `docker compose up -d` → `alembic upgrade head` → `seed_dev.py` (2 lần) → `create_user.py` → xác nhận đủ cột cho mọi biểu đồ Dashboard tương lai.
2. **Sau P5 (mốc go-live)** — nhân viên thật đăng 1 tin thật từ điện thoại → tin lên trang chủ + `/viec-lam` → JSON-LD pass Rich Results Test → screenshot 390px/1440px đối chiếu `vieclamhaiphong.net_.png` → `curl` endpoint admin không cookie phải 401.
3. **Sau P6** — nộp hồ sơ thật trên điện thoại 4G ≤60 giây; chạy đủ 12 test `test_applications.py`; xác nhận file CV nằm ngoài web-root và không truy cập được nếu không đăng nhập.
