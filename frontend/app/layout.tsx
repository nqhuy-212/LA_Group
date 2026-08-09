import type { Metadata } from "next";
import "./globals.css";

// Biến RUNTIME (không phải NEXT_PUBLIC_*) — chỉ dùng ở Server Component nên không
// cần inline vào bundle client. Nhờ vậy đổi domain chỉ cần sửa .env.prod + restart,
// không phải build lại image (Next đóng băng mọi NEXT_PUBLIC_* vào bundle lúc build).
const SITE_URL = process.env.SITE_URL ?? "http://localhost:3000";
const SITE_TITLE = "LA Group (LAHR) – Cung ứng nhân lực & kết nối việc làm tại Hải Dương";
const SITE_DESCRIPTION =
  "LA Group (Công ty CP Dịch vụ Cung ứng Nhân lực LA - LAHR) - Cung ứng, cho thuê lại lao động cho các khu công nghiệp tại Hải Dương và miền Bắc. Tìm việc làm, tư vấn AI, chính sách công ty.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: SITE_TITLE,
  description: SITE_DESCRIPTION,
  openGraph: {
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    siteName: "LA Group",
    locale: "vi_VN",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi" className="h-full antialiased">
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
