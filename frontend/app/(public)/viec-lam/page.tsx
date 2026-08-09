import type { Metadata } from "next";
import Link from "next/link";
import { JobCard } from "@/components/home/JobCard";
import { Container } from "@/components/ui/Container";
import { serverFetch } from "@/lib/api/client";
import type { components } from "@/lib/api/schema";
import { toJobCardVM, type JobCategoryWithCountDTO, type JobListItemDTO } from "@/lib/view-models/job";

type IndustrialParkOutDTO = components["schemas"]["IndustrialParkOut"];
type JobsPageDTO = components["schemas"]["PageResponse_JobListItem_"];

type RawSearchParams = {
  q?: string;
  nganh?: string;
  kv?: string;
  luong?: string;
  hinh_thuc?: string;
  ky_luong?: string;
  page?: string;
};

const PAGE_SIZE = 20;
const TAXONOMY_REVALIDATE_SECONDS = 3600;

function buildHref(current: RawSearchParams, overrides: Partial<RawSearchParams>): string {
  const merged: RawSearchParams = { ...current, ...overrides };
  const params = new URLSearchParams();
  if (merged.q) params.set("q", merged.q);
  if (merged.nganh) params.set("nganh", merged.nganh);
  if (merged.kv) params.set("kv", merged.kv);
  if (merged.luong) params.set("luong", merged.luong);
  if (merged.hinh_thuc) params.set("hinh_thuc", merged.hinh_thuc);
  if (merged.ky_luong) params.set("ky_luong", merged.ky_luong);
  if (merged.page && merged.page !== "1") params.set("page", merged.page);
  const qs = params.toString();
  return qs ? `/viec-lam?${qs}` : "/viec-lam";
}

export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<RawSearchParams>;
}): Promise<Metadata> {
  const sp = await searchParams;
  const parts: string[] = [];

  if (sp.nganh) {
    const categoriesRes = await serverFetch<JobCategoryWithCountDTO[]>("/api/job-categories", {
      revalidate: TAXONOMY_REVALIDATE_SECONDS,
    });
    const category = categoriesRes.ok ? categoriesRes.data.find((c) => c.slug === sp.nganh) : undefined;
    if (category) parts.push(category.name);
  }
  if (sp.kv) {
    const parksRes = await serverFetch<IndustrialParkOutDTO[]>("/api/industrial-parks", {
      revalidate: TAXONOMY_REVALIDATE_SECONDS,
    });
    const park = parksRes.ok ? parksRes.data.find((p) => p.slug === sp.kv) : undefined;
    if (park) parts.push(`tại ${park.name}`);
  }

  const title = parts.length > 0 ? `Việc làm ${parts.join(" ")} | LA Group` : "Tìm việc làm | LA Group (LAHR)";
  const description =
    "Tìm kiếm việc làm tại các khu công nghiệp Hải Dương cùng LA Group (LAHR) — cập nhật liên tục, lọc theo ngành nghề, khu công nghiệp và mức lương.";

  return {
    title,
    description,
    // Canonical luôn trỏ về trang danh sách gốc — tránh Google index hàng loạt
    // biến thể URL lọc/phân trang như nội dung trùng lặp/thin content.
    alternates: { canonical: "/viec-lam" },
    openGraph: { title, description },
  };
}

export default async function ViecLamPage({
  searchParams,
}: {
  searchParams: Promise<RawSearchParams>;
}) {
  const sp = await searchParams;
  const page = Math.max(1, Number(sp.page) || 1);

  const apiParams = new URLSearchParams();
  if (sp.q) apiParams.set("q", sp.q);
  if (sp.nganh) apiParams.set("category", sp.nganh);
  if (sp.kv) apiParams.set("industrial_park", sp.kv);
  if (sp.luong) apiParams.set("salary_min", sp.luong);
  if (sp.hinh_thuc) apiParams.set("employment_type", sp.hinh_thuc);
  if (sp.ky_luong) apiParams.set("salary_period", sp.ky_luong);
  apiParams.set("page", String(page));
  apiParams.set("page_size", String(PAGE_SIZE));

  const [jobsRes, categoriesRes] = await Promise.all([
    serverFetch<JobsPageDTO>(`/api/jobs?${apiParams.toString()}`, { revalidate: 60 }),
    serverFetch<JobCategoryWithCountDTO[]>("/api/job-categories", {
      revalidate: TAXONOMY_REVALIDATE_SECONDS,
    }),
  ]);

  const jobsData: JobsPageDTO = jobsRes.ok
    ? jobsRes.data
    : { items: [], total: 0, page: 1, page_size: PAGE_SIZE };
  const jobs = jobsData.items.map((item: JobListItemDTO) => toJobCardVM(item));
  const categories = categoriesRes.ok ? categoriesRes.data : [];
  const totalPages = Math.max(1, Math.ceil(jobsData.total / jobsData.page_size));

  return (
    <Container className="py-8 md:py-12">
      <div data-reveal suppressHydrationWarning className="reveal mb-5">
        <h1 className="text-xl font-extrabold md:text-2xl">Tìm việc làm</h1>
        <p className="mt-1 text-sm text-text-muted">
          {jobsRes.ok
            ? `Tìm thấy ${jobsData.total} việc làm phù hợp`
            : "Không tải được danh sách việc làm, vui lòng thử lại sau."}
        </p>
      </div>

      <div
        data-reveal
        suppressHydrationWarning
        className="reveal no-scrollbar mb-5 flex gap-2 overflow-x-auto pb-1"
      >
        <Link
          href={buildHref(sp, { nganh: undefined, page: undefined })}
          className={`min-h-10 flex-shrink-0 rounded-full border px-4 py-2 text-[13px] font-bold transition-colors ${
            !sp.nganh
              ? "border-primary-600 bg-primary-600 text-white"
              : "border-border bg-white text-text-muted"
          }`}
        >
          Tất cả
        </Link>
        {categories.map((category) => (
          <Link
            key={category.slug}
            href={buildHref(sp, { nganh: category.slug, page: undefined })}
            className={`min-h-10 flex-shrink-0 rounded-full border px-4 py-2 text-[13px] font-bold transition-colors ${
              sp.nganh === category.slug
                ? "border-primary-600 bg-primary-600 text-white"
                : "border-border bg-white text-text-muted"
            }`}
          >
            {category.name}
          </Link>
        ))}
      </div>

      {jobs.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-xl border border-border bg-white py-14 text-center">
          <p className="text-sm text-text-muted">
            Không tìm thấy việc làm phù hợp với bộ lọc hiện tại.
          </p>
          <Link href="/viec-lam" className="text-sm font-bold text-primary-700">
            Xoá bộ lọc →
          </Link>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {jobs.map((job, index) => (
            <JobCard key={job.id} job={job} index={index} />
          ))}
        </div>
      )}

      {totalPages > 1 ? (
        <div className="mt-6 flex items-center justify-center gap-3">
          {page > 1 ? (
            <Link
              href={buildHref(sp, { page: String(page - 1) })}
              className="min-h-11 rounded-lg border border-border bg-white px-4 py-2.5 text-sm font-bold text-text hover:border-primary-600"
            >
              ← Trang trước
            </Link>
          ) : null}
          <span className="text-sm text-text-muted">
            Trang {page}/{totalPages}
          </span>
          {page < totalPages ? (
            <Link
              href={buildHref(sp, { page: String(page + 1) })}
              className="min-h-11 rounded-lg border border-border bg-white px-4 py-2.5 text-sm font-bold text-text hover:border-primary-600"
            >
              Trang sau →
            </Link>
          ) : null}
        </div>
      ) : null}
    </Container>
  );
}
