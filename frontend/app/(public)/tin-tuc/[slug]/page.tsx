import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Container } from "@/components/ui/Container";
import { serverFetch } from "@/lib/api/client";
import { formatDate, splitParagraphs } from "@/lib/format";
import type { components } from "@/lib/api/schema";

type PostDetailDTO = components["schemas"]["PostDetail"];

const TAG_LABELS: Record<string, string> = {
  news: "Tin tức",
  policy: "Chính sách",
  guide: "Hướng dẫn",
  event: "Sự kiện",
  scam_alert: "Cảnh báo",
};

async function getPost(slug: string) {
  const res = await serverFetch<PostDetailDTO>(`/api/posts/${slug}`);
  return res.ok ? res.data : null;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPost(slug);
  if (!post) return {};

  const title = post.meta_title || `${post.title} | LA Group`;
  const description = post.meta_description || post.excerpt || post.title;

  return {
    title,
    description,
    alternates: { canonical: `/tin-tuc/${post.slug}` },
    openGraph: {
      title,
      description,
      type: "article",
      publishedTime: post.published_at ?? undefined,
    },
  };
}

export default async function PostDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const post = await getPost(slug);
  if (!post) notFound();

  const paragraphs = splitParagraphs(post.content ?? post.excerpt);

  return (
    <Container className="max-w-[820px] py-8 md:py-12">
      <div data-reveal className="reveal">
        <span className="text-xs font-extrabold uppercase tracking-wide text-primary-700">
          {TAG_LABELS[post.type] ?? "Tin tức"}
        </span>
        <h1 className="mt-2 text-xl font-extrabold md:text-2xl">{post.title}</h1>
        {post.published_at ? (
          <p className="mt-2 text-sm text-text-muted">{formatDate(post.published_at)}</p>
        ) : null}
      </div>

      <article data-reveal className="reveal mt-6">
        {paragraphs.length > 0 ? (
          paragraphs.map((paragraph, index) => (
            <p key={index} className="mb-3 text-[15px] leading-relaxed text-text">
              {paragraph}
            </p>
          ))
        ) : (
          <p className="text-sm text-text-muted">Đang cập nhật nội dung.</p>
        )}
      </article>

      <div className="mt-8">
        <Link href="/tin-tuc" className="text-sm font-bold text-primary-700">
          ← Xem tất cả tin tức
        </Link>
      </div>
    </Container>
  );
}
