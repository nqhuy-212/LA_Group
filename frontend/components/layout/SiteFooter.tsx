import Image from "next/image";
import Link from "next/link";
import {
  IconFacebook,
  IconMail,
  IconMapPin,
  IconPhone,
  IconPolicyDoc,
  IconYoutube,
  IconZalo,
} from "@/components/ui/icons";

const quickLinks = [
  { href: "/", label: "Trang chủ" },
  { href: "#viec-lam", label: "Việc làm" },
  { href: "#chatbot-ai", label: "Tư vấn AI" },
  { href: "#tin-tuc", label: "Chính sách & Tin tức" },
];

const candidateLinks = [
  { href: "#", label: "Hướng dẫn ứng tuyển" },
  { href: "#", label: "Câu hỏi thường gặp" },
  { href: "#", label: "Cảnh báo lừa đảo" },
  { href: "#", label: "Liên hệ hỗ trợ" },
];

export function SiteFooter() {
  return (
    <footer id="lien-he" className="bg-primary-950 text-primary-100">
      <div className="mx-auto grid w-full max-w-brand gap-7 px-4 py-10 md:grid-cols-[2fr_1fr_1fr_1.2fr] md:py-12">
        <div>
          <div className="flex items-center gap-2.5 text-white">
            <Image
              src="/logo-icon.png"
              alt="LA Group"
              width={40}
              height={40}
              className="h-10 w-10 object-contain"
            />
            <span className="font-extrabold leading-tight">
              LA Group
              <span className="block text-[10px] font-semibold tracking-wide text-primary-100">
                Human Resources
              </span>
            </span>
          </div>
          <p className="mt-2.5 text-[13px] text-primary-100/80">
            Công ty Cổ phần Dịch vụ Cung ứng Nhân lực LA (LAHR) — cung ứng, cho thuê lại lao
            động cho các doanh nghiệp, nhà máy tại Hải Dương và miền Bắc, đồng hành cùng chính
            sách lao động minh bạch, công bằng.
          </p>
          <div className="mt-3.5 flex gap-2.5">
            <a
              href="#"
              aria-label="Facebook"
              className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10 hover:bg-primary-600"
            >
              <IconFacebook className="h-4 w-4" />
            </a>
            <a
              href="#"
              aria-label="Zalo"
              className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10 hover:bg-primary-600"
            >
              <IconZalo className="h-4 w-4" />
            </a>
            <a
              href="#"
              aria-label="Youtube"
              className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10 hover:bg-primary-600"
            >
              <IconYoutube className="h-4 w-4" />
            </a>
          </div>
        </div>

        <div>
          <h4 className="mb-3.5 text-sm font-extrabold text-white">Liên kết nhanh</h4>
          <ul className="flex flex-col gap-2">
            {quickLinks.map((link) => (
              <li key={link.label}>
                <Link href={link.href} className="text-[13.5px] hover:text-white">
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h4 className="mb-3.5 text-sm font-extrabold text-white">Hỗ trợ ứng viên</h4>
          <ul className="flex flex-col gap-2">
            {candidateLinks.map((link) => (
              <li key={link.label}>
                <Link href={link.href} className="text-[13.5px] hover:text-white">
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h4 className="mb-3.5 text-sm font-extrabold text-white">Liên hệ</h4>
          <ul className="flex flex-col gap-2.5">
            <li className="flex items-start gap-2 text-[13.5px]">
              <IconMapPin className="mt-0.5 h-4 w-4 flex-shrink-0 text-primary-500" />
              <span>
                Số 72, phố Hải Hưng, KĐT Ecorivers, P. Hải Tân, TP. Hải Dương, T. Hải Dương
              </span>
            </li>
            <li className="flex items-start gap-2 text-[13.5px]">
              <IconPhone className="mt-0.5 h-4 w-4 flex-shrink-0 text-primary-500" />
              <a href="tel:0922869966">Hotline: 0922.86.99.66</a>
            </li>
            <li className="flex items-start gap-2 text-[13.5px]">
              <IconMail className="mt-0.5 h-4 w-4 flex-shrink-0 text-primary-500" />
              <a href="mailto:lahrservice2023@gmail.com">lahrservice2023@gmail.com</a>
            </li>
            <li className="flex items-start gap-2 text-[13.5px]">
              <IconPolicyDoc className="mt-0.5 h-4 w-4 flex-shrink-0 text-primary-500" />
              <span>MST: 0801411964</span>
            </li>
          </ul>
        </div>
      </div>

      <div className="mx-auto w-full max-w-brand px-4">
        <div className="mb-2 flex h-[140px] flex-col items-center justify-center gap-1.5 rounded-xl border border-white/10 bg-[linear-gradient(135deg,#0d2e57,#0a2246)]">
          <IconMapPin className="h-6 w-6 text-accent" />
          <span className="text-xs text-primary-100/70">
            Bản đồ văn phòng LA Group — Số 72 phố Hải Hưng, KĐT Ecorivers, P. Hải Tân, TP. Hải
            Dương
          </span>
        </div>
      </div>

      <div className="mx-auto flex w-full max-w-brand flex-col items-center gap-1.5 border-t border-white/10 px-4 py-4 text-center text-xs text-primary-100/70 md:flex-row md:justify-between">
        <span>© 2026 Công ty Cổ phần Dịch vụ Cung ứng Nhân lực LA (LAHR). Bảo lưu mọi quyền.</span>
        <span>Cung ứng nhân lực minh bạch – Đồng hành cùng người lao động</span>
      </div>
    </footer>
  );
}
