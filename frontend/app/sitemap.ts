import type { MetadataRoute } from "next";
import { serverFetch } from "@/lib/api/client";
import type { components } from "@/lib/api/schema";

type JobsPageDTO = components["schemas"]["PageResponse_JobListItem_"];
type PostListItemDTO = components["schemas"]["PostListItem"];

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
const MAX_PAGES = 20; // an toàn chống vòng lặp vô hạn nếu API trả sai page_size

const STATIC_ROUTES: MetadataRoute.Sitemap = [
  { url: `${SITE_URL}/`, changeFrequency: "daily", priority: 1 },
  { url: `${SITE_URL}/viec-lam`, changeFrequency: "hourly", priority: 0.9 },
  { url: `${SITE_URL}/tin-tuc`, changeFrequency: "daily", priority: 0.7 },
  { url: `${SITE_URL}/chinh-sach-bao-mat`, changeFrequency: "yearly", priority: 0.3 },
];

async function fetchAllJobs() {
  const jobs: { slug: string; publishedAt: string | null }[] = [];
  for (let page = 1; page <= MAX_PAGES; page += 1) {
    const res = await serverFetch<JobsPageDTO>(`/api/jobs?page=${page}&page_size=50`, {
      revalidate: 3600,
    });
    if (!res.ok) break;
    jobs.push(...res.data.items.map((job) => ({ slug: job.slug, publishedAt: job.published_at })));
    if (res.data.items.length < res.data.page_size) break;
  }
  return jobs;
}

async function fetchAllPosts() {
  const res = await serverFetch<PostListItemDTO[]>("/api/posts?limit=50", { revalidate: 3600 });
  if (!res.ok) return [];
  return res.data.map((post) => ({ slug: post.slug, publishedAt: post.published_at }));
}

// Sitemap KHÔNG được phép trả lỗi (500 là tín hiệu xấu với Google) — nếu API
// backend không phản hồi được, fallback về đúng 4 route tĩnh thay vì để crash.
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  try {
    const [jobs, posts] = await Promise.all([fetchAllJobs(), fetchAllPosts()]);

    const jobEntries: MetadataRoute.Sitemap = jobs.map((job) => ({
      url: `${SITE_URL}/viec-lam/${job.slug}`,
      lastModified: job.publishedAt ?? undefined,
      changeFrequency: "daily",
      priority: 0.8,
    }));

    const postEntries: MetadataRoute.Sitemap = posts.map((post) => ({
      url: `${SITE_URL}/tin-tuc/${post.slug}`,
      lastModified: post.publishedAt ?? undefined,
      changeFrequency: "monthly",
      priority: 0.5,
    }));

    return [...STATIC_ROUTES, ...jobEntries, ...postEntries];
  } catch {
    return STATIC_ROUTES;
  }
}
