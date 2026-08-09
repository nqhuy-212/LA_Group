# Tính năng: Chatbot AI tư vấn việc làm

- Chat UI dạng widget nổi (bottom-right trên desktop, full-screen hoặc bottom-sheet trên mobile).
- Luồng gợi ý: hỏi người dùng về kỹ năng/kinh nghiệm/khu vực mong muốn → match với dữ liệu tin tuyển dụng đang có → trả lời bằng ngôn ngữ tự nhiên, dễ hiểu.
- **Quiz 4 câu hỏi có thứ tự cố định** (`components/chatbot/ChatQuiz.tsx`, tự động hiện khi mở chat): thời vụ/chính thức → lương tuần/tháng → KCN → gọi trực tiếp/để lại SĐT, mỗi bước có nút quay lại (kể cả sau khi đã chọn "gọi trực tiếp" — không phải ngõ cụt, vẫn đổi được sang "để lại SĐT"). State máy đặt **hoàn toàn ở frontend**, không để LLM tự quyết định thứ tự (không đáng tin cậy qua nhiều lượt hội thoại). Sau câu 3, quiz gọi thẳng `GET /api/jobs` (filter `employment_type`/`salary_period`/`industrial_park`, không qua LLM) để hiện danh sách việc làm phù hợp thật **cùng lúc** với câu 4 — nhanh, rẻ, không có rủi ro bịa dữ liệu. Câu 4 chọn "để lại SĐT" tạo lead qua `POST /api/leads` (không phải `/api/applications`) kèm `notes` = tóm tắt quiz, để nhân viên tư vấn có ngữ cảnh khi gọi lại.
- Backend: FastAPI gọi OpenAI API (xem `tech-stack.md`), có system prompt định hướng vai trò "tư vấn viên việc làm", giới hạn phạm vi trả lời (không tư vấn ngoài lĩnh vực việc làm/chính sách công ty).
- Nên dùng RAG đơn giản: truy vấn database tin tuyển dụng/chính sách hiện có, đưa vào context trước khi gọi model, để chatbot trả lời dựa trên dữ liệu thật thay vì bịa thông tin.
- Không được để chatbot tự bịa thông tin tuyển dụng, mức lương, hoặc chính sách không có trong dữ liệu thực tế của công ty.
