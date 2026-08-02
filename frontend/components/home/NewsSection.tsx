import Link from "next/link";
import { Container } from "@/components/ui/Container";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { IconFileText } from "@/components/ui/icons";
import type { NewsPost } from "@/lib/view-models/types";
import { revealStyle } from "@/lib/reveal";

export function NewsSection({ posts }: { posts: NewsPost[] }) {
  return (
    <section id="tin-tuc" className="bg-white py-10 md:py-14">
      <Container>
        <SectionHeading
          title="Chính sách & Tin tức"
          description="Thông tin chính sách lao động và hoạt động của LA Group"
          moreHref="/tin-tuc"
        />
        {posts.length === 0 ? (
          <p className="py-6 text-center text-sm text-text-muted">Đang cập nhật...</p>
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
                <span className="mt-2.5 block text-[11.5px] text-text-muted">
                  {post.dateLabel}
                </span>
              </div>
            </Link>
          ))}
        </div>
        )}
      </Container>
    </section>
  );
}
