# Bảo mật

Hệ thống lưu dữ liệu cá nhân nhạy cảm (CCCD, ảnh, lương, hợp đồng) và có khu vực quản trị nội bộ — bảo mật phải được thiết kế từ đầu, không thêm sau:

- JWT trong httpOnly + Secure + SameSite=strict cookie (không lưu localStorage); access token sống ngắn (15-30 phút) + refresh token xoay vòng.
- Mật khẩu hash bằng `bcrypt`/`argon2` qua `passlib`, không bao giờ lưu plaintext.
- RBAC kiểm tra ở **cả** middleware Next.js lẫn dependency FastAPI trên từng endpoint — không tin tưởng một lớp duy nhất.
- Rate limiting cho endpoint đăng nhập (chặn brute-force).
- File upload (CCCD, ảnh) lưu ngoài web-root, truy xuất qua endpoint có kiểm tra quyền (không link public vĩnh viễn); kiểm tra MIME type thực tế + giới hạn dung lượng.
- Tuân thủ tinh thần Nghị định 13/2023/NĐ-CP về bảo vệ dữ liệu cá nhân: có thông báo/đồng ý thu thập dữ liệu trên form ứng tuyển, giới hạn mục đích sử dụng, có cơ chế xoá dữ liệu khi được yêu cầu.
- Backup (`pg_dump`) phải mã hoá trước khi đẩy ra lưu trữ ngoài VPS.
- Input validation qua Pydantic schema; dùng SQLAlchemy ORM (parameterized query), không viết raw SQL nối chuỗi.
- Firewall VPS (`ufw`) chỉ mở 80/443 + SSH đã đổi port; Postgres/FastAPI/n8n chỉ giao tiếp qua Docker network nội bộ, không expose ra ngoài; CORS FastAPI giới hạn đúng domain Next.js.
