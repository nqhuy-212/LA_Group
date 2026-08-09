import Link from "next/link";
import { IconMail, IconPhone } from "@/components/ui/icons";

export function TopBar() {
  return (
    <div className="hidden bg-primary-900 text-[12.5px] text-primary-100 sm:block">
      <div className="mx-auto flex h-9 w-full max-w-brand items-center justify-between px-4">
        <div className="flex gap-4">
          <a href="tel:0922869966" className="inline-flex items-center gap-1.5 hover:text-white">
            <IconPhone className="h-3.5 w-3.5" />
            0922.86.99.66
          </a>
          <a
            href="mailto:lahrservice2023@gmail.com"
            className="inline-flex items-center gap-1.5 hover:text-white"
          >
            <IconMail className="h-3.5 w-3.5" />
            lahrservice2023@gmail.com
          </a>
        </div>
        <div className="flex gap-3.5">
          <Link href="#lien-he" className="hover:text-white">
            Dành cho doanh nghiệp
          </Link>
          <Link href="/dang-nhap" className="hover:text-white">
            Đăng nhập
          </Link>
        </div>
      </div>
    </div>
  );
}
