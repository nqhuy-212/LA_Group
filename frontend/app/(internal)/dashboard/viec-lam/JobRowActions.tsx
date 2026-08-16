"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { browserFetch } from "@/lib/api/client";

export function JobRowActions({
  jobId,
  jobSlug,
  jobStatus,
  canDelete,
}: {
  jobId: number;
  jobSlug: string;
  jobStatus: string;
  canDelete: boolean;
}) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  // API công khai chỉ trả 404 khi status === "draft" (published/closed/archived
  // đều xem được — xem app/api/v1/public/jobs.py get_job).
  const isPublic = jobStatus !== "draft";

  async function handleDelete() {
    if (!confirm("Xoá tin tuyển dụng này? Không thể hoàn tác.")) return;
    setPending(true);
    const res = await browserFetch(`/api/admin/jobs/${jobId}`, { method: "DELETE" });
    setPending(false);
    if (res.ok) {
      router.refresh();
    } else {
      alert(`Không xoá được: ${res.error}`);
    }
  }

  return (
    <div className="flex flex-shrink-0 flex-wrap items-center justify-end gap-2">
      {isPublic ? (
        <Link
          href={`/viec-lam/${jobSlug}`}
          target="_blank"
          rel="noopener"
          className="flex min-h-11 items-center rounded-lg border border-border px-3 text-sm font-semibold text-primary-700 hover:bg-primary-50"
        >
          Xem trên web
        </Link>
      ) : (
        <span className="px-1 text-xs font-semibold text-text-muted">Chưa công khai</span>
      )}
      <Link
        href={`/dashboard/viec-lam/${jobId}`}
        className="flex min-h-11 items-center rounded-lg border border-border px-3 text-sm font-semibold text-primary-700 hover:bg-primary-50"
      >
        Sửa
      </Link>
      {canDelete ? (
        <button
          type="button"
          onClick={handleDelete}
          disabled={pending}
          className="flex min-h-11 items-center rounded-lg border border-accent/30 px-3 text-sm font-semibold text-accent-dark hover:bg-accent/10 disabled:opacity-50"
        >
          Xoá
        </button>
      ) : null}
    </div>
  );
}
