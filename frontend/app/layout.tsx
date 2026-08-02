import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "LA Group (LAHR) – Cung ứng nhân lực & kết nối việc làm tại Hải Dương",
  description:
    "LA Group (Công ty CP Dịch vụ Cung ứng Nhân lực LA - LAHR) - Cung ứng, cho thuê lại lao động cho các khu công nghiệp tại Hải Dương và miền Bắc. Tìm việc làm, tư vấn AI, chính sách công ty.",
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
