import Link from "next/link";
import { formatDate, formatPhone } from "@/lib/format";
import { serverFetchAuthed } from "@/lib/api/server-auth-client";
import { getCurrentUser } from "@/lib/auth/current-user";
import type { components } from "@/lib/api/schema";
import { ApplicationRowActions } from "./ApplicationRowActions";

type PageResponseApplicationDTO = components["schemas"]["PageResponse_ApplicationAdminOut_"];
type UserAdminOutDTO = components["schemas"]["UserAdminOut"];

export const metadata = { title: "Ứng viên | LA Group nội bộ" };

const STATUS_LABEL: Record<string, string> = {
  new: "Mới",
  contacted: "Đã liên hệ",
  interviewing: "Đang phỏng vấn",
  hired: "Đã tuyển",
  rejected: "Từ chối",
};

const STATUS_CLASS: Record<string, string> = {
  new: "bg-primary-100 text-primary-800",
  contacted: "bg-bg text-text-muted",
  interviewing: "bg-accent/10 text-accent-dark",
  hired: "bg-green-100 text-green-800",
  rejected: "bg-bg text-text-muted",
};

const GENDER_LABEL: Record<string, string> = { male: "Nam", female: "Nữ", other: "Khác" };

type SearchParams = {
  status?: string;
  q?: string;
  date_from?: string;
  date_to?: string;
  page?: string;
};

function buildQuery(searchParams: SearchParams, extra: Record<string, string> = {}): string {
  const params = new URLSearchParams();
  if (searchParams.status) params.set("status", searchParams.status);
  if (searchParams.q) params.set("q", searchParams.q);
  if (searchParams.date_from) params.set("date_from", searchParams.date_from);
  if (searchParams.date_to) params.set("date_to", searchParams.date_to);
  for (const [key, value] of Object.entries(extra)) params.set(key, value);
  return params.toString();
}

export default async function AdminApplicationListPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;
  const pageNum = Number(params.page) > 0 ? Number(params.page) : 1;
  const filterQuery = buildQuery(params);
  const listQuery = buildQuery(params, { page: String(pageNum), page_size: "20" });

  const [user, res, usersRes] = await Promise.all([
    getCurrentUser(),
    serverFetchAuthed<PageResponseApplicationDTO>(`/api/admin/applications?${listQuery}`),
    serverFetchAuthed<UserAdminOutDTO[]>("/api/admin/users"),
  ]);
  const canExport = user?.role === "admin" || user?.role === "manager";
  const canPurge = user?.role === "admin" || user?.role === "manager";
  const assignees = usersRes.ok ? usersRes.data : [];

  const items = res.ok ? res.data.items : [];
  const total = res.ok ? res.data.total : 0;
  const pageSize = res.ok ? res.data.page_size : 20;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  return (
    <div>
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-lg font-extrabold text-text">Ứng viên ({total})</h1>
        {canExport ? (
          <a
            href={`/api/admin/applications/export.csv?${filterQuery}`}
            className="flex min-h-11 items-center rounded-lg border border-border bg-white px-4 text-sm font-bold text-primary-700 hover:bg-primary-50"
          >
            Xuất CSV
          </a>
        ) : null}
      </div>

      <form className="mb-5 flex flex-wrap gap-3 rounded-xl border border-border bg-white p-4 shadow-brand">
        <input
          type="search"
          name="q"
          defaultValue={params.q ?? ""}
          placeholder="Tên, SĐT, mã hồ sơ..."
          className="min-h-11 flex-1 min-w-[160px] rounded-lg border border-border px-3 text-sm"
        />
        <select
          name="status"
          defaultValue={params.status ?? ""}
          className="min-h-11 rounded-lg border border-border px-3 text-sm"
        >
          <option value="">Tất cả trạng thái</option>
          {Object.entries(STATUS_LABEL).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
        <input
          type="date"
          name="date_from"
          defaultValue={params.date_from ?? ""}
          className="min-h-11 rounded-lg border border-border px-3 text-sm"
        />
        <input
          type="date"
          name="date_to"
          defaultValue={params.date_to ?? ""}
          className="min-h-11 rounded-lg border border-border px-3 text-sm"
        />
        <button
          type="submit"
          className="min-h-11 rounded-lg bg-primary-700 px-4 text-sm font-bold text-white hover:bg-primary-800"
        >
          Lọc
        </button>
      </form>

      {!res.ok ? (
        <p className="rounded-xl border border-border bg-white p-5 text-sm text-text-muted">
          Không tải được danh sách ứng viên: {res.error}
        </p>
      ) : items.length === 0 ? (
        <p className="rounded-xl border border-border bg-white p-5 text-sm text-text-muted">
          Không có hồ sơ nào khớp bộ lọc.
        </p>
      ) : (
        <div className="flex flex-col gap-3">
          {items.map((application) => (
            <div
              key={application.id}
              className="flex flex-col gap-3 rounded-xl border border-border bg-white p-4 shadow-brand"
            >
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="text-sm font-bold text-text">{application.full_name}</h2>
                    <span
                      className={`rounded-full px-2 py-0.5 text-[11px] font-bold ${STATUS_CLASS[application.status] ?? ""}`}
                    >
                      {STATUS_LABEL[application.status] ?? application.status}
                    </span>
                    {application.purged_at ? (
                      <span className="rounded-full bg-bg px-2 py-0.5 text-[11px] font-bold text-text-muted">
                        Đã xoá PII
                      </span>
                    ) : null}
                  </div>
                  <p className="mt-0.5 text-xs text-text-muted">
                    {application.reference_code} · {application.job_title ?? "Không gắn tin"} ·{" "}
                    {formatPhone(application.phone)}
                  </p>
                  <p className="mt-0.5 text-xs text-text-muted">
                    {application.age != null ? `${application.age} tuổi` : "Chưa rõ tuổi"}
                    {application.gender ? ` · ${GENDER_LABEL[application.gender] ?? application.gender}` : ""}
                    {" · "}
                    {application.province_name ?? application.hometown_text ?? "Chưa rõ quê quán"}
                    {" · Nộp "}
                    {formatDate(application.created_at)}
                  </p>
                </div>
              </div>

              <ApplicationRowActions
                application={application}
                assignees={assignees}
                canPurge={canPurge}
              />
            </div>
          ))}
        </div>
      )}

      {totalPages > 1 ? (
        <div className="mt-5 flex items-center justify-center gap-3 text-sm">
          {pageNum > 1 ? (
            <Link
              href={`/dashboard/ung-vien?${buildQuery(params, { page: String(pageNum - 1) })}`}
              className="font-bold text-primary-700"
            >
              ← Trước
            </Link>
          ) : null}
          <span className="text-text-muted">
            Trang {pageNum}/{totalPages}
          </span>
          {pageNum < totalPages ? (
            <Link
              href={`/dashboard/ung-vien?${buildQuery(params, { page: String(pageNum + 1) })}`}
              className="font-bold text-primary-700"
            >
              Sau →
            </Link>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
