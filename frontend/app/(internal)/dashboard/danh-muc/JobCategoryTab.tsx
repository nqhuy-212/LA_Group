"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { browserFetch } from "@/lib/api/client";
import type { components } from "@/lib/api/schema";

type JobCategoryAdminOutDTO = components["schemas"]["JobCategoryAdminOut"];

const fieldClass =
  "min-h-11 w-full rounded-lg border border-border bg-white px-3 text-[16px] text-text outline-none focus:border-primary-500";
const labelClass = "flex flex-col gap-1.5 text-sm font-semibold text-text";

export function JobCategoryTab({
  items,
  canManage,
  canDelete,
}: {
  items: JobCategoryAdminOutDTO[];
  canManage: boolean;
  canDelete: boolean;
}) {
  const router = useRouter();
  const createRef = useRef<HTMLDialogElement>(null);
  const editRef = useRef<HTMLDialogElement>(null);
  const [editing, setEditing] = useState<JobCategoryAdminOutDTO | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  // <dialog> native cần showModal()/close() gọi tay để có backdrop + focus-trap +
  // Esc-to-close thật — chỉ thêm attribute `open` không đủ (render như block
  // thường, không phải modal). Xem TaxonomySelect.tsx cho cùng pattern.
  useEffect(() => {
    if (editing) editRef.current?.showModal();
    else editRef.current?.close();
  }, [editing]);

  async function handleCreate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setPending(true);
    const form = new FormData(event.currentTarget);
    const res = await browserFetch("/api/admin/job-categories", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: String(form.get("name") ?? "").trim() }),
    });
    setPending(false);
    if (!res.ok) {
      setError(res.error);
      return;
    }
    createRef.current?.close();
    router.refresh();
  }

  async function handleUpdate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!editing) return;
    setError(null);
    setPending(true);
    const form = new FormData(event.currentTarget);
    const res = await browserFetch(`/api/admin/job-categories/${editing.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: String(form.get("name") ?? "").trim(),
        sort_order: Number(form.get("sort_order") ?? 0),
        is_active: form.get("is_active") === "on",
      }),
    });
    setPending(false);
    if (!res.ok) {
      setError(res.error);
      return;
    }
    setEditing(null);
    router.refresh();
  }

  async function handleDelete(item: JobCategoryAdminOutDTO) {
    if (!confirm(`Xoá ngành nghề "${item.name}"? Không thể hoàn tác.`)) return;
    const res = await browserFetch(`/api/admin/job-categories/${item.id}`, { method: "DELETE" });
    if (!res.ok) {
      alert(`Không xoá được: ${res.error}`);
      return;
    }
    router.refresh();
  }

  return (
    <div>
      {canManage ? (
        <button
          type="button"
          onClick={() => createRef.current?.showModal()}
          className="mb-3 flex min-h-11 items-center rounded-lg bg-primary-600 px-4 text-sm font-bold text-white shadow-brand hover:bg-primary-700"
        >
          + Thêm ngành nghề
        </button>
      ) : null}

      {items.length === 0 ? (
        <p className="rounded-xl border border-border bg-white p-5 text-sm text-text-muted">
          Chưa có ngành nghề nào.
        </p>
      ) : (
        <div className="flex flex-col gap-2">
          {items.map((item) => (
            <div
              key={item.id}
              className="flex flex-col gap-2 rounded-xl border border-border bg-white p-4 shadow-brand sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-sm font-bold text-text">{item.name}</span>
                  {!item.is_active ? (
                    <span className="rounded-full bg-bg px-2 py-0.5 text-[11px] font-bold text-text-muted">
                      Đã ẩn
                    </span>
                  ) : null}
                </div>
                <p className="mt-0.5 text-xs text-text-muted">
                  {item.slug} · {item.job_count} tin đang tham chiếu
                </p>
              </div>

              {canManage ? (
                <div className="flex flex-shrink-0 items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setError(null);
                      setEditing(item);
                    }}
                    className="flex min-h-11 items-center rounded-lg border border-border px-3 text-sm font-semibold text-primary-700 hover:bg-primary-50"
                  >
                    Sửa
                  </button>
                  {canDelete ? (
                    <button
                      type="button"
                      onClick={() => handleDelete(item)}
                      className="flex min-h-11 items-center rounded-lg border border-accent/30 px-3 text-sm font-semibold text-accent-dark hover:bg-accent/10"
                    >
                      Xoá
                    </button>
                  ) : null}
                </div>
              ) : null}
            </div>
          ))}
        </div>
      )}

      <dialog
        ref={createRef}
        className="w-full max-w-sm rounded-xl border border-border p-0 shadow-brand-lg backdrop:bg-black/40"
        onClose={() => setError(null)}
      >
        <form onSubmit={handleCreate} className="flex flex-col gap-4 p-5">
          <h2 className="text-base font-extrabold text-text">Thêm ngành nghề</h2>
          <label className={labelClass}>
            Tên ngành nghề
            <input name="name" required className={fieldClass} />
          </label>
          {error ? <p className="text-sm font-semibold text-accent-dark">{error}</p> : null}
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => createRef.current?.close()}
              className="flex min-h-11 items-center rounded-lg border border-border px-4 text-sm font-semibold text-text-muted hover:bg-bg"
            >
              Huỷ
            </button>
            <button
              type="submit"
              disabled={pending}
              className="flex min-h-11 items-center rounded-lg bg-primary-600 px-4 text-sm font-bold text-white shadow-brand hover:bg-primary-700 disabled:opacity-60"
            >
              {pending ? "Đang lưu..." : "Thêm"}
            </button>
          </div>
        </form>
      </dialog>

      <dialog
        ref={editRef}
        className="w-full max-w-sm rounded-xl border border-border p-0 shadow-brand-lg backdrop:bg-black/40"
        onClose={() => setEditing(null)}
      >
        {editing ? (
          <form onSubmit={handleUpdate} className="flex flex-col gap-4 p-5">
            <h2 className="text-base font-extrabold text-text">Sửa ngành nghề</h2>
            <label className={labelClass}>
              Tên ngành nghề
              <input name="name" required defaultValue={editing.name} className={fieldClass} />
            </label>
            <label className={labelClass}>
              Thứ tự hiển thị
              <input
                type="number"
                name="sort_order"
                defaultValue={editing.sort_order}
                className={fieldClass}
              />
            </label>
            <label className="flex min-h-11 items-center gap-2 text-sm font-semibold text-text">
              <input
                type="checkbox"
                name="is_active"
                defaultChecked={editing.is_active}
                className="h-5 w-5"
              />
              Hiển thị công khai
            </label>
            {error ? <p className="text-sm font-semibold text-accent-dark">{error}</p> : null}
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => editRef.current?.close()}
                className="flex min-h-11 items-center rounded-lg border border-border px-4 text-sm font-semibold text-text-muted hover:bg-bg"
              >
                Huỷ
              </button>
              <button
                type="submit"
                disabled={pending}
                className="flex min-h-11 items-center rounded-lg bg-primary-600 px-4 text-sm font-bold text-white shadow-brand hover:bg-primary-700 disabled:opacity-60"
              >
                {pending ? "Đang lưu..." : "Lưu"}
              </button>
            </div>
          </form>
        ) : null}
      </dialog>
    </div>
  );
}
