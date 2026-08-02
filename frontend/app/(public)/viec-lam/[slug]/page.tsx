import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { JobCard } from "@/components/home/JobCard";
import { ButtonLink } from "@/components/ui/Button";
import { Container } from "@/components/ui/Container";
import { HotBadge } from "@/components/ui/Badge";
import { IconClock, IconMapPin, IconPhone, IconWallet } from "@/components/ui/icons";
import { serverFetch } from "@/lib/api/client";
import type { components } from "@/lib/api/schema";
import {
  buildJobPostingJsonLd,
  toJobCardVM,
  toJobDetailVM,
  type JobDetailDTO,
  type JobListItemDTO,
} from "@/lib/view-models/job";

type JobsPageDTO = components["schemas"]["PageResponse_JobListItem_"];

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

  const isExpired = job.status !== "published";
  const title = job.meta_title || `${job.title} - ${job.company.name} | LA Group`;
  const description =
    job.meta_description ||
    job.description ||
    `Tuyển dụng ${job.title} tại ${job.company.name}, ${job.province_name}. Ứng tuyển ngay cùng LA Group (LAHR).`;

  return {
    title,
    description,
    alternates: { canonical: `/viec-lam/${job.slug}` },
    openGraph: { title, description },
    // Tin hết hạn/đóng KHÔNG trả 404 (mất backlink + mất index) — chỉ gắn
    // noindex, Google Jobs tự loại theo validThrough.
    robots: isExpired ? { index: false, follow: true } : undefined,
  };
}

export default async function JobDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const job = await getJob(slug);
  if (!job) notFound();

  const vm = toJobDetailVM(job);
  const jsonLd = buildJobPostingJsonLd(job);

  const relatedRes = await serverFetch<JobsPageDTO>(
    `/api/jobs?category=${job.category.slug}&page_size=5`,
    { revalidate: 300 },
  );
  const relatedJobs = relatedRes.ok
    ? relatedRes.data.items
        .filter((item: JobListItemDTO) => item.slug !== job.slug)
        .slice(0, 4)
        .map((item: JobListItemDTO) => toJobCardVM(item))
    : [];

  return (
    <Container className="py-8 md:py-12">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {vm.isExpired ? (
        <div
          data-reveal
          className="reveal mb-5 rounded-xl border border-accent/30 bg-accent/10 px-4 py-3 text-sm font-semibold text-accent-dark"
        >
          Tin tuyển dụng này đã hết hạn hoặc ngừng nhận hồ sơ. Xem các việc làm tương tự bên dưới.
        </div>
      ) : null}

      <div data-reveal className="reveal rounded-xl border border-border bg-white p-5 shadow-brand md:p-7">
        <div className="flex flex-wrap items-start gap-3">
          <div className="flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-lg bg-primary-100 text-base font-extrabold text-primary-700">
            {vm.logoInitials}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-lg font-extrabold md:text-xl">{vm.title}</h1>
              {vm.hot ? <HotBadge /> : null}
            </div>
            <p className="mt-0.5 text-sm text-text-muted">{vm.company}</p>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap gap-4 border-t border-border pt-4">
          <span className="inline-flex items-center gap-1.5 text-sm font-bold text-accent-dark">
            <IconWallet className="h-4 w-4" />
            {vm.salaryLabel}
          </span>
          <span className="inline-flex items-center gap-1.5 text-sm text-text-muted">
            <IconMapPin className="h-4 w-4" />
            {vm.location}
          </span>
          <span className="inline-flex items-center gap-1.5 text-sm text-text-muted">
            <IconClock className="h-4 w-4" />
            {vm.deadlineLabel}
          </span>
        </div>

        <div className="mt-3 flex flex-wrap gap-2 text-xs text-text-muted">
          <span className="rounded-full bg-bg px-3 py-1">{vm.quantityLabel}</span>
          {vm.ageLabel ? <span className="rounded-full bg-bg px-3 py-1">{vm.ageLabel}</span> : null}
          {vm.shiftType ? <span className="rounded-full bg-bg px-3 py-1">{vm.shiftType}</span> : null}
          {vm.employmentType ? (
            <span className="rounded-full bg-bg px-3 py-1">{vm.employmentType}</span>
          ) : null}
        </div>

        {vm.description.length > 0 ? (
          <section className="mt-6">
            <h2 className="mb-2 text-base font-extrabold">Mô tả công việc</h2>
            {vm.description.map((paragraph, index) => (
              <p key={index} className="mb-2 text-sm text-text">
                {paragraph}
              </p>
            ))}
          </section>
        ) : null}

        {vm.requirements.length > 0 ? (
          <section className="mt-5">
            <h2 className="mb-2 text-base font-extrabold">Yêu cầu ứng viên</h2>
            {vm.requirements.map((paragraph, index) => (
              <p key={index} className="mb-2 text-sm text-text">
                {paragraph}
              </p>
            ))}
          </section>
        ) : null}

        {vm.benefits.length > 0 ? (
          <section className="mt-5">
            <h2 className="mb-2 text-base font-extrabold">Quyền lợi</h2>
            {vm.benefits.map((paragraph, index) => (
              <p key={index} className="mb-2 text-sm text-text">
                {paragraph}
              </p>
            ))}
          </section>
        ) : null}

        <div className="mt-6 flex flex-col gap-3 rounded-xl bg-primary-50 p-4 md:flex-row md:items-center md:justify-between">
          <p className="text-sm font-semibold text-primary-900">
            Quan tâm vị trí này? Gọi ngay hoặc để lại thông tin qua chatbot AI để được LA Group tư
            vấn và hẹn lịch phỏng vấn.
          </p>
          <ButtonLink href="tel:0922869966" variant="accent" className="flex-shrink-0">
            <IconPhone className="h-4 w-4" />
            Gọi ngay: 0922.86.99.66
          </ButtonLink>
        </div>
      </div>

      {relatedJobs.length > 0 ? (
        <section data-reveal className="reveal mt-8">
          <h2 className="mb-4 text-lg font-extrabold">Việc làm tương tự</h2>
          <div className="flex flex-col gap-3">
            {relatedJobs.map((related, index) => (
              <JobCard key={related.id} job={related} index={index} />
            ))}
          </div>
        </section>
      ) : null}

      <div className="mt-6">
        <Link href="/viec-lam" className="text-sm font-bold text-primary-700">
          ← Xem tất cả việc làm
        </Link>
      </div>
    </Container>
  );
}
