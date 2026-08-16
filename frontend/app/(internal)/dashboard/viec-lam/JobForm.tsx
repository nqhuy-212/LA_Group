"use client";

import { useState, type FormEvent } from "react";
import {
  TaxonomySelect,
  type TaxonomyCreateResult,
  type TaxonomyDeleteResult,
  type TaxonomyOption,
} from "@/components/internal/TaxonomySelect";
import { Button } from "@/components/ui/Button";
import { browserFetch } from "@/lib/api/client";
import type { components } from "@/lib/api/schema";
import { revalidateJobPaths } from "../actions";

type JobAdminOutDTO = components["schemas"]["JobAdminOut"];
type CompanyAdminOutDTO = components["schemas"]["CompanyAdminOut"];
type JobCategoryAdminOutDTO = components["schemas"]["JobCategoryAdminOut"];
type IndustrialParkAdminOutDTO = components["schemas"]["IndustrialParkAdminOut"];
type ProvinceAdminOutDTO = components["schemas"]["ProvinceAdminOut"];
type Taxonomy = { slug: string; name: string };
type ProvinceTaxonomy = { code: string; name: string };

const STATUS_OPTIONS: { value: string; label: string }[] = [
  { value: "draft", label: "Nháp (chưa hiển thị công khai)" },
  { value: "published", label: "Đang tuyển (hiển thị công khai)" },
  { value: "closed", label: "Đã đóng (ẩn khỏi danh sách, vẫn xem được để giữ SEO)" },
  { value: "archived", label: "Lưu trữ" },
];

const EMPLOYMENT_TYPE_OPTIONS: { value: string; label: string }[] = [
  { value: "official", label: "Chính thức" },
  { value: "seasonal", label: "Thời vụ" },
];

const SALARY_PERIOD_OPTIONS: { value: string; label: string }[] = [
  { value: "weekly", label: "Lương tuần" },
  { value: "monthly", label: "Lương tháng" },
];

const fieldClass =
  "min-h-11 w-full rounded-lg border border-border bg-white px-3 text-[16px] text-text outline-none focus:border-primary-500";
const labelClass = "flex flex-col gap-1.5 text-sm font-semibold text-text";

function numberOrNull(value: FormDataEntryValue | null): number | null {
  if (value === null || value === "") return null;
  const n = Number(value);
  return Number.isNaN(n) ? null : n;
}

function stringOrNull(value: FormDataEntryValue | null): string | null {
  if (value === null) return null;
  const s = String(value).trim();
  return s === "" ? null : s;
}

export function JobForm({
  categories,
  industrialParks,
  companies,
  provinces,
  canManageTaxonomies,
  initialJob,
}: {
  categories: Taxonomy[];
  industrialParks: Taxonomy[];
  companies: Taxonomy[];
  provinces: ProvinceTaxonomy[];
  canManageTaxonomies: boolean;
  initialJob?: JobAdminOutDTO;
}) {
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const isEdit = Boolean(initialJob);

  const [companySlug, setCompanySlug] = useState(initialJob?.company_slug ?? "");
  const [categorySlug, setCategorySlug] = useState(initialJob?.category_slug ?? "");
  const [industrialParkSlug, setIndustrialParkSlug] = useState(
    initialJob?.industrial_park_slug ?? "",
  );
  const [provinceCode, setProvinceCode] = useState(initialJob?.province_code ?? "");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setPending(true);

    const submitter = (event.nativeEvent as SubmitEvent).submitter as HTMLButtonElement | null;
    const viewAfterSave = submitter?.value === "view";

    const form = new FormData(event.currentTarget);
    const payload = {
      title: String(form.get("title") ?? "").trim(),
      company_slug: companySlug,
      category_slug: categorySlug,
      industrial_park_slug: industrialParkSlug || null,
      province_code: provinceCode,
      salary_min: numberOrNull(form.get("salary_min")),
      salary_max: numberOrNull(form.get("salary_max")),
      salary_negotiable: form.get("salary_negotiable") === "on",
      quantity: numberOrNull(form.get("quantity")) ?? 1,
      age_min: numberOrNull(form.get("age_min")),
      age_max: numberOrNull(form.get("age_max")),
      shift_type: stringOrNull(form.get("shift_type")),
      employment_type: stringOrNull(form.get("employment_type")),
      salary_period: stringOrNull(form.get("salary_period")),
      description: stringOrNull(form.get("description")),
      requirements: stringOrNull(form.get("requirements")),
      benefits: stringOrNull(form.get("benefits")),
      deadline: stringOrNull(form.get("deadline")),
      status: String(form.get("status") ?? "draft"),
      is_hot: form.get("is_hot") === "on",
      meta_title: stringOrNull(form.get("meta_title")),
      meta_description: stringOrNull(form.get("meta_description")),
    };

    const res = isEdit
      ? await browserFetch<JobAdminOutDTO>(`/api/admin/jobs/${initialJob!.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        })
      : await browserFetch<JobAdminOutDTO>("/api/admin/jobs", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

    if (!res.ok) {
      setPending(false);
      setError(res.error);
      return;
    }
    // Trang chi tiết công khai cache ISR 300s — không revalidate thì "xem kết
    // quả" hiện bản cũ tới 5 phút.
    await revalidateJobPaths(res.data.slug);
    // Full page load thay vì router.push + router.refresh — pattern đó không thực
    // sự điều hướng được sau khi vừa ghi xong dữ liệu (đã xác nhận qua test thật,
    // xem CLAUDE.md). window.location luôn lấy dữ liệu mới nhất từ server.
    window.location.href = viewAfterSave
      ? `/viec-lam/${res.data.slug}`
      : "/dashboard/viec-lam";
  }

  async function createCompany(values: Record<string, string>): Promise<TaxonomyCreateResult> {
    const res = await browserFetch<CompanyAdminOutDTO>("/api/admin/companies", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: values.name }),
    });
    return res.ok
      ? { ok: true, option: { value: res.data.slug, label: res.data.name } }
      : { ok: false, error: res.error };
  }

  async function deleteCompany(slug: string): Promise<TaxonomyDeleteResult> {
    const company = companies.find((c) => c.slug === slug);
    if (!company) return { ok: false, error: "Không tìm thấy công ty" };
    // Danh sách chỉ có slug/name (không có id) — id nằm trong AdminOut đầy đủ,
    // nhưng route DELETE cần id nên phải tra ngược qua API list (page_size=100
    // đã đủ với quy mô danh mục hiện tại, khớp cách trang moi/page.tsx đang fetch).
    const listRes = await browserFetch<{ items: CompanyAdminOutDTO[] }>(
      "/api/admin/companies?page_size=100",
    );
    if (!listRes.ok) return { ok: false, error: listRes.error };
    const found = listRes.data.items.find((c) => c.slug === slug);
    if (!found) return { ok: false, error: "Không tìm thấy công ty" };
    const res = await browserFetch(`/api/admin/companies/${found.id}`, { method: "DELETE" });
    return res.ok ? { ok: true } : { ok: false, error: res.error };
  }

  async function createCategory(values: Record<string, string>): Promise<TaxonomyCreateResult> {
    const res = await browserFetch<JobCategoryAdminOutDTO>("/api/admin/job-categories", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: values.name }),
    });
    return res.ok
      ? { ok: true, option: { value: res.data.slug, label: res.data.name } }
      : { ok: false, error: res.error };
  }

  async function deleteCategory(slug: string): Promise<TaxonomyDeleteResult> {
    const listRes = await browserFetch<JobCategoryAdminOutDTO[]>("/api/admin/job-categories");
    if (!listRes.ok) return { ok: false, error: listRes.error };
    const found = listRes.data.find((c) => c.slug === slug);
    if (!found) return { ok: false, error: "Không tìm thấy ngành nghề" };
    const res = await browserFetch(`/api/admin/job-categories/${found.id}`, { method: "DELETE" });
    return res.ok ? { ok: true } : { ok: false, error: res.error };
  }

  async function createIndustrialPark(
    values: Record<string, string>,
  ): Promise<TaxonomyCreateResult> {
    const res = await browserFetch<IndustrialParkAdminOutDTO>("/api/admin/industrial-parks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: values.name, province_code: values.province_code }),
    });
    return res.ok
      ? { ok: true, option: { value: res.data.slug, label: res.data.name } }
      : { ok: false, error: res.error };
  }

  async function deleteIndustrialPark(slug: string): Promise<TaxonomyDeleteResult> {
    const listRes = await browserFetch<IndustrialParkAdminOutDTO[]>("/api/admin/industrial-parks");
    if (!listRes.ok) return { ok: false, error: listRes.error };
    const found = listRes.data.find((p) => p.slug === slug);
    if (!found) return { ok: false, error: "Không tìm thấy khu công nghiệp" };
    const res = await browserFetch(`/api/admin/industrial-parks/${found.id}`, {
      method: "DELETE",
    });
    return res.ok ? { ok: true } : { ok: false, error: res.error };
  }

  async function createProvince(values: Record<string, string>): Promise<TaxonomyCreateResult> {
    const res = await browserFetch<ProvinceAdminOutDTO>("/api/admin/provinces", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code: values.code, name: values.name, type: values.type }),
    });
    return res.ok
      ? { ok: true, option: { value: res.data.code, label: res.data.name } }
      : { ok: false, error: res.error };
  }

  async function deleteProvince(code: string): Promise<TaxonomyDeleteResult> {
    const res = await browserFetch(`/api/admin/provinces/${code}`, { method: "DELETE" });
    return res.ok ? { ok: true } : { ok: false, error: res.error };
  }

  const companyOptions: TaxonomyOption[] = companies.map((c) => ({
    value: c.slug,
    label: c.name,
  }));
  const categoryOptions: TaxonomyOption[] = categories.map((c) => ({
    value: c.slug,
    label: c.name,
  }));
  const industrialParkOptions: TaxonomyOption[] = industrialParks.map((p) => ({
    value: p.slug,
    label: p.name,
  }));
  const provinceOptions: TaxonomyOption[] = provinces.map((p) => ({
    value: p.code,
    label: p.name,
  }));

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <label className={labelClass}>
        Tên vị trí *
        <input
          name="title"
          required
          minLength={3}
          maxLength={200}
          defaultValue={initialJob?.title}
          className={fieldClass}
        />
      </label>

      <div className="grid gap-4 sm:grid-cols-2">
        <TaxonomySelect
          label="Công ty/Nhà máy *"
          selectName="company_slug"
          required
          options={companyOptions}
          value={companySlug}
          onChange={setCompanySlug}
          canManage={canManageTaxonomies}
          createTitle="Thêm công ty/nhà máy"
          createFields={[{ kind: "text", name: "name", label: "Tên công ty" }]}
          onCreate={createCompany}
          onDelete={deleteCompany}
          emptyOptionLabel="-- Chọn công ty --"
        />

        <TaxonomySelect
          label="Ngành nghề *"
          selectName="category_slug"
          required
          options={categoryOptions}
          value={categorySlug}
          onChange={setCategorySlug}
          canManage={canManageTaxonomies}
          createTitle="Thêm ngành nghề"
          createFields={[{ kind: "text", name: "name", label: "Tên ngành nghề" }]}
          onCreate={createCategory}
          onDelete={deleteCategory}
          emptyOptionLabel="-- Chọn ngành nghề --"
        />

        <TaxonomySelect
          label="Khu công nghiệp"
          selectName="industrial_park_slug"
          options={industrialParkOptions}
          value={industrialParkSlug}
          onChange={setIndustrialParkSlug}
          canManage={canManageTaxonomies}
          createTitle="Thêm khu công nghiệp"
          createFields={[
            { kind: "text", name: "name", label: "Tên khu công nghiệp" },
            { kind: "select", name: "province_code", label: "Tỉnh/Thành", options: provinceOptions },
          ]}
          onCreate={createIndustrialPark}
          onDelete={deleteIndustrialPark}
          emptyOptionLabel="Không thuộc KCN nào"
        />

        <TaxonomySelect
          label="Tỉnh/Thành *"
          selectName="province_code"
          required
          options={provinceOptions}
          value={provinceCode}
          onChange={setProvinceCode}
          canManage={canManageTaxonomies}
          createTitle="Thêm tỉnh/thành"
          createFields={[
            { kind: "text", name: "code", label: "Mã tỉnh (GSO)", maxLength: 3 },
            { kind: "text", name: "name", label: "Tên tỉnh/thành" },
            { kind: "text", name: "type", label: "Loại (VD: Tỉnh, Thành phố)" },
          ]}
          onCreate={createProvince}
          onDelete={deleteProvince}
          emptyOptionLabel="-- Chọn tỉnh/thành --"
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className={labelClass}>
          Lương tối thiểu (VNĐ)
          <input
            type="number"
            name="salary_min"
            min={0}
            step={100000}
            defaultValue={initialJob?.salary_min ?? undefined}
            className={fieldClass}
          />
        </label>
        <label className={labelClass}>
          Lương tối đa (VNĐ)
          <input
            type="number"
            name="salary_max"
            min={0}
            step={100000}
            defaultValue={initialJob?.salary_max ?? undefined}
            className={fieldClass}
          />
        </label>
      </div>

      <label className="flex min-h-11 items-center gap-2 text-sm font-semibold text-text">
        <input
          type="checkbox"
          name="salary_negotiable"
          defaultChecked={initialJob?.salary_negotiable}
          className="h-5 w-5"
        />
        Lương thoả thuận
      </label>

      <div className="grid gap-4 sm:grid-cols-3">
        <label className={labelClass}>
          Số lượng tuyển
          <input
            type="number"
            name="quantity"
            min={1}
            defaultValue={initialJob?.quantity ?? 1}
            className={fieldClass}
          />
        </label>
        <label className={labelClass}>
          Tuổi từ
          <input
            type="number"
            name="age_min"
            min={15}
            max={100}
            defaultValue={initialJob?.age_min ?? undefined}
            className={fieldClass}
          />
        </label>
        <label className={labelClass}>
          Tuổi đến
          <input
            type="number"
            name="age_max"
            min={15}
            max={100}
            defaultValue={initialJob?.age_max ?? undefined}
            className={fieldClass}
          />
        </label>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className={labelClass}>
          Ca làm việc
          <input
            name="shift_type"
            maxLength={50}
            defaultValue={initialJob?.shift_type ?? undefined}
            placeholder="VD: Theo ca (2 ca/ngày)"
            className={fieldClass}
          />
        </label>
        <label className={labelClass}>
          Loại hình công việc
          <select
            name="employment_type"
            defaultValue={initialJob?.employment_type ?? ""}
            className={fieldClass}
          >
            <option value="">Không xác định</option>
            {EMPLOYMENT_TYPE_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </label>
        <label className={labelClass}>
          Kỳ trả lương
          <select
            name="salary_period"
            defaultValue={initialJob?.salary_period ?? ""}
            className={fieldClass}
          >
            <option value="">Không xác định</option>
            {SALARY_PERIOD_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </label>
      </div>

      <label className={labelClass}>
        Mô tả công việc
        <textarea
          name="description"
          rows={4}
          defaultValue={initialJob?.description ?? undefined}
          className={`${fieldClass} min-h-[unset] py-2`}
        />
      </label>

      <label className={labelClass}>
        Yêu cầu ứng viên
        <textarea
          name="requirements"
          rows={4}
          defaultValue={initialJob?.requirements ?? undefined}
          className={`${fieldClass} min-h-[unset] py-2`}
        />
      </label>

      <label className={labelClass}>
        Quyền lợi
        <textarea
          name="benefits"
          rows={4}
          defaultValue={initialJob?.benefits ?? undefined}
          className={`${fieldClass} min-h-[unset] py-2`}
        />
      </label>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className={labelClass}>
          Hạn nộp hồ sơ
          <input
            type="date"
            name="deadline"
            defaultValue={initialJob?.deadline ?? undefined}
            className={fieldClass}
          />
        </label>
        <label className={labelClass}>
          Trạng thái
          <select
            name="status"
            defaultValue={initialJob?.status ?? "draft"}
            className={fieldClass}
          >
            {STATUS_OPTIONS.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>
        </label>
      </div>

      <label className="flex min-h-11 items-center gap-2 text-sm font-semibold text-text">
        <input type="checkbox" name="is_hot" defaultChecked={initialJob?.is_hot} className="h-5 w-5" />
        Gắn nhãn &quot;HOT&quot; (tuyển gấp)
      </label>

      <details className="rounded-lg border border-border p-3">
        <summary className="cursor-pointer text-sm font-semibold text-text-muted">
          SEO nâng cao (không bắt buộc)
        </summary>
        <div className="mt-3 flex flex-col gap-4">
          <label className={labelClass}>
            Tiêu đề SEO
            <input
              name="meta_title"
              maxLength={200}
              defaultValue={initialJob?.meta_title ?? undefined}
              className={fieldClass}
            />
          </label>
          <label className={labelClass}>
            Mô tả SEO
            <input
              name="meta_description"
              maxLength={300}
              defaultValue={initialJob?.meta_description ?? undefined}
              className={fieldClass}
            />
          </label>
        </div>
      </details>

      {error ? <p className="text-sm font-semibold text-accent-dark">{error}</p> : null}

      <div className="flex flex-wrap gap-3">
        <Button type="submit" disabled={pending}>
          {pending ? "Đang lưu..." : isEdit ? "Lưu thay đổi" : "Đăng tin"}
        </Button>
        <Button type="submit" value="view" variant="ghost" disabled={pending}>
          Lưu &amp; xem trên web
        </Button>
      </div>
    </form>
  );
}
