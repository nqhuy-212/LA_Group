# Data Models

Schema thật đã migrate (`backend/alembic/versions/7dcb960fdfb3_0001_initial_schema.py`, khoá ở P1 theo `docs/PLAN.md`). Mỗi entity 1 file trong `backend/app/models/`, đăng ký tường minh trong `backend/app/models/__init__.py` (xem cảnh báo "bẫy re-export" bên dưới). Enum dùng chung ở `backend/app/models/enums.py` (Postgres native enum, giá trị lưu dạng chữ thường qua `values_callable=enum_values`).

- `Province` (`provinces`) — `code` (PK, mã tỉnh GSO), `name`, `type`, `is_active`. Seed hiện tại chỉ có Hải Dương (`code="30"`).
- `AddressMapping` (`address_mappings`) — `old_code` (unique), `old_name`, `new_code` (FK → `provinces.code`), `level`, `effective_date`. Bảng tra cứu địa chỉ cũ → mới sau sáp nhập (D13) — chưa có dữ liệu seed, sẽ điền khi cần roll-up thống kê ở P7.
- `IndustrialPark` (`industrial_parks`) — `slug` (unique), `name`, `province_code` (FK), `district_name` nullable. Seed 5 KCN Hải Dương theo `company-info.md`.
- `JobCategory` (`job_categories`) — `slug` (unique, giữ `sx/kt/dv/kv` để FE không vỡ — D8), `name`, `sort_order`, `is_active`.
- `Company` (`companies`) — `slug` (unique), `name`, `display_name_public` nullable (ẩn danh đối tác), `logo_initials`, `logo_url`, `is_partner`. **Bắt buộc, không bỏ qua** (D7). Ngữ nghĩa: `Company` là **nhà máy/đối tác nơi lao động sẽ làm việc** mà LAHR đang cung ứng/cho thuê lại nhân sự tới — không phải "bên tự đăng tin" như trên job board trung lập thông thường (xem mô hình kinh doanh ở `company-info.md`).
- `Job` (`jobs`) — `slug` (unique+indexed, bất biến sau publish — SEO), `title`, `company_id`/`category_id` (FK bắt buộc), `industrial_park_id` (FK nullable), `province_code` (FK), `salary_min`/`salary_max` (int VND, nullable), `salary_negotiable`, `quantity`, `age_min`/`age_max` nullable, `shift_type` (free-text, nullable, VD "Theo ca"), `employment_type` (enum `employment_type`: official/seasonal, nullable), `salary_period` (enum `salary_period`: weekly/monthly, nullable), `description`/`requirements`/`benefits` (Text, nullable), `deadline`, `status` (enum `job_status`: draft/published/closed/archived), `is_hot`, `published_at`, `view_count`, `meta_title`/`meta_description`. Có expression index `ix_jobs_title_unaccent` (hàm `immutable_unaccent`, tạo tay ngoài `Base.metadata` — xem `alembic/env.py` `include_object`) phục vụ tìm không dấu.
- `Application` (`applications`) — `reference_code` (unique), `job_id` nullable (FK, `NULL` khi là lead chatbot không gắn tin cụ thể — xem `POST /api/leads`), `full_name`, `phone`, `email` nullable, `birth_date` nullable (**không lưu `age`** — Dashboard tự tính bucket), `gender` (enum, nullable), `province_code` (FK, nullable) + `hometown_text`, `cv_file_path`/`cv_original_name`/`cv_mime`/`cv_size`, `notes` (Text, nullable — ghi chú tự do, VD tóm tắt quiz chatbot), `source` (enum `application_source`: web/chatbot/zalo/facebook/walk_in), `status` (enum `application_status`: new/contacted/interviewing/hired/rejected), `assigned_to_id` (FK → `users.id`), `consent_given`/`consent_version`/`consent_at`/`consent_ip` + `user_agent` (NĐ13), `purged_at`. **Không có cột `industrial_park_id`/`category_id` riêng** — Dashboard truy các chiều này qua `job_id → jobs.industrial_park_id/category_id`, tránh trùng lặp dữ liệu.
- `Post` (`posts`) — `slug` (unique), `title`, `excerpt`, `content`, `cover_image_url`, `type` (enum `post_type`: news/policy/guide/scam_alert/event — gộp 4 loại nội dung của mock data cũ qua 1 cột thay vì 4 bảng), `status` (enum `post_status`: draft/published/archived), `published_at`, `meta_title`/`meta_description`.
- `User` (`users`) — `email` (unique), `hashed_password`, `role` (enum `user_role`: admin/manager/staff cho RBAC), `is_active`, `failed_login_count`, `locked_until`. **Không có endpoint đăng ký public** — tạo qua `backend/scripts/create_user.py` hoặc Admin UI (P5) bởi admin đã đăng nhập.
- `RefreshToken` (`refresh_tokens`) — `user_id` (FK), `token_hash` (unique, không lưu token thô), `expires_at`, `revoked_at` nullable, `user_agent`, `ip`, `created_at`.
- `AuditLog` (`audit_logs`) — `user_id` (FK nullable), `action`, `entity_type`, `entity_id` nullable, `ip`, `meta` (JSONB), `created_at`.

## Quy ước bắt buộc khi thêm/sửa model

- **Naming convention constraint đã khoá** (`app/db/base.py`, prefix `pk_/fk_/uq_/ix_/ck_`) — không tự đặt tên constraint tay.
- **Bẫy re-export**: thêm model mới phải import tường minh + thêm vào `__all__` trong `app/models/__init__.py`. Quên bước này = model không đăng ký vào `Base.metadata` = `alembic --autogenerate` sinh nhầm lệnh `drop_table`. Hàng rào thật là `alembic check` chạy trong CI.
- **Postgres ENUM khi downgrade**: Alembic không tự sinh `DROP TYPE` khi hạ cấp — mọi migration tạo cột enum mới phải tự thêm `sa.Enum(name="...").drop(op.get_bind(), checkfirst=True)` vào cuối `downgrade()` (xem migration `7dcb960fdfb3` làm mẫu).
- **Mixin dùng chung** (`app/db/mixins.py`): `IdMixin` (PK int autoincrement), `TimestampMixin` (`created_at`/`updated_at`, UTC, `server_default=func.now()`). `RefreshToken`/`AuditLog` chỉ dùng `created_at` riêng (không có `updated_at` — bản ghi immutable).
- **URL công khai dùng `slug`, không dùng int ID** (bắt buộc cho SEO — xem `seo.md`).

## Entity mở rộng cho roadmap tương lai

Chưa code, nhưng nên tính trước để tránh migration lớn sau này (P1 đã seed đủ cột nullable cần thiết cho các bảng hiện có theo nguyên tắc "thà thừa cột nullable còn hơn thiếu"):

- `Employee` — nhân sự nội bộ + lao động đang cho thuê lại.
- `Document` — file CCCD/ảnh upload + kết quả OCR (JSONB), liên kết `Employee`, lưu ngoài web-root.
- `Contract` — hợp đồng lao động, dữ liệu in hàng loạt, liên kết `Employee` + `Company` đối tác.
- `TimesheetImport`/`AttendanceRecord` — dữ liệu chấm công import từ file của từng đối tác.
- `PayrollRule` — rule tính lương riêng theo từng công ty đối tác (JSONB).
