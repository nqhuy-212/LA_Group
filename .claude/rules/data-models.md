# Data Models (định hướng ban đầu)

Khi tạo SQLAlchemy model, tối thiểu cần các entity sau (điều chỉnh khi có yêu cầu cụ thể hơn):

- `Job` — vị trí, mô tả, yêu cầu, lương, khu vực, ngành nghề, hạn nộp, trạng thái (đang tuyển/đã đóng), công ty liên kết.
- `Company` — **bắt buộc, không bỏ qua** (D7). Ngữ nghĩa: `Company` là **nhà máy/đối tác nơi lao động sẽ làm việc** mà LAHR đang cung ứng/cho thuê lại nhân sự tới — không phải "bên tự đăng tin" như trên job board trung lập thông thường (xem mô hình kinh doanh ở `company-info.md`). Có `display_name_public` nullable để ẩn danh đối tác khi cần (một số nhà máy không muốn lộ tên trên tin tuyển dụng công khai).
- `Application` — ứng viên ứng tuyển vào `Job` nào, thông tin liên hệ, file CV, kèm `region`/tỉnh và ngày sinh (phục vụ Dashboard tổng quan, xem `feature-admin-dashboard.md`).
- `Policy`/`Post` — nội dung chính sách/tin tức, có publish state.
- `User` (trước đây `AdminUser`) — tài khoản nội bộ, có cột `role` (`admin`/`manager`/`staff`) cho RBAC.

## Entity mở rộng cho roadmap tương lai

Chưa code ngay, nhưng nên tính trước để tránh migration lớn sau này:

- `Employee` — nhân sự nội bộ + lao động đang cho thuê lại.
- `Document` — file CCCD/ảnh upload + kết quả OCR (JSONB), liên kết `Employee`, lưu ngoài web-root.
- `Contract` — hợp đồng lao động, dữ liệu in hàng loạt, liên kết `Employee` + `Company` đối tác.
- `AddressMapping` — bảng tra cứu địa chỉ cũ → mới sau sáp nhập.
- `TimesheetImport`/`AttendanceRecord` — dữ liệu chấm công import từ file của từng đối tác.
- `PayrollRule` — rule tính lương riêng theo từng công ty đối tác (JSONB).
- `AuditLog` — ghi log truy cập/sửa đổi dữ liệu nhạy cảm.
