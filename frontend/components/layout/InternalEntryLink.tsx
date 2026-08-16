"use client";

import Link from "next/link";
import { useSyncExternalStore } from "react";

const SESSION_HINT_COOKIE = "has_session";

function hasSessionCookie(): boolean {
  return document.cookie
    .split(";")
    .some((c) => c.trim().startsWith(`${SESSION_HINT_COOKIE}=`));
}

function subscribe() {
  // Cookie này chỉ đổi khi đăng nhập/đăng xuất, cả hai đều là full page load
  // (xem LoginForm.tsx/InternalShell.tsx handleLogout) — không có sự kiện nào
  // để lắng nghe giữa các lần mount, no-op là đủ.
  return () => {};
}

function getServerSnapshot(): boolean {
  return false;
}

/**
 * Link vào khu vực nội bộ, tự đổi nhãn theo trạng thái đăng nhập — đọc cookie
 * `has_session` (không httpOnly, xem backend/app/api/v1/auth.py) qua
 * `useSyncExternalStore` thay vì `cookies()` ở Server Component, để "/" và các
 * trang public khác giữ được static prerender (hàng nghìn khách vãng lai không
 * nên trả giá hiệu năng chỉ để phục vụ vài nhân viên nội bộ — xem docs/DECISIONS.md).
 *
 * `getServerSnapshot` cố định trả `false` để khớp HTML server (chưa đăng nhập),
 * tránh hydration mismatch; React tự đối chiếu lại bằng snapshot thật ngay sau
 * khi mount. Cookie hết hạn/sai vẫn thoái lui êm: proxy.ts tự chuyển về
 * /dang-nhap khi thiếu access_token thật.
 */
export function InternalEntryLink({
  className,
  onNavigate,
}: {
  className?: string;
  onNavigate?: () => void;
}) {
  const loggedIn = useSyncExternalStore(subscribe, hasSessionCookie, getServerSnapshot);

  return (
    <Link href={loggedIn ? "/dashboard" : "/dang-nhap"} className={className} onClick={onNavigate}>
      {loggedIn ? "Trang quản trị" : "Đăng nhập"}
    </Link>
  );
}
