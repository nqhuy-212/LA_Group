import { AboutSection } from "@/components/home/AboutSection";
import { AiBannerSection } from "@/components/home/AiBannerSection";
import { BizCtaSection } from "@/components/home/BizCtaSection";
import { CategoriesSection } from "@/components/home/CategoriesSection";
import { EventsSection } from "@/components/home/EventsSection";
import { FeedListSection } from "@/components/home/FeedListSection";
import { HeroSection } from "@/components/home/HeroSection";
import { JobListSection } from "@/components/home/JobListSection";
import { NewsSection } from "@/components/home/NewsSection";
import { WarnBox } from "@/components/home/WarnBox";
import { serverFetch } from "@/lib/api/client";
import {
  toJobCardVM,
  toJobCategoryCardVM,
  toJobCategoryTabsVM,
  type JobCategoryWithCountDTO,
  type JobListItemDTO,
} from "@/lib/view-models/job";
import {
  toEventItemVM,
  toNewPartnerFeedItemVM,
  toNewsPostVM,
  toScamAlertFeedItemVM,
  type CompanyPublicDTO,
  type PostListItemDTO,
} from "@/lib/view-models/post";

export const revalidate = 300;

type JobsPage = { items: JobListItemDTO[]; total: number; page: number; page_size: number };

export default async function HomePage() {
  const [jobsRes, categoriesRes, eventsRes, newsRes, partnersRes, scamAlertsRes] =
    await Promise.all([
      serverFetch<JobsPage>("/api/jobs?page_size=20"),
      serverFetch<JobCategoryWithCountDTO[]>("/api/job-categories"),
      serverFetch<PostListItemDTO[]>("/api/posts?type=event&limit=3"),
      serverFetch<PostListItemDTO[]>("/api/posts?type=news,policy,guide&limit=3"),
      serverFetch<CompanyPublicDTO[]>("/api/companies/recent?limit=4"),
      serverFetch<PostListItemDTO[]>("/api/posts?type=scam_alert&limit=3"),
    ]);

  const categories = categoriesRes.ok ? categoriesRes.data : [];

  const jobs = jobsRes.ok ? jobsRes.data.items.map(toJobCardVM) : [];
  const categoryTabs = toJobCategoryTabsVM(categories);
  const categoryCards = toJobCategoryCardVM(categories);
  const events = eventsRes.ok ? eventsRes.data.map(toEventItemVM) : [];
  const news = newsRes.ok ? newsRes.data.map(toNewsPostVM) : [];
  const partners = partnersRes.ok ? partnersRes.data.map(toNewPartnerFeedItemVM) : [];
  const scamAlerts = scamAlertsRes.ok ? scamAlertsRes.data.map(toScamAlertFeedItemVM) : [];

  return (
    <>
      <HeroSection />
      <EventsSection events={events} />
      <JobListSection jobs={jobs} categoryTabs={categoryTabs} />
      <CategoriesSection categories={categoryCards} />
      <AiBannerSection />
      <NewsSection posts={news} />
      <FeedListSection
        title="Doanh nghiệp mới"
        description="Đối tác tuyển dụng vừa gia nhập mạng lưới LA Group"
        items={partners}
      />
      <FeedListSection
        title="Cảnh báo lừa đảo tuyển dụng"
        description="Thông tin cảnh báo mới nhất để bảo vệ người lao động"
        items={scamAlerts}
        alert
      >
        <WarnBox />
      </FeedListSection>
      <BizCtaSection />
      <AboutSection />
    </>
  );
}
