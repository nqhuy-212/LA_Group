import Link from "next/link";
import { ButtonLink } from "@/components/ui/Button";
import { serverFetchAuthed } from "@/lib/api/server-auth-client";
import { getCurrentUser } from "@/lib/auth/current-user";
import type { components } from "@/lib/api/schema";
import { JobRowActions } from "./JobRowActions";

type PageResponseJobAdminOutDTO = components["schemas"]["PageResponse_JobAdminOut_"];

const STATUS_LABEL: Record<string, string> = {
  draft: "Nháp",
  published: "Đang tuyển",
  closed: "Đã đóng",
  archived: "Lưu trữ",
};

const STATUS_CLASS: Record<string, string> = {
  draft: "bg-bg text-text-muted",
  published: "bg-primary-100 text-primary-800",
  closed: "bg-accent/10 text-accent-dark",
  archived: "bg-bg text-text-muted",
};

export const metadata = { title: "Việc làm | LA Group nội bộ" };

export default async function AdminJobListPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const { page } = await searchParams;
  const pageNum = Number(page) > 0 ? Number(page) : 1;

  const [user, res] = await Promise.all([
    getCurrentUser(),
    serverFetchAuthed<PageResponseJobAdminOutDTO>(
      `/api/admin/jobs?page=${pageNum}&page_size=20`,
    ),
  ]);
  const canDelete = user?.role === "admin" || user?.role === "manager";

  const items = res.ok ? res.data.items : [];
  const total = res.ok ? res.data.total : 0;
  const pageSize = res.ok ? res.data.page_size : 20;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  return (
    <div>
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-lg font-extrabold text-text">Việc làm ({total})</h1>
        <ButtonLink href="/dashboard/viec-lam/moi">+ Đăng tin mới</ButtonLink>
      </div>

      {!res.ok ? (
        <p className="rounded-xl border border-border bg-white p-5 text-sm text-text-muted">
          Không tải được danh sách tin tuyển dụng: {res.error}
        </p>
      ) : items.length === 0 ? (
        <p className="rounded-xl border border-border bg-white p-5 text-sm text-text-muted">
          Chưa có tin tuyển dụng nào.
        </p>
      ) : (
        <div className="flex flex-col gap-3">
          {items.map((job) => (
            <div
              key={job.id}
              className="flex flex-col gap-3 rounded-xl border border-border bg-white p-4 shadow-brand sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="text-sm font-bold text-text">{job.title}</h2>
                  <span
                    className={`rounded-full px-2 py-0.5 text-[11px] font-bold ${STATUS_CLASS[job.status] ?? ""}`}
                  >
                    {STATUS_LABEL[job.status] ?? job.status}
                  </span>
                  {job.is_hot ? (
                    <span className="rounded-full bg-accent px-2 py-0.5 text-[11px] font-extrabold text-white">
                      HOT
                    </span>
                  ) : null}
                </div>
                <p className="mt-0.5 text-xs text-text-muted">
                  {job.company_name} · {job.category_name}
                  {job.industrial_park_name ? ` · ${job.industrial_park_name}` : ""}
                </p>
              </div>

              <JobRowActions
                jobId={job.id}
                jobSlug={job.slug}
                jobStatus={job.status}
                canDelete={canDelete}
              />
            </div>
          ))}
        </div>
      )}

      {totalPages > 1 ? (
        <div className="mt-5 flex items-center justify-center gap-3 text-sm">
          {pageNum > 1 ? (
            <Link
              href={`/dashboard/viec-lam?page=${pageNum - 1}`}
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
              href={`/dashboard/viec-lam?page=${pageNum + 1}`}
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
