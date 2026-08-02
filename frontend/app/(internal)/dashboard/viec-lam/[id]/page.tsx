import { notFound } from "next/navigation";
import { serverFetch } from "@/lib/api/client";
import { serverFetchAuthed } from "@/lib/api/server-auth-client";
import type { components } from "@/lib/api/schema";
import { JobForm } from "../JobForm";

type JobCategoryDTO = components["schemas"]["JobCategoryWithCount"];
type IndustrialParkDTO = components["schemas"]["IndustrialParkOut"];
type CompanyAdminPageDTO = components["schemas"]["PageResponse_CompanyAdminOut_"];
type JobAdminOutDTO = components["schemas"]["JobAdminOut"];

export const metadata = { title: "Sửa tin tuyển dụng | LA Group nội bộ" };

export default async function EditJobPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [jobRes, categoriesRes, parksRes, companiesRes] = await Promise.all([
    serverFetchAuthed<JobAdminOutDTO>(`/api/admin/jobs/${id}`),
    serverFetch<JobCategoryDTO[]>("/api/job-categories", { revalidate: 3600 }),
    serverFetch<IndustrialParkDTO[]>("/api/industrial-parks", { revalidate: 3600 }),
    serverFetchAuthed<CompanyAdminPageDTO>("/api/admin/companies?page_size=100"),
  ]);

  if (!jobRes.ok) notFound();

  const categories = categoriesRes.ok ? categoriesRes.data : [];
  const industrialParks = parksRes.ok ? parksRes.data : [];
  const companies = companiesRes.ok ? companiesRes.data.items : [];

  return (
    <div className="max-w-2xl">
      <h1 className="mb-5 text-lg font-extrabold text-text">Sửa tin tuyển dụng</h1>
      <JobForm
        categories={categories}
        industrialParks={industrialParks}
        companies={companies}
        initialJob={jobRes.data}
      />
    </div>
  );
}
