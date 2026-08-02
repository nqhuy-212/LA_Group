import { Container } from "@/components/ui/Container";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { EventsCarousel } from "@/components/home/EventsCarousel";
import type { EventItem } from "@/lib/view-models/types";

export function EventsSection({ events }: { events: EventItem[] }) {
  return (
    <section className="bg-gradient-to-br from-primary-700 to-primary-800 py-7 pb-5">
      <Container>
        <SectionHeading title="Tin tức – Sự kiện mới" moreHref="#" tone="dark" className="mb-3.5" />
      </Container>
      {events.length === 0 ? (
        <p className="px-4 text-center text-sm text-primary-100">Đang cập nhật...</p>
      ) : (
        <EventsCarousel events={events} />
      )}
    </section>
  );
}
