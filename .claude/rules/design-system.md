# Design System

Phong cách bám theo ảnh tham khảo `vieclamhaiphong.net_.png`: **tối giản, hiện đại, chuyên nghiệp**, tông màu xanh dương chủ đạo là màu thương hiệu, dễ tiếp cận với người dùng phổ thông.

## Nguyên tắc chung
- **Mobile-first bắt buộc**: thiết kế và code UI cho màn hình nhỏ trước, sau đó mở rộng lên tablet/desktop bằng breakpoint của Tailwind (`sm/md/lg/xl`).
- **Website phải mobile friendly — không thương lượng.** Tiêu chí tối thiểu cho mọi trang/component:
  - Không có horizontal scroll ở bất kỳ breakpoint nào (test tối thiểu 375px, 390px, 414px).
  - Font đủ lớn để đọc không cần zoom (tối thiểu 16px cho body text để tránh iOS tự zoom khi focus input).
  - Menu chính chuyển thành hamburger/bottom-nav trên mobile, không giữ nguyên menu ngang desktop.
  - Form (tìm kiếm, ứng tuyển) dùng input type phù hợp (`tel`, `email`...) để hiện đúng bàn phím mobile.
  - Test bằng Chrome DevTools device toolbar hoặc responsive screenshot ở bước đối chiếu thiết kế (xem mục "Yêu cầu bắt buộc — Đối chiếu thiết kế" bên dưới) trước khi coi bất kỳ UI nào là xong.
- Vùng chạm (nút, link) tối thiểu 44×44px, khoảng cách đủ rộng để bấm bằng ngón tay.
- Không dùng thuật ngữ chuyên ngành/tiếng Anh khó hiểu trong UI hướng tới người lao động — ưu tiên tiếng Việt rõ ràng, ngắn gọn.
- Layout đơn giản, phân cấp thông tin rõ (banner → tìm kiếm nhanh → danh sách việc làm → tin tức → footer), tránh nhồi nhét nhiều khối cùng lúc.
- **Bắt buộc: mọi section đều phải có animation khi scroll vào viewport** (ví dụ fade-in + slide-up nhẹ). Dùng thư viện scroll-reveal nhẹ (ví dụ Framer Motion `whileInView`, hoặc CSS `IntersectionObserver` + Tailwind transition) — animation phải mượt, thời lượng ngắn (~300-500ms), không gây giật lag hay chậm trải nghiệm trên máy cấu hình thấp/mạng yếu. Tôn trọng `prefers-reduced-motion` cho người dùng tắt hiệu ứng chuyển động.

## Màu sắc (dựa theo ảnh tham khảo)
- **Primary (xanh dương thương hiệu)**: dùng cho header, nút CTA chính, link, badge điều hướng.
- **Accent (đỏ/cam)**: dùng có chủ đích cho nhãn "Hot", "Tuyển gấp", cảnh báo — không lạm dụng để giữ cảm giác chuyên nghiệp.
- **Nền**: trắng/xám rất nhạt cho nội dung chính, khối màu xanh đậm cho header/footer để tạo tương phản thương hiệu.
- **Text**: xám đậm/đen cho nội dung chính, đảm bảo tương phản đạt chuẩn WCAG AA tối thiểu.

Khi bắt đầu implement, trích xuất mã màu chính xác từ ảnh tham khảo và định nghĩa thành design tokens trong `app/globals.css` qua Tailwind v4 `@theme` (không hard-code màu rải rác trong component; **không tạo `tailwind.config.ts`** — Tailwind v4 không đọc file đó theo mặc định).

## Layout tham khảo từ ảnh
- Header cố định: logo + thanh tìm kiếm việc làm (từ khóa, khu vực, ngành nghề) + menu chính.
- Banner/slider giới thiệu nổi bật ở đầu trang.
- Danh sách tin tuyển dụng dạng card: tên vị trí, công ty, mức lương, khu vực, hạn nộp, badge "Hot" khi cần.
- Sidebar/danh mục lọc theo ngành nghề, khu vực.
- Khối tin tức/chính sách công ty dạng lưới ảnh + tiêu đề.
- Footer đầy đủ: thông tin liên hệ, mạng xã hội, sơ đồ site.

Đây là điểm khởi đầu tham khảo — không sao chép y nguyên bố cục của trang gốc, chỉ lấy cảm hứng về mức độ tối giản, cách phân nhóm thông tin và tỷ lệ trực quan phù hợp với lao động phổ thông.

## Yêu cầu bắt buộc — Đối chiếu thiết kế

**Phạm vi áp dụng: chỉ site công khai** (route `/`, `/viec-lam`, `/tin-tuc`, `/gioi-thieu`, `/lien-he`...). `vieclamhaiphong.net_.png` là ảnh tham khảo của một job board hướng khách/lao động — **không phải chuẩn đối chiếu cho khu vực nội bộ** `(internal)`/`/dashboard/*` (xem `feature-admin-dashboard.md`). Khu vực nội bộ có tiêu chí riêng: responsive từ 375px, không tràn ngang, vùng chạm ≥44px, layout Sidebar + Topbar — không cần giống ảnh tham khảo về màu/bố cục.

**Sau mỗi thay đổi lớn về UI ở site công khai** (thêm/sửa trang, layout, component chính, đổi màu/typography...), **bắt buộc**:

1. Chạy dev server, chụp screenshot màn hình đã thay đổi — chụp cả bản mobile (viewport ~375px) và desktop, vì đối tượng chính dùng di động.
2. So sánh trực tiếp với ảnh thiết kế gốc `vieclamhaiphong.net_.png` (bố cục, mật độ thông tin, tông màu, cỡ chữ, khoảng trắng).
3. Nêu rõ điểm giống/khác và điều chỉnh nếu lệch khỏi định hướng "tối giản, hiện đại, chuyên nghiệp, dễ dùng cho lao động phổ thông" đã mô tả ở trên.
4. Không báo cáo một thay đổi UI là "hoàn thành" nếu chưa thực hiện bước đối chiếu này.

"Thay đổi lớn" = thay đổi ảnh hưởng đến giao diện người dùng thấy được (trang mới, section mới, redesign component, đổi theme...); không áp dụng cho thay đổi thuần backend/logic không ảnh hưởng UI.
