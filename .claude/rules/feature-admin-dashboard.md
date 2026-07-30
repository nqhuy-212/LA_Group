# Tính năng: Admin/CMS & Dashboard nội bộ

**Quan trọng**: `index.html`/site công khai hiện tại **chỉ là giao diện cho khách/người lao động**. Nhân viên và quản lý LA Group dùng một **khu vực riêng biệt** (route `(internal)`/`/dashboard/*`), layout Sidebar + Topbar khác hẳn site công khai, bắt buộc đăng nhập.

- **Đăng nhập**: JWT (FastAPI) + RBAC 3 role tối thiểu:
  - `admin` — toàn quyền mọi tab, quản lý tài khoản nhân viên.
  - `manager` — xem Dashboard tổng quan/báo cáo, duyệt ứng viên, không sửa cấu hình hệ thống.
  - `staff` — chỉ thấy tab được cấp quyền (VD: nhân viên tuyển dụng chỉ thấy "Đăng tin"/"Quản lý ứng viên").
  - Sidebar render động theo role (ẩn hẳn tab không có quyền); backend luôn tự kiểm tra quyền trên từng endpoint, không chỉ dựa vào UI ẩn/hiện.
- **Trang mặc định sau đăng nhập = Dashboard tổng quan**, không phải danh sách job. Nội dung Dashboard tổng quan:
  - Số ứng viên/hồ sơ tuyển mới theo ngày/tuần/tháng.
  - Phân tích theo vùng miền/tỉnh/KCN.
  - Phân tích theo độ tuổi ứng viên.
  - (Mở rộng sau: theo ngành nghề, theo công ty đối tác, theo trạng thái hồ sơ.)
  - Dữ liệu tổng hợp (GROUP BY) tính ở FastAPI (`/api/dashboard/stats/*`), không kéo raw data về tính ở frontend.
- **Các tab khác trên Sidebar**: Quản lý nhân sự, Thông tin công nhân, Nhập liệu (import chấm công/danh sách công nhân), Đăng tin tuyển dụng (CRUD `Job`), Quản lý ứng viên (duyệt `Application`), Tin tức/Chính sách (CRUD `Post`/`Policy`). Các giai đoạn sau sẽ thêm: Hợp đồng (in hàng loạt), Chấm công & Tính lương, OCR CCCD.
- Không public route nội bộ — bảo vệ bằng middleware kiểm tra JWT + role ở tầng route (Next.js) **và** dependency kiểm quyền ở từng endpoint (FastAPI).
- Dashboard nội bộ cũng phải mobile-friendly (quản lý có thể xem trên điện thoại) — vẫn áp dụng đầy đủ nguyên tắc ở `design-system.md`.
