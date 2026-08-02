# SEO

Mô hình kinh doanh sống bằng traffic Google/Facebook (cung ứng lao động, không có ngân sách ads lớn) — SEO không phải "làm sau", đặc biệt Google for Jobs là kênh khách hàng chính cho tin tuyển dụng. Triển khai đầy đủ ở P4 (`docs/PLAN.md`), nhưng các ràng buộc dưới đây áp dụng ngay khi tạo route/model liên quan.

- **Slug, không dùng int ID cho URL công khai** (`/viec-lam/{slug}`, `/tin-tuc/{slug}`). Sinh bằng `python-slugify` (chuyển đ→d, bỏ dấu) lúc tạo bản ghi. **Slug bất biến sau khi publish** — đổi slug = mất backlink + mất index trên Google.
- **JSON-LD `JobPosting`** trên trang chi tiết việc làm — quan trọng nhất cho Google for Jobs. Bắt buộc có `title`, `description`, `datePosted`, `validThrough`, `hiringOrganization`, `jobLocation`; nên có `baseSalary` (`unitText: "MONTH"`, `currency: "VND"`), `employmentType`. Test bằng Google Rich Results Test trước khi coi là xong.
- **JSON-LD `Organization`** dùng đúng dữ liệu chính thức ở `company-info.md` (tên pháp lý, MST 0801411964, địa chỉ, `telephone`, `logo`) — không bịa thông tin khác.
- **Tin hết hạn/đóng: KHÔNG trả 404.** Render banner "Tin đã hết hạn" + `robots: {index: false}` + gợi ý tin tương tự. 404 xoá backlink đã tích luỹ; Google Jobs tự loại tin theo `validThrough` mà không cần 404.
- `metadataBase` + Open Graph mặc định (`og:locale: vi_VN`, ảnh 1200×630) ở `app/layout.tsx`; `generateMetadata` động (title/description/canonical/OG) cho từng trang chi tiết.
- `sitemap.ts` / `robots.ts`: sitemap phải có `try/catch` → fallback route tĩnh nếu API lỗi (sitemap trả 500 là tín hiệu xấu với Google); `robots.txt` disallow `/dashboard`, `/api`.
