import type { MetadataRoute } from "next";

// Biến runtime — xem ghi chú ở app/layout.tsx.
const SITE_URL = process.env.SITE_URL ?? "http://localhost:3000";

// Không có `fetch` nào trong route này để kế thừa `revalidate`, nên mặc định
// Next cache VÔ THỜI HẠN (revalidate: Infinity — xem node_modules/next/dist/docs/
// .../caching-without-cache-components.md). Không khai báo tường minh thì đổi
// domain (VPS.md §10) sẽ không bao giờ tự cập nhật URL sitemap bên dưới, khác
// với sitemap.ts (tự lành sau 1h nhờ revalidate trên các fetch bên trong).
export const revalidate = 3600;

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
