"use client";

import { useState } from "react";
import type { components } from "@/lib/api/schema";
import { CompanyTab } from "./CompanyTab";
import { IndustrialParkTab } from "./IndustrialParkTab";
import { JobCategoryTab } from "./JobCategoryTab";
import { ProvinceTab } from "./ProvinceTab";

type CompanyAdminOutDTO = components["schemas"]["CompanyAdminOut"];
type JobCategoryAdminOutDTO = components["schemas"]["JobCategoryAdminOut"];
type IndustrialParkAdminOutDTO = components["schemas"]["IndustrialParkAdminOut"];
type ProvinceAdminOutDTO = components["schemas"]["ProvinceAdminOut"];

const TABS = [
  { key: "companies", label: "Công ty" },
  { key: "categories", label: "Ngành nghề" },
  { key: "industrialParks", label: "Khu công nghiệp" },
  { key: "provinces", label: "Tỉnh/Thành" },
] as const;

type TabKey = (typeof TABS)[number]["key"];

export function DanhMucTabs({
  companies,
  categories,
  industrialParks,
  provinces,
  canManage,
  canDelete,
}: {
  companies: CompanyAdminOutDTO[];
  categories: JobCategoryAdminOutDTO[];
  industrialParks: IndustrialParkAdminOutDTO[];
  provinces: ProvinceAdminOutDTO[];
  canManage: boolean;
  canDelete: boolean;
}) {
  const [tab, setTab] = useState<TabKey>("companies");

  return (
    <div>
      <div className="mb-4 flex flex-wrap gap-2 border-b border-border">
        {TABS.map((t) => (
          <button
            key={t.key}
            type="button"
            onClick={() => setTab(t.key)}
            className={`flex min-h-11 items-center border-b-2 px-3 text-sm font-semibold transition-colors ${
              tab === t.key
                ? "border-primary-600 text-primary-700"
                : "border-transparent text-text-muted hover:text-text"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "companies" ? (
        <CompanyTab items={companies} canManage={canManage} canDelete={canDelete} />
      ) : null}
      {tab === "categories" ? (
        <JobCategoryTab items={categories} canManage={canManage} canDelete={canDelete} />
      ) : null}
      {tab === "industrialParks" ? (
        <IndustrialParkTab
          items={industrialParks}
          provinces={provinces}
          canManage={canManage}
          canDelete={canDelete}
        />
      ) : null}
      {tab === "provinces" ? (
        <ProvinceTab items={provinces} canManage={canManage} canDelete={canDelete} />
      ) : null}
    </div>
  );
}
