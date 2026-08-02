import { ChatWidget } from "@/components/chatbot/ChatWidget";
import { OrganizationJsonLd } from "@/components/layout/OrganizationJsonLd";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { ScrollReveal } from "@/components/ui/ScrollReveal";
import { serverFetch } from "@/lib/api/client";
import type { JobCategoryWithCountDTO } from "@/lib/view-models/job";
import type { components } from "@/lib/api/schema";

type IndustrialParkOutDTO = components["schemas"]["IndustrialParkOut"];

// Danh mục ngành nghề/KCN gần như tĩnh (đổi hoạ hoằn) — cache dài hơn dữ liệu
// job/post để tránh gọi lại API taxonomy trên mọi request của mọi trang.
const TAXONOMY_REVALIDATE_SECONDS = 3600;

export default async function PublicLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const [categoriesRes, parksRes] = await Promise.all([
    serverFetch<JobCategoryWithCountDTO[]>("/api/job-categories", {
      revalidate: TAXONOMY_REVALIDATE_SECONDS,
    }),
    serverFetch<IndustrialParkOutDTO[]>("/api/industrial-parks", {
      revalidate: TAXONOMY_REVALIDATE_SECONDS,
    }),
  ]);
  const categories = categoriesRes.ok ? categoriesRes.data : [];
  const industrialParks = parksRes.ok ? parksRes.data : [];

  return (
    <>
      <OrganizationJsonLd />
      <SiteHeader categories={categories} industrialParks={industrialParks} />
      <main className="flex-1">{children}</main>
      <SiteFooter />
      <ChatWidget />
      <ScrollReveal />
    </>
  );
}
