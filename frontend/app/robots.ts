import type { MetadataRoute } from "next";

// Biến runtime — xem ghi chú ở app/layout.tsx.
const SITE_URL = process.env.SITE_URL ?? "http://localhost:3000";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/dashboard", "/api"],
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
