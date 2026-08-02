import Link from "next/link";
import { type ReactNode } from "react";

export function SectionHeading({
  title,
  description,
  moreHref,
  moreLabel = "Xem tất cả →",
  tone = "light",
  className = "",
}: {
  title: ReactNode;
  description?: ReactNode;
  moreHref?: string;
  moreLabel?: string;
  tone?: "light" | "dark";
  className?: string;
}) {
  const titleColor = tone === "dark" ? "text-white" : "text-text";
  const moreColor = tone === "dark" ? "text-white" : "text-primary-700";

  return (
    <div
      data-reveal
      className={`reveal mb-5 flex flex-wrap items-end justify-between gap-3 ${className}`}
    >
      <div>
        <h2 className={`text-xl font-extrabold ${titleColor}`}>{title}</h2>
        {description ? (
          <p className="mt-1 text-sm text-text-muted">{description}</p>
        ) : null}
      </div>
      {moreHref ? (
        <Link
          href={moreHref}
          className={`whitespace-nowrap text-sm font-bold ${moreColor}`}
        >
          {moreLabel}
        </Link>
      ) : null}
    </div>
  );
}
