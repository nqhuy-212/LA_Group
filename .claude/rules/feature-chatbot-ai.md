# Tính năng: Chatbot AI tư vấn việc làm

- Chat UI dạng widget nổi (bottom-right trên desktop, full-screen hoặc bottom-sheet trên mobile).
- Luồng gợi ý: hỏi người dùng về kỹ năng/kinh nghiệm/khu vực mong muốn → match với dữ liệu tin tuyển dụng đang có → trả lời bằng ngôn ngữ tự nhiên, dễ hiểu.
- Backend: FastAPI gọi Claude API (xem `tech-stack.md`), có system prompt định hướng vai trò "tư vấn viên việc làm", giới hạn phạm vi trả lời (không tư vấn ngoài lĩnh vực việc làm/chính sách công ty).
- Nên dùng RAG đơn giản: truy vấn database tin tuyển dụng/chính sách hiện có, đưa vào context trước khi gọi Claude, để chatbot trả lời dựa trên dữ liệu thật thay vì bịa thông tin.
- Không được để chatbot tự bịa thông tin tuyển dụng, mức lương, hoặc chính sách không có trong dữ liệu thực tế của công ty.
