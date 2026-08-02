"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

/**
 * Observes every `[data-reveal]` element currently in the DOM and toggles
 * `.is-visible` when it scrolls into view. Mounted once near the app root so
 * server-rendered sections can stay plain server components and simply mark
 * themselves with `data-reveal` + the `reveal` class.
 *
 * Re-runs on every pathname change: this component lives in the shared
 * `(public)` layout, which persists across client-side navigation, so without
 * the `pathname` dependency a page navigated to via `<Link>` would mount new
 * `[data-reveal]` elements that never get observed (stuck at `opacity: 0`).
 */
export function ScrollReveal() {
  const pathname = usePathname();

  useEffect(() => {
    const els = Array.from(document.querySelectorAll<HTMLElement>("[data-reveal]"));
    if (els.length === 0) return;

    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduceMotion || !("IntersectionObserver" in window)) {
      els.forEach((el) => el.classList.add("is-visible"));
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.15, rootMargin: "0px 0px -40px 0px" },
    );

    els.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [pathname]);

  return null;
}
