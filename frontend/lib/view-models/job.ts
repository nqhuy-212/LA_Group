import {
  addDaysIso,
  formatAgeRange,
  formatDeadline,
  formatSalary,
  initials,
  splitParagraphs,
  toIsoDate,
} from "@/lib/format";
import type { components } from "@/lib/api/schema";
import type {
  JobCardVM,
  JobCategoryCard,
  JobCategoryTab,
  JobDetailVM,
} from "@/lib/view-models/types";

export type JobListItemDTO = components["schemas"]["JobListItem"];
export type JobDetailDTO = components["schemas"]["JobDetail"];
export type JobCategoryWithCountDTO = components["schemas"]["JobCategoryWithCount"];

const EMPLOYMENT_TYPE_LABELS: Record<string, string> = {
  official: "Chính thức",
  seasonal: "Thời vụ",
};

const SALARY_PERIOD_LABELS: Record<string, string> = {
  weekly: "Lương tuần",
  monthly: "Lương tháng",
};

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
    employmentType: dto.employment_type ? EMPLOYMENT_TYPE_LABELS[dto.employment_type] : null,
    salaryPeriodLabel: dto.salary_period ? SALARY_PERIOD_LABELS[dto.salary_period] : null,
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

export function toJobDetailVM(dto: JobDetailDTO): JobDetailVM {
  return {
    ...toJobCardVM(dto),
    quantityLabel: `Tuyển ${dto.quantity} người`,
    ageLabel: formatAgeRange(dto.age_min, dto.age_max),
    shiftType: dto.shift_type,
    description: splitParagraphs(dto.description),
    requirements: splitParagraphs(dto.requirements),
    benefits: splitParagraphs(dto.benefits),
    isExpired: dto.status !== "published",
    publishedDateLabel: dto.published_at
      ? new Intl.DateTimeFormat("vi-VN", {
          day: "2-digit",
          month: "2-digit",
          year: "numeric",
          timeZone: "Asia/Ho_Chi_Minh",
        }).format(new Date(dto.published_at))
      : null,
  };
}

// Không có mô tả thật trong DB (field nullable) vẫn phải sinh ra description hợp lệ —
// Google Rich Results Test coi `description` rỗng là lỗi bắt buộc của JobPosting.
function jobPostingDescription(dto: JobDetailDTO): string {
  if (dto.description) return dto.description;
  const location = dto.industrial_park
    ? `${dto.industrial_park.name}, ${dto.province_name}`
    : dto.province_name;
  return `${dto.title} tại ${dto.company.name}. Mức lương ${formatSalary(
    dto.salary_min,
    dto.salary_max,
    dto.salary_negotiable,
  )}. Làm việc tại ${location}. Ứng tuyển ngay cùng LA Group (LAHR).`;
}

export function buildJobPostingJsonLd(dto: JobDetailDTO): Record<string, unknown> {
  const datePosted = dto.published_at ?? new Date().toISOString();
  const validThrough = toIsoDate(dto.deadline) ?? addDaysIso(datePosted, 30);
  const hasSalary =
    !dto.salary_negotiable && (dto.salary_min != null || dto.salary_max != null);

  return {
    "@context": "https://schema.org",
    "@type": "JobPosting",
    title: dto.title,
    description: jobPostingDescription(dto),
    datePosted,
    validThrough,
    hiringOrganization: {
      "@type": "Organization",
      name: dto.company.name,
      ...(dto.company.logo_url ? { logo: dto.company.logo_url } : {}),
    },
    jobLocation: {
      "@type": "Place",
      address: {
        "@type": "PostalAddress",
        addressCountry: "VN",
        addressRegion: dto.province_name,
        ...(dto.industrial_park ? { addressLocality: dto.industrial_park.name } : {}),
      },
    },
    ...(hasSalary
      ? {
          baseSalary: {
            "@type": "MonetaryAmount",
            currency: "VND",
            value: {
              "@type": "QuantitativeValue",
              minValue: dto.salary_min ?? dto.salary_max,
              maxValue: dto.salary_max ?? dto.salary_min,
              unitText: "MONTH",
            },
          },
        }
      : {}),
  };
}
