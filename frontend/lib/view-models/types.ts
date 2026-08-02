// Di chuyển nguyên xi từ lib/mock-data.ts (P3, D14) — giữ nguyên 100% field hiển thị
// để 6 component trang chủ không phải đổi JSX, chỉ đổi nguồn dữ liệu.
export type JobCategorySlug = "sx" | "kt" | "dv" | "kv";

export type JobCardVM = {
  id: string;
  href: string;
  title: string;
  company: string;
  logoInitials: string;
  category: JobCategorySlug;
  hot?: boolean;
  salaryLabel: string;
  location: string;
  deadlineLabel: string;
};

export type JobCategoryTab = {
  slug: "all" | JobCategorySlug;
  label: string;
};

export type JobCategoryCard = {
  slug: JobCategorySlug;
  label: string;
  countLabel: string;
};

export type JobDetailVM = JobCardVM & {
  quantityLabel: string;
  ageLabel: string | null;
  shiftType: string | null;
  employmentType: string | null;
  description: string[];
  requirements: string[];
  benefits: string[];
  isExpired: boolean;
  publishedDateLabel: string | null;
};

export type EventItem = {
  id: string;
  href: string;
  title: string;
  dateLabel: string;
  icon: "calendar" | "graduation" | "users";
};

export type NewsPost = {
  id: string;
  href: string;
  tag: string;
  title: string;
  excerpt: string;
  dateLabel: string;
};

export type FeedItem = {
  id: string;
  href: string;
  title: string;
  dateLabel: string;
  icon: "store" | "factory" | "truck" | "alert-triangle" | "alert-circle" | "mail";
};
