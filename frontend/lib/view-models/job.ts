import { formatDeadline, formatSalary, initials } from "@/lib/format";
import type { components } from "@/lib/api/schema";
import type { JobCardVM, JobCategoryCard, JobCategoryTab } from "@/lib/view-models/types";

export type JobListItemDTO = components["schemas"]["JobListItem"];
export type JobCategoryWithCountDTO = components["schemas"]["JobCategoryWithCount"];

export function toJobCardVM(dto: JobListItemDTO): JobCardVM {
  return {
    id: dto.slug,
    href: `/viec-lam/${dto.slug}`,
    title: dto.title,
    company: dto.company.name,
    logoInitials: dto.company.logo_initials ?? initials(dto.company.name),
    category: dto.category.slug as JobCardVM["category"],
    hot: dto.is_hot,
    salaryLabel: formatSalary(dto.salary_min, dto.salary_max, dto.salary_negotiable),
    location: dto.industrial_park
      ? `${dto.industrial_park.name}, ${dto.province_name}`
      : dto.province_name,
    deadlineLabel: formatDeadline(dto.deadline ?? null),
  };
}

export function toJobCategoryTabsVM(categories: JobCategoryWithCountDTO[]): JobCategoryTab[] {
  return [
    { slug: "all", label: "Tất cả" },
    ...categories.map((category) => ({
      slug: category.slug as JobCategoryTab["slug"],
      label: category.name,
    })),
  ];
}

export function toJobCategoryCardVM(categories: JobCategoryWithCountDTO[]): JobCategoryCard[] {
  return categories.map((category) => ({
    slug: category.slug as JobCategoryCard["slug"],
    label: category.name,
    countLabel: `${category.job_count} việc làm`,
  }));
}
