"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { browserFetch } from "@/lib/api/client";
import type { components } from "@/lib/api/schema";

type ApplicationAdminOutDTO = components["schemas"]["ApplicationAdminOut"];
type UserAdminOutDTO = components["schemas"]["UserAdminOut"];

const STATUS_OPTIONS: { value: string; label: string }[] = [
  { value: "new", label: "Mới" },
  { value: "contacted", label: "Đã liên hệ" },
  { value: "interviewing", label: "Đang phỏng vấn" },
  { value: "hired", label: "Đã tuyển" },
  { value: "rejected", label: "Từ chối" },
];

export function ApplicationRowActions({
  application,
  assignees,
  canPurge,
}: {
  application: ApplicationAdminOutDTO;
  assignees: UserAdminOutDTO[];
  canPurge: boolean;
}) {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  async function patch(body: Record<string, unknown>) {
    setPending(true);
    const res = await browserFetch(`/api/admin/applications/${application.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    setPending(false);
    if (res.ok) {
      router.refresh();
    } else {
      alert(`Không cập nhật được: ${res.error}`);
    }
  }

  async function handlePurge() {
    if (
      !confirm(
        "Xoá dữ liệu cá nhân của hồ sơ này theo yêu cầu (NĐ13/2023)? Không thể hoàn tác.",
      )
    ) {
      return;
    }
    setPending(true);
    const res = await browserFetch(`/api/admin/applications/${application.id}/purge`, {
      method: "POST",
    });
    setPending(false);
    if (res.ok) {
      router.refresh();
    } else {
      alert(`Không xoá được: ${res.error}`);
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-2 border-t border-border pt-3">
      <select
        value={application.status}
        disabled={pending}
        onChange={(e) => patch({ status: e.target.value })}
        className="min-h-11 rounded-lg border border-border px-2 text-xs font-semibold"
      >
        {STATUS_OPTIONS.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>

      <select
        value={application.assigned_to_id ?? ""}
        disabled={pending}
        onChange={(e) =>
          patch({ assigned_to_id: e.target.value ? Number(e.target.value) : null })
        }
        className="min-h-11 rounded-lg border border-border px-2 text-xs font-semibold"
      >
        <option value="">Chưa gán</option>
        {assignees.map((u) => (
          <option key={u.id} value={u.id}>
            {u.email}
          </option>
        ))}
      </select>

      {application.has_cv ? (
        <a
          href={`/api/admin/applications/${application.id}/cv`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex min-h-11 items-center rounded-lg border border-border px-3 text-xs font-semibold text-primary-700 hover:bg-primary-50"
        >
          Xem CV
        </a>
      ) : null}

      {canPurge && !application.purged_at ? (
        <button
          type="button"
          onClick={handlePurge}
          disabled={pending}
          className="flex min-h-11 items-center rounded-lg border border-accent/30 px-3 text-xs font-semibold text-accent-dark hover:bg-accent/10 disabled:opacity-50"
        >
          Xoá dữ liệu
        </button>
      ) : null}
    </div>
  );
}
