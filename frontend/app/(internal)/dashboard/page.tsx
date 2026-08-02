import Link from "next/link";
import { IconBriefcase, IconFileText } from "@/components/ui/icons";

export const metadata = { title: "Tổng quan | LA Group nội bộ" };

// Dashboard tổng quan có số liệu/biểu đồ thật là phạm vi P7 (xem docs/PLAN.md) —
// trang này là điểm vào tạm thời cho P5, chỉ có lối tắt tới 2 khu vực quản lý nội
// dung đã có (Việc làm/Tin tức), tránh hứa hẹn số liệu chưa tồn tại.
export default function DashboardHomePage() {
  return (
    <div>
      <h1 className="mb-1 text-lg font-extrabold text-text">Tổng quan</h1>
      <p className="mb-6 text-sm text-text-muted">
        Số liệu thống kê chi tiết (ứng viên mới, theo vùng, theo độ tuổi...) sẽ có ở giai đoạn
        tiếp theo. Hiện tại bạn có thể quản lý tin tuyển dụng và tin tức/chính sách bên dưới.
      </p>

      <div className="grid gap-4 sm:grid-cols-2">
        <Link
          href="/dashboard/viec-lam"
          className="flex items-center gap-3 rounded-xl border border-border bg-white p-5 shadow-brand transition-colors hover:border-primary-300"
        >
          <span className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-lg bg-primary-100 text-primary-700">
            <IconBriefcase className="h-5 w-5" />
          </span>
          <span>
            <span className="block text-sm font-bold text-text">Việc làm</span>
            <span className="block text-xs text-text-muted">Đăng tin, sửa, ẩn/xoá tin</span>
          </span>
        </Link>

        <Link
          href="/dashboard/tin-tuc"
          className="flex items-center gap-3 rounded-xl border border-border bg-white p-5 shadow-brand transition-colors hover:border-primary-300"
        >
          <span className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-lg bg-primary-100 text-primary-700">
            <IconFileText className="h-5 w-5" />
          </span>
          <span>
            <span className="block text-sm font-bold text-text">Tin tức & Chính sách</span>
            <span className="block text-xs text-text-muted">Đăng bài, sửa, ẩn/xoá bài</span>
          </span>
        </Link>
      </div>
    </div>
  );
}
