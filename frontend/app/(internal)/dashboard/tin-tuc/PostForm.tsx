"use client";

import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/Button";
import { browserFetch } from "@/lib/api/client";
import type { components } from "@/lib/api/schema";

type PostAdminOutDTO = components["schemas"]["PostAdminOut"];

const TYPE_OPTIONS: { value: string; label: string }[] = [
  { value: "news", label: "Tin tức" },
  { value: "policy", label: "Chính sách" },
  { value: "guide", label: "Hướng dẫn" },
  { value: "scam_alert", label: "Cảnh báo lừa đảo" },
  { value: "event", label: "Sự kiện" },
];

const STATUS_OPTIONS: { value: string; label: string }[] = [
  { value: "draft", label: "Nháp (chưa hiển thị công khai)" },
  { value: "published", label: "Đã đăng (hiển thị công khai)" },
  { value: "archived", label: "Lưu trữ" },
];

const fieldClass =
  "min-h-11 w-full rounded-lg border border-border bg-white px-3 text-[16px] text-text outline-none focus:border-primary-500";
const labelClass = "flex flex-col gap-1.5 text-sm font-semibold text-text";

function stringOrNull(value: FormDataEntryValue | null): string | null {
  if (value === null) return null;
  const s = String(value).trim();
  return s === "" ? null : s;
}

export function PostForm({ initialPost }: { initialPost?: PostAdminOutDTO }) {
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const isEdit = Boolean(initialPost);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setPending(true);

    const form = new FormData(event.currentTarget);
    const payload = {
      title: String(form.get("title") ?? "").trim(),
      type: String(form.get("type") ?? "news"),
      excerpt: stringOrNull(form.get("excerpt")),
      content: stringOrNull(form.get("content")),
      cover_image_url: stringOrNull(form.get("cover_image_url")),
      status: String(form.get("status") ?? "draft"),
      meta_title: stringOrNull(form.get("meta_title")),
      meta_description: stringOrNull(form.get("meta_description")),
    };

    const res = isEdit
      ? await browserFetch(`/api/admin/posts/${initialPost!.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        })
      : await browserFetch("/api/admin/posts", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

    if (!res.ok) {
      setPending(false);
      setError(res.error);
      return;
    }
    // Full page load thay vì router.push + router.refresh — xem ghi chú tương tự
    // ở JobForm.tsx/CLAUDE.md.
    window.location.href = "/dashboard/tin-tuc";
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <label className={labelClass}>
        Tiêu đề *
        <input
          name="title"
          required
          minLength={3}
          maxLength={200}
          defaultValue={initialPost?.title}
          className={fieldClass}
        />
      </label>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className={labelClass}>
          Loại nội dung
          <select name="type" defaultValue={initialPost?.type ?? "news"} className={fieldClass}>
            {TYPE_OPTIONS.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>
        </label>
        <label className={labelClass}>
          Trạng thái
          <select
            name="status"
            defaultValue={initialPost?.status ?? "draft"}
            className={fieldClass}
          >
            {STATUS_OPTIONS.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>
        </label>
      </div>

      <label className={labelClass}>
        Tóm tắt (hiển thị ở danh sách)
        <textarea
          name="excerpt"
          rows={2}
          maxLength={500}
          defaultValue={initialPost?.excerpt ?? undefined}
          className={`${fieldClass} min-h-[unset] py-2`}
        />
      </label>

      <label className={labelClass}>
        Nội dung đầy đủ
        <textarea
          name="content"
          rows={8}
          defaultValue={initialPost?.content ?? undefined}
          className={`${fieldClass} min-h-[unset] py-2`}
        />
      </label>

      <label className={labelClass}>
        URL ảnh bìa
        <input
          name="cover_image_url"
          maxLength={500}
          defaultValue={initialPost?.cover_image_url ?? undefined}
          placeholder="https://..."
          className={fieldClass}
        />
      </label>

      <details className="rounded-lg border border-border p-3">
        <summary className="cursor-pointer text-sm font-semibold text-text-muted">
          SEO nâng cao (không bắt buộc)
        </summary>
        <div className="mt-3 flex flex-col gap-4">
          <label className={labelClass}>
            Tiêu đề SEO
            <input
              name="meta_title"
              maxLength={200}
              defaultValue={initialPost?.meta_title ?? undefined}
              className={fieldClass}
            />
          </label>
          <label className={labelClass}>
            Mô tả SEO
            <input
              name="meta_description"
              maxLength={300}
              defaultValue={initialPost?.meta_description ?? undefined}
              className={fieldClass}
            />
          </label>
        </div>
      </details>

      {error ? <p className="text-sm font-semibold text-accent-dark">{error}</p> : null}

      <Button type="submit" disabled={pending}>
        {pending ? "Đang lưu..." : isEdit ? "Lưu thay đổi" : "Đăng bài"}
      </Button>
    </form>
  );
}
