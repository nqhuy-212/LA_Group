import { serverFetchAuthed } from "@/lib/api/server-auth-client";
import { getCurrentUser } from "@/lib/auth/current-user";
import type { components } from "@/lib/api/schema";
import { JobForm } from "../JobForm";

type JobCategoryAdminDTO = components["schemas"]["JobCategoryAdminOut"];
type IndustrialParkAdminDTO = components["schemas"]["IndustrialParkAdminOut"];
type ProvinceAdminDTO = components["schemas"]["ProvinceAdminOut"];
type CompanyAdminPageDTO = components["schemas"]["PageResponse_CompanyAdminOut_"];

export const metadata = { title: "Đăng tin mới | LA Group nội bộ" };

export default async function NewJobPage() {
  // Nguồn ADMIN (không phải public) — DoD P10.2: form đăng tin phải thấy được cả
  // danh mục đang is_active=false (nếu không, sửa tin cũ gán danh mục vừa ẩn sẽ
  // không hiện lựa chọn đang chọn trong dropdown). revalidate: false bắt buộc —
  // danh mục vừa thêm/xoá qua TaxonomySelect phải thấy ngay lần tải trang sau,
  // không đợi tới 1 tiếng cache cũ (bẫy đã ghi ở docs/PLAN.md §P10).
  const [user, categoriesRes, parksRes, provincesRes, companiesRes] = await Promise.all([
    getCurrentUser(),
    serverFetchAuthed<JobCategoryAdminDTO[]>("/api/admin/job-categories"),
    serverFetchAuthed<IndustrialParkAdminDTO[]>("/api/admin/industrial-parks"),
    serverFetchAuthed<ProvinceAdminDTO[]>("/api/admin/provinces"),
    serverFetchAuthed<CompanyAdminPageDTO>("/api/admin/companies?page_size=100"),
  ]);

  const categories = categoriesRes.ok ? categoriesRes.data : [];
  const industrialParks = parksRes.ok ? parksRes.data : [];
  const provinces = provincesRes.ok ? provincesRes.data : [];
  const companies = companiesRes.ok ? companiesRes.data.items : [];
  const canManageTaxonomies = user?.role === "admin" || user?.role === "manager";

  return (
    <div className="max-w-2xl">
      <h1 className="mb-5 text-lg font-extrabold text-text">Đăng tin tuyển dụng mới</h1>
      <JobForm
        categories={categories}
        industrialParks={industrialParks}
        provinces={provinces}
        companies={companies}
        canManageTaxonomies={canManageTaxonomies}
      />
    </div>
  );
}
