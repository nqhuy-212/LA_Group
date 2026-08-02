import type { Metadata } from "next";
import { LoginForm } from "./LoginForm";

export const metadata: Metadata = {
  title: "Đăng nhập nội bộ | LA Group",
  robots: { index: false, follow: false },
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const { next } = await searchParams;
  // Chỉ chấp nhận path nội bộ bắt đầu bằng "/" — chặn open-redirect nếu ai đó
  // truyền `?next=https://evil.example` từ ngoài vào.
  const nextPath = next && next.startsWith("/") ? next : "/dashboard";

  return (
    <div className="flex min-h-screen items-center justify-center bg-bg px-4">
      <div className="w-full max-w-sm rounded-xl border border-border bg-white p-6 shadow-brand">
        <h1 className="mb-1 text-lg font-extrabold text-primary-800">Đăng nhập nội bộ</h1>
        <p className="mb-6 text-sm text-text-muted">
          Dành cho nhân viên/quản lý LA Group. Người lao động không cần đăng nhập để xem tin hoặc
          dùng chatbot.
        </p>
        <LoginForm nextPath={nextPath} />
      </div>
    </div>
  );
}
