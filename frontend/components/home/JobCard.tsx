import Link from "next/link";
import { HotBadge } from "@/components/ui/Badge";
import { IconClock, IconMapPin, IconWallet } from "@/components/ui/icons";
import type { JobCardVM } from "@/lib/view-models/types";
import { revealStyle } from "@/lib/reveal";

export function JobCard({
  job,
  index,
  hidden,
}: {
  job: JobCardVM;
  index: number;
  hidden?: boolean;
}) {
  return (
    <Link
      href={job.href}
      data-reveal
      data-job-category={job.category}
      style={revealStyle(index)}
      className={`reveal flex items-start gap-3 rounded-xl border border-border bg-white p-3.5 shadow-brand transition-colors hover:border-primary-600 md:items-center ${
        hidden ? "hidden" : ""
      }`}
    >
      <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-lg bg-primary-100 text-sm font-extrabold text-primary-700">
        {job.logoInitials}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[15px] font-bold">{job.title}</span>
          {job.hot ? <HotBadge /> : null}
        </div>
        <div className="mt-0.5 text-[13px] text-text-muted">{job.company}</div>
        <div className="mt-2 flex flex-wrap gap-3">
          <span className="inline-flex items-center gap-1 text-[12.5px] font-bold text-accent-dark">
            <IconWallet className="h-3.5 w-3.5" />
            {job.salaryLabel}
          </span>
          <span className="inline-flex items-center gap-1 text-[12.5px] text-text-muted">
            <IconMapPin className="h-3.5 w-3.5" />
            {job.location}
          </span>
          <span className="inline-flex items-center gap-1 text-[12.5px] text-text-muted">
            <IconClock className="h-3.5 w-3.5" />
            {job.deadlineLabel}
          </span>
        </div>
      </div>
      <span className="hidden flex-shrink-0 rounded-lg bg-primary-600 px-5 py-2.5 text-sm font-bold text-white md:inline-flex">
        Ứng tuyển
      </span>
    </Link>
  );
}
