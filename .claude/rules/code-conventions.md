# Quy ước code

- TypeScript strict mode bật, tránh `any`.
- Component nhỏ, tách rõ UI thuần (`components/`) và logic dữ liệu (fetch/server actions).
- Ưu tiên Server Components cho nội dung tĩnh/SEO (tin tuyển dụng, chính sách); Client Components chỉ cho phần tương tác (form ứng tuyển, chatbot).
- Animation chỉ dùng cho mục đích rõ ràng (scroll-reveal theo section như quy định ở `design-system.md`, feedback tương tác cơ bản) — không thêm hiệu ứng phức tạp/thừa thãi ngoài phạm vi đó, giữ trải nghiệm nhẹ, tải nhanh trên mạng di động 3G/4G phổ biến ở khu vực lao động.
- Ảnh cần tối ưu (next/image, lazy load) vì đối tượng dùng mobile, mạng có thể chậm.
