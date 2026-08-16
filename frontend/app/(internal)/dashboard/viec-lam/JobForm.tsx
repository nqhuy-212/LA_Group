"use client";

import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/Button";
import { browserFetch } from "@/lib/api/client";
import type { components } from "@/lib/api/schema";
import { revalidateJobPaths } from "../actions";

type JobAdminOutDTO = components["schemas"]["JobAdminOut"];
type Taxonomy = { slug: string; name: string };

// Toàn hệ thống hiện chỉ seed đúng 1 tỉnh (Hải Dương, mã "30" — xem
// company-info.md/data-models.md); chưa có API public liệt kê tỉnh nên cố định
// tại đây thay vì dựng thêm cả một endpoint chỉ để chọn 1 giá trị duy nhất.
const PROVINCE_CODE = "30";
const PROVINCE_NAME = "Hải Dương";

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
  initialJob,
}: {
  categories: Taxonomy[];
  industrialParks: Taxonomy[];
  companies: Taxonomy[];
  initialJob?: JobAdminOutDTO;
}) {
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const isEdit = Boolean(initialJob);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setPending(true);

    const submitter = (event.nativeEvent as SubmitEvent).submitter as HTMLButtonElement | null;
    const viewAfterSave = submitter?.value === "view";

    const form = new FormData(event.currentTarget);
    const payload = {
      title: String(form.get("title") ?? "").trim(),
      company_slug: String(form.get("company_slug") ?? ""),
      category_slug: String(form.get("category_slug") ?? ""),
      industrial_park_slug: stringOrNull(form.get("industrial_park_slug")),
      province_code: PROVINCE_CODE,
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
        <label className={labelClass}>
          Công ty/Nhà máy *
          <select
            name="company_slug"
            required
            defaultValue={initialJob?.company_slug ?? ""}
            className={fieldClass}
          >
            <option value="" disabled>
              -- Chọn công ty --
            </option>
            {companies.map((c) => (
              <option key={c.slug} value={c.slug}>
                {c.name}
              </option>
            ))}
          </select>
        </label>

        <label className={labelClass}>
          Ngành nghề *
          <select
            name="category_slug"
            required
            defaultValue={initialJob?.category_slug ?? ""}
            className={fieldClass}
          >
            <option value="" disabled>
              -- Chọn ngành nghề --
            </option>
            {categories.map((c) => (
              <option key={c.slug} value={c.slug}>
                {c.name}
              </option>
            ))}
          </select>
        </label>

        <label className={labelClass}>
          Khu công nghiệp
          <select
            name="industrial_park_slug"
            defaultValue={initialJob?.industrial_park_slug ?? ""}
            className={fieldClass}
          >
            <option value="">Không thuộc KCN nào</option>
            {industrialParks.map((p) => (
              <option key={p.slug} value={p.slug}>
                {p.name}
              </option>
            ))}
          </select>
        </label>

        <label className={labelClass}>
          Tỉnh/Thành
          <input value={PROVINCE_NAME} disabled className={`${fieldClass} bg-bg text-text-muted`} />
        </label>
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
