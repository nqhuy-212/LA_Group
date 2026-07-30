# LA Group — Job Portal Website

Website chính thức của **LA Group** (pháp nhân: LAHR — Công ty Cổ phần Dịch vụ Cung ứng Nhân lực LA), kết nối doanh nghiệp/nhà máy đối tác với người lao động: tuyển dụng, chatbot AI tư vấn việc làm, và trang thông tin công ty. Đối tượng dùng chính là lao động phổ thông, chủ yếu truy cập bằng điện thoại di động.

Toàn bộ quy tắc chi tiết của dự án được tách theo chủ đề trong `.claude/rules/` (chuẩn rule của Claude Code — mỗi file luôn được nạp vào ngữ cảnh phiên làm việc, không cần khai báo gì thêm trong file này):

- [`overview.md`](.claude/rules/overview.md) — Tổng quan dự án, đối tượng người dùng, mục tiêu UX
- [`company-info.md`](.claude/rules/company-info.md) — Thông tin pháp nhân/liên hệ chính thức của LA Group (LAHR)
- [`tech-stack.md`](.claude/rules/tech-stack.md) — Kiến trúc kỹ thuật: frontend (Next.js), backend (FastAPI), database (PostgreSQL tự host), hạ tầng VPS
- [`commands.md`](.claude/rules/commands.md) — Lệnh thường dùng để chạy/build/migrate dự án
- [`design-system.md`](.claude/rules/design-system.md) — Design system, mobile-first, yêu cầu đối chiếu thiết kế bắt buộc
- [`feature-recruitment.md`](.claude/rules/feature-recruitment.md) — Tính năng tuyển dụng
- [`feature-chatbot-ai.md`](.claude/rules/feature-chatbot-ai.md) — Chatbot AI tư vấn việc làm
- [`feature-company-content.md`](.claude/rules/feature-company-content.md) — Trang thông tin công ty
- [`feature-admin-dashboard.md`](.claude/rules/feature-admin-dashboard.md) — Admin/CMS & Dashboard nội bộ cho nhân viên/quản lý
- [`data-models.md`](.claude/rules/data-models.md) — Data models hiện tại và các entity mở rộng cho roadmap tương lai
- [`security.md`](.claude/rules/security.md) — Yêu cầu bảo mật (bắt buộc, không phải làm sau)
- [`code-conventions.md`](.claude/rules/code-conventions.md) — Quy ước code
- [`out-of-scope.md`](.claude/rules/out-of-scope.md) — Phạm vi MVP (chưa làm ở giai đoạn này)

Khi có quyết định kiến trúc/nghiệp vụ mới, cập nhật đúng file rule liên quan theo chủ đề — không dồn nội dung mới trở lại file này.
