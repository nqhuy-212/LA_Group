"use client";

import { type FormEvent } from "react";
import { IconBriefcase, IconBuilding, IconMapPin, IconSearch } from "@/components/ui/icons";

const fieldClasses =
  "flex min-h-11 items-center gap-2 rounded-lg border border-border bg-bg px-3 [&_select]:w-full [&_select]:border-none [&_select]:bg-transparent [&_select]:text-sm [&_select]:text-text [&_select]:outline-none [&_input]:w-full [&_input]:border-none [&_input]:bg-transparent [&_input]:text-sm [&_input]:text-text [&_input]:outline-none";

export function SearchBar() {
  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    document.getElementById("viec-lam")?.scrollIntoView({ behavior: "smooth" });
  }

  return (
    <div className="border-b border-border bg-white">
      <div className="mx-auto w-full max-w-brand px-4">
        <form
          onSubmit={handleSubmit}
          className="flex flex-col gap-2.5 py-3.5 md:flex-row md:items-center"
        >
          <label className={`${fieldClasses} order-1 md:flex-1`}>
            <IconSearch className="h-5 w-5 flex-shrink-0 text-primary-600" />
            <input type="text" placeholder="Tìm theo vị trí, công ty, kỹ năng..." />
          </label>

          <button
            type="submit"
            className="order-2 inline-flex min-h-11 flex-shrink-0 items-center justify-center gap-1.5 rounded-lg bg-primary-600 px-5 text-sm font-bold text-white shadow-brand transition-colors hover:bg-primary-700 md:order-5"
          >
            <IconSearch className="h-4 w-4" />
            Tìm việc làm
          </button>

          <label className={`${fieldClasses} order-3 md:order-2 md:flex-none md:basis-[210px]`}>
            <IconBuilding className="h-5 w-5 flex-shrink-0 text-primary-600" />
            <select defaultValue="">
              <option value="">Tất cả ngành nghề</option>
              <option>Sản xuất – Lắp ráp</option>
              <option>Cơ khí – Kỹ thuật</option>
              <option>Dịch vụ – Bán hàng</option>
              <option>Kho vận – Logistics</option>
            </select>
          </label>

          <label className={`${fieldClasses} order-4 md:order-3 md:flex-none md:basis-[170px]`}>
            <IconMapPin className="h-5 w-5 flex-shrink-0 text-primary-600" />
            <select defaultValue="">
              <option value="">Tất cả khu vực</option>
              <option>Hải Dương</option>
              <option>Hải Phòng</option>
              <option>Hà Nội</option>
              <option>Hưng Yên</option>
            </select>
          </label>

          <label className={`${fieldClasses} order-5 md:order-4 md:flex-none md:basis-[170px]`}>
            <IconBriefcase className="h-5 w-5 flex-shrink-0 text-primary-600" />
            <select defaultValue="">
              <option value="">Tất cả loại hình</option>
              <option>Toàn thời gian</option>
              <option>Bán thời gian</option>
              <option>Thời vụ</option>
              <option>Theo ca</option>
            </select>
          </label>
        </form>
      </div>
    </div>
  );
}
