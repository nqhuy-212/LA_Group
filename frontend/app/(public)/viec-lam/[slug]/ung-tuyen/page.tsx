import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ApplyForm } from "@/components/forms/ApplyForm";
import { Container } from "@/components/ui/Container";
import { serverFetch } from "@/lib/api/client";
import { toJobDetailVM, type JobDetailDTO } from "@/lib/view-models/job";

async function getJob(slug: string) {
  const res = await serverFetch<JobDetailDTO>(`/api/jobs/${slug}`);
  return res.ok ? res.data : null;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const job = await getJob(slug);
  if (!job) return {};
  return {
    title: `Ứng tuyển ${job.title} | LA Group`,
    robots: { index: false, follow: true },
  };
}

export default async function ApplyPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const job = await getJob(slug);
  // Tin draft/hết hạn/đã đóng không nhận hồ sơ mới — không hiện banner như trang
  // chi tiết vì đây là trang hành động (ứng tuyển), không phải trang xem thông tin.
  if (!job || job.status !== "published") notFound();

  const vm = toJobDetailVM(job);

  return (
    <Container className="py-8 md:py-12">
      <div className="mx-auto w-full max-w-xl">
        <Link href={`/viec-lam/${slug}`} className="text-sm font-bold text-primary-700">
          ← Quay lại tin tuyển dụng
        </Link>

        <div className="mt-3 mb-6 rounded-xl border border-border bg-white p-4 shadow-brand">
          <h1 className="text-lg font-extrabold">Ứng tuyển: {vm.title}</h1>
          <p className="mt-0.5 text-sm text-text-muted">
            {vm.company} · {vm.location}
          </p>
        </div>

        <ApplyForm jobSlug={slug} />
      </div>
    </Container>
  );
}
