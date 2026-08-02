import type { Metadata } from "next";
import Link from "next/link";
import { Container } from "@/components/ui/Container";
import { IconFileText } from "@/components/ui/icons";
import { serverFetch } from "@/lib/api/client";
import { revealStyle } from "@/lib/reveal";
import { toNewsPostVM, type PostListItemDTO } from "@/lib/view-models/post";

const TABS: { value: string | undefined; label: string }[] = [
  { value: undefined, label: "Tất cả" },
  { value: "news", label: "Tin tức" },
  { value: "policy", label: "Chính sách" },
  { value: "guide", label: "Hướng dẫn" },
  { value: "event", label: "Sự kiện" },
  { value: "scam_alert", label: "Cảnh báo lừa đảo" },
];

const KNOWN_TYPES = new Set(TABS.map((tab) => tab.value).filter(Boolean));

type RawSearchParams = { loai?: string };

export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<RawSearchParams>;
}): Promise<Metadata> {
  const sp = await searchParams;
  const tab = TABS.find((t) => t.value === sp.loai);
  const title =
    tab && tab.value ? `${tab.label} | LA Group` : "Tin tức & Chính sách | LA Group (LAHR)";
  const description =
    "Tin tức hoạt động, chính sách lao động và cảnh báo lừa đảo tuyển dụng từ LA Group (LAHR).";
  return {
    title,
    description,
    alternates: { canonical: "/tin-tuc" },
    openGraph: { title, description },
  };
}

export default async function TinTucPage({
  searchParams,
}: {
  searchParams: Promise<RawSearchParams>;
}) {
  const sp = await searchParams;
  const loai = sp.loai && KNOWN_TYPES.has(sp.loai) ? sp.loai : undefined;

  // Backend `/api/posts` chỉ nhận `limit` (không phân trang) — đủ dùng ở quy mô
  // hiện tại (dưới 50 bài mỗi loại), không cần thêm offset cho MVP.
  const path = loai ? `/api/posts?type=${loai}&limit=50` : "/api/posts?limit=50";
  const postsRes = await serverFetch<PostListItemDTO[]>(path, { revalidate: 300 });
  const posts = postsRes.ok ? postsRes.data.map(toNewsPostVM) : [];

  return (
    <Container className="py-8 md:py-12">
      <div data-reveal className="reveal mb-5">
        <h1 className="text-xl font-extrabold md:text-2xl">Tin tức & Chính sách</h1>
        <p className="mt-1 text-sm text-text-muted">
          Cập nhật hoạt động, chính sách lao động và cảnh báo lừa đảo từ LA Group (LAHR)
        </p>
      </div>

      <div data-reveal className="reveal no-scrollbar mb-5 flex gap-2 overflow-x-auto pb-1">
        {TABS.map((tab) => (
          <Link
            key={tab.label}
            href={tab.value ? `/tin-tuc?loai=${tab.value}` : "/tin-tuc"}
            className={`min-h-10 flex-shrink-0 rounded-full border px-4 py-2 text-[13px] font-bold transition-colors ${
              loai === tab.value
                ? "border-primary-600 bg-primary-600 text-white"
                : "border-border bg-white text-text-muted"
            }`}
          >
            {tab.label}
          </Link>
        ))}
      </div>

      {posts.length === 0 ? (
        <p className="py-14 text-center text-sm text-text-muted">Đang cập nhật...</p>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {posts.map((post, index) => (
            <Link
              key={post.id}
              href={post.href}
              data-reveal
              style={revealStyle(index)}
              className="reveal overflow-hidden rounded-xl border border-border bg-white shadow-brand"
            >
              <div className="flex h-[150px] items-center justify-center bg-gradient-to-br from-primary-600 to-primary-900 text-white/85">
                <IconFileText className="h-11 w-11" />
              </div>
              <div className="px-4 pb-4 pt-3.5">
                <span className="text-[11px] font-extrabold uppercase tracking-wide text-primary-700">
                  {post.tag}
                </span>
                <h3 className="mt-1.5 text-[15px] font-bold">{post.title}</h3>
                <p className="mt-1.5 text-[13px] text-text-muted">{post.excerpt}</p>
                <span className="mt-2.5 block text-[11.5px] text-text-muted">{post.dateLabel}</span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </Container>
  );
}
