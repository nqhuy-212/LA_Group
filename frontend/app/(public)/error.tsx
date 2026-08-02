"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/Button";
import { Container } from "@/components/ui/Container";

export default function Error({
  error,
  unstable_retry,
}: {
  error: Error & { digest?: string };
  unstable_retry: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <Container className="flex flex-col items-center gap-4 py-20 text-center md:py-28">
      <h1 className="text-2xl font-extrabold">Đã có lỗi xảy ra</h1>
      <p className="max-w-md text-text-muted">
        Rất tiếc, trang này gặp sự cố khi tải. Vui lòng thử lại sau ít phút.
      </p>
      <Button onClick={() => unstable_retry()}>Thử lại</Button>
    </Container>
  );
}
