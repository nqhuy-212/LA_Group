# Testing & CI

Triết lý: chỉ test thứ **(a) đắt khi sai** và **(b) khó phát hiện bằng mắt**. Không over-engineer test cho MVP.

## Backend (pytest)

- DB test dùng **Postgres thật** (`lagroup_test`), **không SQLite** — JSONB, enum, `unaccent` là Postgres-specific và SQLite cho false confidence. Migrate 1 lần/session, mỗi test chạy trong 1 transaction rồi rollback.
- Ưu tiên test: auth/RBAC, validate + upload + rate limit của endpoint ứng tuyển (rủi ro cao nhất dự án, xem `security.md`), filter/phân trang job, job `draft` không được lọt ra API công khai.
- Không test CRUD happy-path toàn diện, không mock DB.
- `alembic check` chạy trong CI — bắt cả drift model↔migration lẫn bẫy quên re-export model (xem `data-models.md` về quy ước `app/models/__init__.py`).

## Frontend (vitest)

- Chỉ test pure function: `lib/format.ts`, `lib/view-models/*` (rẻ, giá trị cao — sai ở đây là sai số liệu hiển thị cho người dùng).
- Không dùng React Testing Library, không dùng Playwright ở giai đoạn MVP.
- `openapi-typescript` + `tsc --noEmit` trong CI thay phần lớn integration test frontend/backend, chi phí gần như bằng 0.

## Lint

- Backend: `ruff` (thay black + flake8 + isort).
- Frontend: `eslint` + `prettier`.

## CI

Một workflow (`.github/workflows/ci.yml`), 2 job, chạy trên mọi PR + push nhánh `main`:

- **backend**: Postgres service container → `ruff check` → `alembic upgrade head` → `alembic check` → `pytest`.
- **frontend**: `npm ci` → `lint` → `typecheck` → `test` (vitest) → `build`.

Không có CD tự động ở giai đoạn MVP (deploy VPS là thao tác tay theo `commands.md`/P9 trong `docs/PLAN.md`).
