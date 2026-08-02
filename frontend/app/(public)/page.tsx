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
import { newPartnerFeed, scamAlertFeed } from "@/lib/mock-data";

export default function HomePage() {
  return (
    <>
      <HeroSection />
      <EventsSection />
      <JobListSection />
      <CategoriesSection />
      <AiBannerSection />
      <NewsSection />
      <FeedListSection
        title="Doanh nghiệp mới"
        description="Đối tác tuyển dụng vừa gia nhập mạng lưới LA Group"
        items={newPartnerFeed}
      />
      <FeedListSection
        title="Cảnh báo lừa đảo tuyển dụng"
        description="Thông tin cảnh báo mới nhất để bảo vệ người lao động"
        items={scamAlertFeed}
        alert
      >
        <WarnBox />
      </FeedListSection>
      <BizCtaSection />
      <AboutSection />
    </>
  );
}
