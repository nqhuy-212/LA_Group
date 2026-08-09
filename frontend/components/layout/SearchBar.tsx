"use client";

import { useRouter } from "next/navigation";
import { type FormEvent } from "react";
import {
  IconBriefcase,
  IconCalendarBox,
  IconClock,
  IconMapPin,
  IconSearch,
  IconWallet,
} from "@/components/ui/icons";

const fieldClasses =
  "flex min-h-11 items-center gap-2 rounded-lg border border-border bg-bg px-3 [&_select]:w-full [&_select]:border-none [&_select]:bg-transparent [&_select]:text-sm [&_select]:text-text [&_select]:outline-none [&_input]:w-full [&_input]:border-none [&_input]:bg-transparent [&_input]:text-sm [&_input]:text-text [&_input]:outline-none";

// Dải mức lương cố định thay vì input số tự do — khớp `salary_min` mà
// `GET /api/jobs` đã hỗ trợ (feature-recruitment.md: 4 chiều lọc là từ khoá,
// ngành nghề, khu vực, mức lương).
const SALARY_BANDS = [
  { value: "", label: "Tất cả mức lương" },
  { value: "5000000", label: "Từ 5 triệu" },
  { value: "8000000", label: "Từ 8 triệu" },
  { value: "10000000", label: "Từ 10 triệu" },
  { value: "15000000", label: "Từ 15 triệu" },
];

const EMPLOYMENT_TYPE_OPTIONS = [
  { value: "", label: "Thời vụ & Chính thức" },
  { value: "seasonal", label: "Thời vụ" },
  { value: "official", label: "Chính thức" },
];

const SALARY_PERIOD_OPTIONS = [
  { value: "", label: "Lương tuần & tháng" },
  { value: "weekly", label: "Lương tuần" },
  { value: "monthly", label: "Lương tháng" },
];

export type SearchBarTaxonomy = { slug: string; name: string };

export function SearchBar({
  categories,
  industrialParks,
}: {
  categories: SearchBarTaxonomy[];
  industrialParks: SearchBarTaxonomy[];
}) {
  const router = useRouter();

  // Điều hướng thẳng tới /viec-lam với query string — hoạt động từ bất kỳ trang
  // nào vì SearchBar nằm trong layout dùng chung của toàn bộ site công khai.
  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const params = new URLSearchParams();
    const q = (form.get("q") as string | null)?.trim();
    const nganh = form.get("nganh") as string | null;
    const kv = form.get("kv") as string | null;
    const luong = form.get("luong") as string | null;
    const hinhThuc = form.get("hinh_thuc") as string | null;
    const kyLuong = form.get("ky_luong") as string | null;
    if (q) params.set("q", q);
    if (nganh) params.set("nganh", nganh);
    if (kv) params.set("kv", kv);
    if (luong) params.set("luong", luong);
    if (hinhThuc) params.set("hinh_thuc", hinhThuc);
    if (kyLuong) params.set("ky_luong", kyLuong);
    const query = params.toString();
    router.push(query ? `/viec-lam?${query}` : "/viec-lam");
  }

  return (
    <div className="border-b border-border bg-white">
      <div className="mx-auto w-full max-w-brand px-4">
        <form
          onSubmit={handleSubmit}
          className="flex flex-col gap-2.5 py-3.5 md:flex-row md:flex-wrap md:items-center"
        >
          <label className={`${fieldClasses} order-1 md:flex-1 md:basis-[240px]`}>
            <IconSearch className="h-5 w-5 flex-shrink-0 text-primary-600" />
            <input type="text" name="q" placeholder="Tìm theo vị trí, công ty, kỹ năng..." />
          </label>

          <button
            type="submit"
            className="order-2 inline-flex min-h-11 flex-shrink-0 items-center justify-center gap-1.5 rounded-lg bg-primary-600 px-5 text-sm font-bold text-white shadow-brand transition-colors hover:bg-primary-700 md:order-7"
          >
            <IconSearch className="h-4 w-4" />
            Tìm việc làm
          </button>

          <label className={`${fieldClasses} order-3 md:order-2 md:flex-none md:basis-[210px]`}>
            <IconBriefcase className="h-5 w-5 flex-shrink-0 text-primary-600" />
            <select name="nganh" defaultValue="">
              <option value="">Tất cả ngành nghề</option>
              {categories.map((category) => (
                <option key={category.slug} value={category.slug}>
                  {category.name}
                </option>
              ))}
            </select>
          </label>

          <label className={`${fieldClasses} order-4 md:order-3 md:flex-none md:basis-[225px]`}>
            <IconMapPin className="h-5 w-5 flex-shrink-0 text-primary-600" />
            <select name="kv" defaultValue="">
              <option value="">Tất cả khu công nghiệp</option>
              {industrialParks.map((park) => (
                <option key={park.slug} value={park.slug}>
                  {park.name}
                </option>
              ))}
            </select>
          </label>

          <label className={`${fieldClasses} order-5 md:order-4 md:flex-none md:basis-[185px]`}>
            <IconWallet className="h-5 w-5 flex-shrink-0 text-primary-600" />
            <select name="luong" defaultValue="">
              {SALARY_BANDS.map((band) => (
                <option key={band.value} value={band.value}>
                  {band.label}
                </option>
              ))}
            </select>
          </label>

          <label className={`${fieldClasses} order-6 md:order-5 md:flex-none md:basis-[190px]`}>
            <IconClock className="h-5 w-5 flex-shrink-0 text-primary-600" />
            <select name="hinh_thuc" defaultValue="">
              {EMPLOYMENT_TYPE_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>

          <label className={`${fieldClasses} order-7 md:order-6 md:flex-none md:basis-[190px]`}>
            <IconCalendarBox className="h-5 w-5 flex-shrink-0 text-primary-600" />
            <select name="ky_luong" defaultValue="">
              {SALARY_PERIOD_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
        </form>
      </div>
    </div>
  );
}
