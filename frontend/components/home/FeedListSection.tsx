import Link from "next/link";
import type { ReactNode } from "react";
import { Container } from "@/components/ui/Container";
import { SectionHeading } from "@/components/ui/SectionHeading";
import {
  IconAlertCircle,
  IconAlertTriangle,
  IconFactory,
  IconMail,
  IconStore,
  IconTruck,
} from "@/components/ui/icons";
import type { FeedItem } from "@/lib/mock-data";
import { revealStyle } from "@/lib/reveal";

const icons = {
  store: IconStore,
  factory: IconFactory,
  truck: IconTruck,
  "alert-triangle": IconAlertTriangle,
  "alert-circle": IconAlertCircle,
  mail: IconMail,
};

export function FeedListSection({
  title,
  description,
  items,
  alert = false,
  children,
}: {
  title: string;
  description: string;
  items: FeedItem[];
  alert?: boolean;
  children?: ReactNode;
}) {
  return (
    <section className={alert ? "" : "bg-white"}>
      <Container className="py-10 md:py-14">
        <SectionHeading title={title} description={description} moreHref={alert ? undefined : "#"} />
        <div className="flex flex-col">
          {items.map((item, index) => {
            const Icon = icons[item.icon];
            return (
              <Link
                key={item.id}
                href="#"
                data-reveal
                style={revealStyle(index)}
                className="reveal flex items-start gap-3 border-b border-border py-3 last:border-none"
              >
                <div
                  className={`flex h-[60px] w-[60px] flex-shrink-0 items-center justify-center rounded-lg ${
                    alert
                      ? "bg-gradient-to-br from-[#fde3e1] to-[#fbd0cc] text-accent-dark"
                      : "bg-gradient-to-br from-primary-100 to-[#dcebfb] text-primary-700"
                  }`}
                >
                  <Icon className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="text-[13.5px] font-bold leading-snug">{item.title}</h4>
                  <span className="mt-1.5 block text-[11.5px] text-text-muted">
                    {item.dateLabel}
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
        {children}
      </Container>
    </section>
  );
}
