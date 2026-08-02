import { OpenChatButton } from "@/components/chatbot/OpenChatButton";
import { Container } from "@/components/ui/Container";
import { IconSparkles } from "@/components/ui/icons";

export function AiBannerSection() {
  return (
    <section id="chatbot-ai" className="py-10 md:py-14">
      <Container>
        <div
          data-reveal
          className="reveal relative flex flex-col items-start gap-4 overflow-hidden rounded-2xl bg-gradient-to-tr from-primary-800 to-primary-600 p-6 text-white md:flex-row md:items-center md:justify-between md:px-10 md:py-9"
        >
          <div
            aria-hidden
            className="pointer-events-none absolute -right-10 -top-10 h-[180px] w-[180px] rounded-full bg-white/10"
          />
          <div className="relative z-10">
            <span className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1.5 text-xs font-bold">
              <IconSparkles className="h-3.5 w-3.5" />
              Trợ lý AI LA Group
            </span>
            <h2 className="mt-2.5 max-w-[480px] text-[21px] font-extrabold">
              Chưa biết chọn việc gì phù hợp? Hỏi ngay trợ lý AI
            </h2>
            <p className="mt-2 max-w-[460px] text-[13.5px] text-primary-100">
              Chỉ cần cho chúng tôi biết kỹ năng, kinh nghiệm và khu vực bạn muốn làm việc — trợ
              lý AI sẽ gợi ý những công việc phù hợp nhất từ danh sách tuyển dụng thực tế.
            </p>
          </div>
          <OpenChatButton className="relative z-10 inline-flex min-h-11 flex-shrink-0 items-center justify-center gap-1.5 rounded-lg bg-accent px-5 text-sm font-bold text-white shadow-brand transition-colors hover:bg-accent-dark">
            Chat với trợ lý AI
          </OpenChatButton>
        </div>
      </Container>
    </section>
  );
}
