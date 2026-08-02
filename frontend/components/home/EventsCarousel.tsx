"use client";

import Link from "next/link";
import { useRef, useState } from "react";
import { IconCalendarBox, IconGraduationCap, IconUsers } from "@/components/ui/icons";
import type { EventItem } from "@/lib/mock-data";
import { revealStyle } from "@/lib/reveal";

const icons = {
  calendar: IconCalendarBox,
  graduation: IconGraduationCap,
  users: IconUsers,
};

export function EventsCarousel({ events }: { events: EventItem[] }) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [activeIndex, setActiveIndex] = useState(0);

  function handleScroll() {
    const track = trackRef.current;
    if (!track) return;
    const cards = Array.from(track.querySelectorAll<HTMLElement>("[data-event-card]"));
    const trackCenter = track.scrollLeft + track.clientWidth / 2;
    let closest = 0;
    let minDist = Infinity;
    cards.forEach((card, i) => {
      const dist = Math.abs(card.offsetLeft + card.offsetWidth / 2 - trackCenter);
      if (dist < minDist) {
        minDist = dist;
        closest = i;
      }
    });
    setActiveIndex(closest);
  }

  return (
    <div>
      <div
        ref={trackRef}
        onScroll={handleScroll}
        data-reveal
        className="reveal no-scrollbar flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-1.5 pt-1 md:px-0"
      >
        {events.map((event, index) => {
          const Icon = icons[event.icon];
          return (
            <Link
              key={event.id}
              href="#"
              data-event-card
              className="flex flex-shrink-0 basis-[78%] snap-start flex-col overflow-hidden rounded-xl bg-white shadow-brand-lg md:basis-[calc(33.333%-8px)]"
              style={revealStyle(index)}
            >
              <div className="flex h-[120px] items-center justify-center bg-gradient-to-br from-primary-100 to-[#dcebfb] text-primary-700">
                <Icon className="h-10 w-10" />
              </div>
              <div className="flex-1 px-3.5 pt-3">
                <h3 className="text-[13.5px] font-bold leading-snug">{event.title}</h3>
                <span className="mt-2 block text-[11.5px] text-text-muted">
                  {event.dateLabel}
                </span>
              </div>
              <span className="m-3.5 mt-2.5 rounded-lg border border-border py-2.5 text-center text-sm font-bold text-primary-700">
                Xem thêm
              </span>
            </Link>
          );
        })}
      </div>
      <div className="mt-3.5 flex justify-center gap-1.5">
        {events.map((event, index) => (
          <span
            key={event.id}
            className={`h-1.5 rounded-full bg-white/35 transition-all ${
              index === activeIndex ? "w-[18px] bg-white" : "w-1.5"
            }`}
          />
        ))}
      </div>
    </div>
  );
}
