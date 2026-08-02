import { ButtonLink } from "@/components/ui/Button";
import { Container } from "@/components/ui/Container";

export default function NotFound() {
  return (
    <Container className="flex flex-col items-center gap-4 py-20 text-center md:py-28">
      <h1 className="text-2xl font-extrabold">Không tìm thấy trang</h1>
      <p className="max-w-md text-text-muted">
        Trang bạn tìm không tồn tại hoặc đã được di chuyển. Hãy quay về trang chủ để tiếp tục tìm
        việc làm phù hợp.
      </p>
      <ButtonLink href="/">Về trang chủ</ButtonLink>
    </Container>
  );
}
