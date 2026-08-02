import { redirect } from "next/navigation";
import { InternalShell } from "@/components/internal/InternalShell";
import { getCurrentUser } from "@/lib/auth/current-user";

// Lớp chặn thứ 2 (defense-in-depth) — lớp 1 là frontend/proxy.ts (chỉ kiểm tra
// cookie có tồn tại, "optimistic check" theo khuyến nghị Next.js), lớp thật sự bắt
// buộc là `Depends(get_current_user)` ở từng endpoint FastAPI. Gọi thẳng
// `/api/auth/me` ở đây xác nhận cookie còn hợp lệ (chưa hết hạn/bị revoke) trước
// khi render Sidebar — một cookie tồn tại nhưng đã hết hạn sẽ bị chặn ở đây thay vì
// hiện giao diện rỗng.
export default async function InternalLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/dang-nhap");
  }

  return <InternalShell user={user}>{children}</InternalShell>;
}
