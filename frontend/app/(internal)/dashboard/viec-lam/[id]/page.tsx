import { notFound } from "next/navigation";
import { serverFetchAuthed } from "@/lib/api/server-auth-client";
import { getCurrentUser } from "@/lib/auth/current-user";
import type { components } from "@/lib/api/schema";
import { JobForm } from "../JobForm";

type JobCategoryAdminDTO = components["schemas"]["JobCategoryAdminOut"];
type IndustrialParkAdminDTO = components["schemas"]["IndustrialParkAdminOut"];
type ProvinceAdminDTO = components["schemas"]["ProvinceAdminOut"];
type CompanyAdminPageDTO = components["schemas"]["PageResponse_CompanyAdminOut_"];
type JobAdminOutDTO = components["schemas"]["JobAdminOut"];

export const metadata = { title: "Sửa tin tuyển dụng | LA Group nội bộ" };

export default async function EditJobPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  // Nguồn ADMIN + revalidate:false — xem ghi chú tương tự ở moi/page.tsx.
  const [user, jobRes, categoriesRes, parksRes, provincesRes, companiesRes] = await Promise.all([
    getCurrentUser(),
    serverFetchAuthed<JobAdminOutDTO>(`/api/admin/jobs/${id}`),
    serverFetchAuthed<JobCategoryAdminDTO[]>("/api/admin/job-categories"),
    serverFetchAuthed<IndustrialParkAdminDTO[]>("/api/admin/industrial-parks"),
    serverFetchAuthed<ProvinceAdminDTO[]>("/api/admin/provinces"),
    serverFetchAuthed<CompanyAdminPageDTO>("/api/admin/companies?page_size=100"),
  ]);

  if (!jobRes.ok) notFound();

  const categories = categoriesRes.ok ? categoriesRes.data : [];
  const industrialParks = parksRes.ok ? parksRes.data : [];
  const provinces = provincesRes.ok ? provincesRes.data : [];
  const companies = companiesRes.ok ? companiesRes.data.items : [];
  const canManageTaxonomies = user?.role === "admin" || user?.role === "manager";

  return (
    <div className="max-w-2xl">
      <h1 className="mb-5 text-lg font-extrabold text-text">Sửa tin tuyển dụng</h1>
      <JobForm
        categories={categories}
        industrialParks={industrialParks}
        provinces={provinces}
        companies={companies}
        canManageTaxonomies={canManageTaxonomies}
        initialJob={jobRes.data}
      />
    </div>
  );
}
