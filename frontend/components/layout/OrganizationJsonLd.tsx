// Biến runtime — xem ghi chú ở app/layout.tsx. Component này là Server Component
// (không có "use client") nên đọc được env lúc chạy.
const SITE_URL = process.env.SITE_URL ?? "http://localhost:3000";

// Dữ liệu pháp nhân chính thức — khớp .claude/rules/company-info.md, không tự ý
// đổi (MST/địa chỉ/điện thoại là thông tin đăng ký kinh doanh thật của LAHR).
const ORGANIZATION_JSON_LD = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "Công ty Cổ phần Dịch vụ Cung ứng Nhân lực LA",
  alternateName: ["LA Group", "LAHR"],
  url: SITE_URL,
  logo: `${SITE_URL}/logo-icon.png`,
  telephone: "+84922869966",
  email: "lahrservice2023@gmail.com",
  taxID: "0801411964",
  address: {
    "@type": "PostalAddress",
    streetAddress: "Số 72, phố Hải Hưng, Khu đô thị Ecorivers",
    addressLocality: "Phường Hải Tân",
    addressRegion: "Hải Dương",
    addressCountry: "VN",
  },
};

export function OrganizationJsonLd() {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(ORGANIZATION_JSON_LD) }}
    />
  );
}
