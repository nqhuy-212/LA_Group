import { Container } from "@/components/ui/Container";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { EventsCarousel } from "@/components/home/EventsCarousel";
import { events } from "@/lib/mock-data";

export function EventsSection() {
  return (
    <section className="bg-gradient-to-br from-primary-700 to-primary-800 py-7 pb-5">
      <Container>
        <SectionHeading title="Tin tức – Sự kiện mới" moreHref="#" tone="dark" className="mb-3.5" />
      </Container>
      <EventsCarousel events={events} />
    </section>
  );
}
