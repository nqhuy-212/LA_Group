import { cookies } from "next/headers";
import { serverFetch, type ApiResult, type ServerFetchInit } from "./client";

/**
 * Như `serverFetch`, nhưng cho endpoint yêu cầu đăng nhập (`/api/admin/...`,
 * `/api/auth/me`) gọi từ Server Component của khu vực nội bộ `(internal)`. Server
 * Component chạy trên máy chủ Next.js nên `fetch` của nó KHÔNG tự động kèm cookie
 * của trình duyệt (khác `INTERNAL_API_URL` là một origin khác hẳn) — phải tự đọc
 * cookie đến từ request gốc qua `next/headers` rồi gắn tay vào header `Cookie`.
 * Luôn `no-store`: dữ liệu gắn với một người dùng cụ thể, không được cache dùng
 * chung giữa các phiên khác nhau.
 *
 * Tách riêng khỏi `lib/api/client.ts` (thay vì gộp chung) vì `next/headers` chỉ
 * được phép import ở Server Component — gộp chung sẽ kéo nó vào bundle của mọi
 * Client Component nào lỡ import `browserFetch` từ cùng file, làm build thất bại.
 */
export async function serverFetchAuthed<T>(
  path: string,
  init?: ServerFetchInit,
): Promise<ApiResult<T>> {
  const cookieHeader = (await cookies()).toString();
  return serverFetch<T>(path, {
    ...init,
    headers: { ...(init?.headers ?? {}), Cookie: cookieHeader },
    revalidate: false,
  });
}
