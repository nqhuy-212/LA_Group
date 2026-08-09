import { ButtonLink } from "@/components/ui/Button";
import { Container } from "@/components/ui/Container";
import { IconBuilding, IconCheck } from "@/components/ui/icons";
import { revealStyle } from "@/lib/reveal";

const highlights = [
  "Là thương hiệu của Công ty Cổ phần Dịch vụ Cung ứng Nhân lực LA, được UBND tỉnh Hải Dương cấp phép hoạt động dịch vụ việc làm và cho thuê lại lao động.",
  "Đang cung ứng và quản lý gần 500 lao động tại các khu công nghiệp lớn của Hải Dương: An Phát, Đại An, Tân Trường, Phúc Điền, Cẩm Điền – Lương Điền (Vsip Hải Dương).",
  "Cam kết minh bạch — không thu phí người lao động, đồng hành cùng chính sách lao động công bằng.",
  "Ứng dụng trợ lý AI để tư vấn việc làm nhanh chóng, chính xác, phù hợp với từng cá nhân.",
];

export function AboutSection() {
  return (
    <section className="bg-gradient-to-br from-primary-900 to-primary-700 py-10 text-white md:py-14">
      <Container className="grid grid-cols-1 gap-8 md:grid-cols-2 md:items-center">
        <div data-reveal suppressHydrationWarning className="reveal">
          <span className="inline-block rounded-full bg-white/15 px-2.5 py-1 text-xs font-bold uppercase tracking-wide text-white">
            Về chúng tôi
          </span>
          <h2 className="mt-1.5 text-[21px] font-extrabold text-white">
            LA Group (LAHR) — Đồng hành cùng người lao động, cung ứng nhân lực bền vững tại Hải
            Dương
          </h2>
          <ul className="mt-4 flex flex-col gap-3">
            {highlights.map((text) => (
              <li key={text} className="flex gap-2.5 text-[13.5px] leading-relaxed text-primary-100">
                <IconCheck className="mt-0.5 h-4 w-4 flex-shrink-0 text-[#8fc4f7]" />
                <span>{text}</span>
              </li>
            ))}
          </ul>
          <ButtonLink href="#" variant="outline-light" className="mt-5">
            Tìm hiểu thêm về LA Group
          </ButtonLink>
        </div>
        <div
          data-reveal
          suppressHydrationWarning
          style={revealStyle(1)}
          className="reveal flex h-[170px] items-center justify-center rounded-xl bg-gradient-to-br from-primary-600 to-primary-900 md:h-full md:min-h-[280px]"
        >
          <IconBuilding className="h-[72px] w-[72px] text-white/70" />
        </div>
      </Container>
    </section>
  );
}
