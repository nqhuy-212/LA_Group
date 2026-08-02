import { serverFetch } from "@/lib/api/client";
import { serverFetchAuthed } from "@/lib/api/server-auth-client";
import type { components } from "@/lib/api/schema";
import { JobForm } from "../JobForm";

type JobCategoryDTO = components["schemas"]["JobCategoryWithCount"];
type IndustrialParkDTO = components["schemas"]["IndustrialParkOut"];
type CompanyAdminPageDTO = components["schemas"]["PageResponse_CompanyAdminOut_"];

export const metadata = { title: "Đăng tin mới | LA Group nội bộ" };

export default async function NewJobPage() {
  const [categoriesRes, parksRes, companiesRes] = await Promise.all([
    serverFetch<JobCategoryDTO[]>("/api/job-categories", { revalidate: 3600 }),
    serverFetch<IndustrialParkDTO[]>("/api/industrial-parks", { revalidate: 3600 }),
    serverFetchAuthed<CompanyAdminPageDTO>("/api/admin/companies?page_size=100"),
  ]);

  const categories = categoriesRes.ok ? categoriesRes.data : [];
  const industrialParks = parksRes.ok ? parksRes.data : [];
  const companies = companiesRes.ok ? companiesRes.data.items : [];

  return (
    <div className="max-w-2xl">
      <h1 className="mb-5 text-lg font-extrabold text-text">Đăng tin tuyển dụng mới</h1>
      <JobForm categories={categories} industrialParks={industrialParks} companies={companies} />
    </div>
  );
}
