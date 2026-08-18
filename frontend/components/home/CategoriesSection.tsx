import { Container } from "@/components/ui/Container";
import { SectionHeading } from "@/components/ui/SectionHeading";
import {
  IconBriefcase,
  IconFactory,
  IconGear,
  IconStore,
  IconTruck,
} from "@/components/ui/icons";
import type { JobCategoryCard } from "@/lib/view-models/types";
import { revealStyle } from "@/lib/reveal";

// `category.slug` thực chất là string tự do từ DB (ép kiểu qua `as` ở
// toJobCategoryCardVM — xem D8 trong docs/DECISIONS.md), admin tạo được ngành
// nghề mới qua CRUD danh mục (P10.2) với slug bất kỳ không nằm trong 4 khoá cố
// định này. Thiếu fallback đã gây crash 500 toàn bộ trang chủ ngày 2026-08-18
// khi slug "may-mac" không khớp — xem docs/PITFALLS.md.
const icons: Record<string, typeof IconFactory> = {
  sx: IconFactory,
  kt: IconGear,
  dv: IconStore,
  kv: IconTruck,
};

export function CategoriesSection({ categories }: { categories: JobCategoryCard[] }) {
  return (
    <section className="bg-white py-10 md:py-14">
      <Container>
        <SectionHeading
          title="Ngành nghề nổi bật"
          description="Chọn lĩnh vực bạn quan tâm để xem việc làm phù hợp"
        />
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          {categories.map((category, index) => {
            const Icon = icons[category.slug] ?? IconBriefcase;
            return (
              <div
                key={category.slug}
                data-reveal
                suppressHydrationWarning
                style={revealStyle(index)}
                className="reveal rounded-xl border border-border bg-white p-4 shadow-brand"
              >
                <div className="mb-2.5 flex h-10 w-10 items-center justify-center rounded-lg bg-primary-100 text-primary-700">
                  <Icon className="h-5 w-5" />
                </div>
                <h3 className="text-sm font-bold">{category.label}</h3>
                <span className="text-xs text-text-muted">{category.countLabel}</span>
              </div>
            );
          })}
        </div>
      </Container>
    </section>
  );
}
