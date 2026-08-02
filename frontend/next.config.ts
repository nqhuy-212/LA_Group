import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  images: {
    remotePatterns: [],
  },
  async rewrites() {
    // Chỉ dùng ở dev để mô phỏng "một origin qua Nginx" (D5) cho các Client
    // Component gọi path tương đối /api/... — ở production, Nginx đảm nhiệm việc
    // này trực tiếp nên rewrite này không bao giờ được dùng tới.
    if (process.env.NODE_ENV === "production") return [];

    const internalApiUrl = process.env.INTERNAL_API_URL ?? "http://localhost:8000";
    return [
      {
        source: "/api/:path*",
        destination: `${internalApiUrl}/api/:path*`,
      },
    ];
  },
};

export default nextConfig;
