import { ButtonLink } from "@/components/ui/Button";
import { Container } from "@/components/ui/Container";

export function BizCtaSection() {
  return (
    <section className="py-10 md:py-14">
      <Container>
        <div
          data-reveal
          suppressHydrationWarning
          className="reveal flex flex-col gap-3 rounded-xl border border-dashed border-primary-600 bg-white p-5 text-center md:flex-row md:items-center md:justify-between md:px-9 md:py-7 md:text-left"
        >
          <div>
            <h3 className="text-base font-extrabold">Doanh nghiệp cần tuyển dụng nhân sự?</h3>
            <p className="mt-1 text-sm text-text-muted">
              Đăng tin tuyển dụng cùng LA Group để tiếp cận hàng nghìn lao động tiềm năng mỗi
              ngày.
            </p>
          </div>
          <ButtonLink href="#lien-he" variant="primary" className="mx-auto md:mx-0">
            Liên hệ hợp tác
          </ButtonLink>
        </div>
      </Container>
    </section>
  );
}
