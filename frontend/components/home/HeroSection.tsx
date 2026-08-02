import { ButtonLink } from "@/components/ui/Button";
import { Container } from "@/components/ui/Container";
import {
  IconBriefcase,
  IconChatBubble,
  IconFileText,
  IconPolicyDoc,
} from "@/components/ui/icons";
import { revealStyle } from "@/lib/reveal";

const quickActions = [
  {
    icon: IconBriefcase,
    title: "Tìm việc làm",
    description: "Duyệt tin tuyển dụng mới nhất",
  },
  {
    icon: IconFileText,
    title: "Nộp hồ sơ / CV",
    description: "Ứng tuyển nhanh chỉ 2 phút",
  },
  {
    icon: IconChatBubble,
    title: "Tư vấn AI",
    description: "Gợi ý việc làm phù hợp",
  },
  {
    icon: IconPolicyDoc,
    title: "Chính sách công ty",
    description: "Quyền lợi & chế độ lao động",
  },
];

export function HeroSection() {
  return (
    <section
      id="top"
      className="bg-[radial-gradient(circle_at_15%_20%,var(--color-primary-600),var(--color-primary-900)_70%)] py-9 pb-12 text-white md:py-13 md:pb-16"
    >
      <Container className="grid grid-cols-1 gap-6 md:grid-cols-[1.5fr_1fr] md:items-center">
        <div data-reveal className="reveal">
          <span className="inline-block rounded-full bg-white/15 px-2.5 py-1 text-xs font-bold uppercase tracking-wide text-white">
            Cung ứng nhân lực LA Group (LAHR)
          </span>
          <h1 className="mt-2 text-[26px] font-extrabold leading-tight tracking-tight md:text-[34px] lg:text-[38px]">
            Đồng hành cùng người lao động
            <br />
            tìm việc làm phù hợp tại Hải Dương
          </h1>
          <p className="mt-2.5 max-w-[520px] text-sm text-primary-100 md:text-[15.5px]">
            LA Group (LAHR) trực tiếp cung ứng và cho thuê lại lao động cho các nhà máy tại khu
            công nghiệp Hải Dương và khu vực miền Bắc, cùng trợ lý AI tư vấn miễn phí giúp bạn
            chọn đúng công việc phù hợp với kỹ năng và mong muốn của mình.
          </p>
          <div className="mt-4.5 flex flex-wrap gap-5">
            <div>
              <strong className="block text-xl font-extrabold">500+</strong>
              <span className="text-xs text-primary-100">Lao động đang được cung ứng</span>
            </div>
            <div>
              <strong className="block text-xl font-extrabold">5</strong>
              <span className="text-xs text-primary-100">Khu công nghiệp tại Hải Dương</span>
            </div>
            <div>
              <strong className="block text-xl font-extrabold">24/7</strong>
              <span className="text-xs text-primary-100">Trợ lý AI tư vấn</span>
            </div>
          </div>
          <div className="mt-5 flex flex-wrap gap-2.5">
            <ButtonLink href="#viec-lam" variant="accent">
              Xem việc làm mới
            </ButtonLink>
            <ButtonLink href="#chatbot-ai" variant="outline-light">
              Hỏi trợ lý AI
            </ButtonLink>
          </div>
        </div>

        <div data-reveal style={revealStyle(1)} className="reveal grid grid-cols-2 gap-3">
          {quickActions.map(({ icon: Icon, title, description }) => (
            <div
              key={title}
              className="rounded-xl border border-white/20 bg-white/10 p-4 backdrop-blur-[2px]"
            >
              <div className="mb-2.5 flex h-10 w-10 items-center justify-center rounded-lg bg-white text-primary-700">
                <Icon className="h-5 w-5" />
              </div>
              <h3 className="text-[13.5px] font-bold text-white">{title}</h3>
              <p className="mt-1 text-[11.5px] text-primary-100">{description}</p>
            </div>
          ))}
        </div>
      </Container>
    </section>
  );
}
