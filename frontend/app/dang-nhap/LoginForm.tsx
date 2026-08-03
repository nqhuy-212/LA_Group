"use client";

import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/Button";
import { browserFetch } from "@/lib/api/client";

export function LoginForm({ nextPath }: { nextPath: string }) {
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setPending(true);

    const form = new FormData(event.currentTarget);
    const res = await browserFetch<{ ok: boolean }>("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: form.get("email"),
        password: form.get("password"),
      }),
    });

    if (!res.ok) {
      setPending(false);
      setError(res.error);
      return;
    }
    // Cố tình dùng full page load (không phải router.push + router.refresh của
    // App Router) — ngay sau khi vừa nhận cookie mới, router.push tới route yêu
    // cầu đăng nhập có thể dính Router Cache cũ (đã fetch/redirect lúc chưa có
    // cookie), khiến điều hướng "không có tác dụng" dù login đã thành công. Full
    // navigation luôn đọc cookie mới nhất, không phụ thuộc cache phía client.
    window.location.href = nextPath;
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <label className="flex flex-col gap-1.5">
        <span className="text-sm font-semibold text-text">Email</span>
        <input
          type="email"
          name="email"
          required
          autoComplete="username"
          className="min-h-11 rounded-lg border border-border px-3 text-[16px] text-text outline-none focus:border-primary-500"
        />
      </label>
      <label className="flex flex-col gap-1.5">
        <span className="text-sm font-semibold text-text">Mật khẩu</span>
        <input
          type="password"
          name="password"
          required
          autoComplete="current-password"
          className="min-h-11 rounded-lg border border-border px-3 text-[16px] text-text outline-none focus:border-primary-500"
        />
      </label>

      {error ? <p className="text-sm font-semibold text-accent-dark">{error}</p> : null}

      <Button type="submit" block disabled={pending}>
        {pending ? "Đang đăng nhập..." : "Đăng nhập"}
      </Button>
    </form>
  );
}
