import { serverFetchAuthed } from "@/lib/api/server-auth-client";
import { getCurrentUser } from "@/lib/auth/current-user";
import type { components } from "@/lib/api/schema";
import { DanhMucTabs } from "./DanhMucTabs";

type CompanyAdminPageDTO = components["schemas"]["PageResponse_CompanyAdminOut_"];
type JobCategoryAdminDTO = components["schemas"]["JobCategoryAdminOut"];
type IndustrialParkAdminDTO = components["schemas"]["IndustrialParkAdminOut"];
type ProvinceAdminDTO = components["schemas"]["ProvinceAdminOut"];

export const metadata = { title: "Danh mục | LA Group nội bộ" };

export default async function DanhMucPage() {
  const [user, companiesRes, categoriesRes, parksRes, provincesRes] = await Promise.all([
    getCurrentUser(),
    serverFetchAuthed<CompanyAdminPageDTO>("/api/admin/companies?page_size=100"),
    serverFetchAuthed<JobCategoryAdminDTO[]>("/api/admin/job-categories"),
    serverFetchAuthed<IndustrialParkAdminDTO[]>("/api/admin/industrial-parks"),
    serverFetchAuthed<ProvinceAdminDTO[]>("/api/admin/provinces"),
  ]);

  const companies = companiesRes.ok ? companiesRes.data.items : [];
  const categories = categoriesRes.ok ? categoriesRes.data : [];
  const industrialParks = parksRes.ok ? parksRes.data : [];
  const provinces = provincesRes.ok ? provincesRes.data : [];
  const canManage = user?.role === "admin" || user?.role === "manager";
  const canDelete = user?.role === "admin";

  return (
    <div>
      <h1 className="mb-5 text-lg font-extrabold text-text">Danh mục</h1>
      <DanhMucTabs
        companies={companies}
        categories={categories}
        industrialParks={industrialParks}
        provinces={provinces}
        canManage={canManage}
        canDelete={canDelete}
      />
    </div>
  );
}
