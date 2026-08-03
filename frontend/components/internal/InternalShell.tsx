"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, type ReactNode } from "react";
import {
  IconBriefcase,
  IconClose,
  IconFileText,
  IconLayoutDashboard,
  IconLogout,
  IconMenu,
  IconUsers,
} from "@/components/ui/icons";
import { browserFetch } from "@/lib/api/client";

// Tiêu chí thiết kế cho khu vực nội bộ KHÁC site công khai (đã sửa ở
// design-system.md mục A6): responsive từ 375px, không tràn ngang, vùng chạm
// ≥44px, layout Sidebar + Topbar — không cần đối chiếu vieclamhaiphong.net_.png.

const NAV_ITEMS = [
  { href: "/dashboard", label: "Tổng quan", icon: IconLayoutDashboard },
  { href: "/dashboard/viec-lam", label: "Việc làm", icon: IconBriefcase },
  { href: "/dashboard/ung-vien", label: "Ứng viên", icon: IconUsers },
  { href: "/dashboard/tin-tuc", label: "Tin tức & Chính sách", icon: IconFileText },
];

const ROLE_LABEL: Record<string, string> = {
  admin: "Quản trị viên",
  manager: "Quản lý",
  staff: "Nhân viên",
};

export function InternalShell({
  user,
  children,
}: {
  user: { email: string; role: string };
  children: ReactNode;
}) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();

  async function handleLogout() {
    await browserFetch("/api/auth/logout", { method: "POST" });
    router.push("/dang-nhap");
    router.refresh();
  }

  function isActive(href: string) {
    return href === "/dashboard" ? pathname === href : pathname.startsWith(href);
  }

  const navList = (
    <nav className="flex flex-col gap-1 p-3">
      {NAV_ITEMS.map(({ href, label, icon: Icon }) => (
        <Link
          key={href}
          href={href}
          onClick={() => setMobileOpen(false)}
          className={`flex min-h-11 items-center gap-3 rounded-lg px-3 text-sm font-semibold transition-colors ${
            isActive(href)
              ? "bg-primary-100 text-primary-800"
              : "text-text-muted hover:bg-bg hover:text-text"
          }`}
        >
          <Icon className="h-5 w-5 flex-shrink-0" />
          {label}
        </Link>
      ))}
    </nav>
  );

  return (
    <div className="flex min-h-screen bg-bg">
      {/* Sidebar — cố định trên desktop, off-canvas trên mobile */}
      <aside className="hidden w-64 flex-shrink-0 border-r border-border bg-white md:block">
        <div className="flex h-16 items-center border-b border-border px-4 text-sm font-extrabold text-primary-800">
          LA Group — Nội bộ
        </div>
        {navList}
      </aside>

      {mobileOpen ? (
        <div className="fixed inset-0 z-40 md:hidden">
          <button
            type="button"
            aria-label="Đóng menu"
            className="absolute inset-0 bg-black/40"
            onClick={() => setMobileOpen(false)}
          />
          <aside className="absolute left-0 top-0 h-full w-64 bg-white shadow-brand-lg">
            <div className="flex h-16 items-center justify-between border-b border-border px-4">
              <span className="text-sm font-extrabold text-primary-800">LA Group — Nội bộ</span>
              <button
                type="button"
                aria-label="Đóng menu"
                className="flex h-11 w-11 items-center justify-center text-text-muted"
                onClick={() => setMobileOpen(false)}
              >
                <IconClose className="h-5 w-5" />
              </button>
            </div>
            {navList}
          </aside>
        </div>
      ) : null}

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-16 flex-shrink-0 items-center justify-between border-b border-border bg-white px-4">
          <button
            type="button"
            aria-label="Mở menu"
            className="flex h-11 w-11 items-center justify-center text-text-muted md:hidden"
            onClick={() => setMobileOpen(true)}
          >
            <IconMenu className="h-5 w-5" />
          </button>

          <div className="hidden md:block" />

          <div className="flex items-center gap-3">
            <div className="text-right leading-tight">
              <p className="text-sm font-semibold text-text">{user.email}</p>
              <p className="text-xs text-text-muted">
                {ROLE_LABEL[user.role] ?? user.role}
              </p>
            </div>
            <button
              type="button"
              onClick={handleLogout}
              className="flex min-h-11 items-center gap-1.5 rounded-lg border border-border px-3 text-sm font-semibold text-text-muted hover:bg-bg"
            >
              <IconLogout className="h-4 w-4" />
              <span className="hidden sm:inline">Đăng xuất</span>
            </button>
          </div>
        </header>

        <main className="flex-1 overflow-x-hidden p-4 md:p-6">{children}</main>
      </div>
    </div>
  );
}
