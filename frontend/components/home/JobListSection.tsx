"use client";

import { useState } from "react";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { jobCategories, jobs, type JobCategorySlug } from "@/lib/mock-data";
import { JobCard } from "@/components/home/JobCard";

export function JobListSection() {
  const [activeCategory, setActiveCategory] = useState<"all" | JobCategorySlug>("all");

  return (
    <section id="viec-lam">
      <div className="mx-auto w-full max-w-brand px-4">
        <SectionHeading
          title="Việc làm mới nhất"
          description="Cập nhật liên tục từ các doanh nghiệp đối tác của LA Group"
          moreHref="#"
          moreLabel="Xem tất cả việc làm →"
        />

        <div
          data-reveal
          className="reveal no-scrollbar mb-4 flex gap-2 overflow-x-auto pb-1"
        >
          {jobCategories.map((category) => (
            <button
              key={category.slug}
              type="button"
              onClick={() => setActiveCategory(category.slug)}
              className={`min-h-10 flex-shrink-0 rounded-full border px-4 text-[13px] font-bold transition-colors ${
                activeCategory === category.slug
                  ? "border-primary-600 bg-primary-600 text-white"
                  : "border-border bg-white text-text-muted"
              }`}
            >
              {category.label}
            </button>
          ))}
        </div>

        <div className="flex flex-col gap-3">
          {jobs.map((job, index) => (
            <JobCard
              key={job.id}
              job={job}
              index={index}
              hidden={activeCategory !== "all" && job.category !== activeCategory}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
