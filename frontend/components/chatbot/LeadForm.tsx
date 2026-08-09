"use client";

import Link from "next/link";
import { useRef, useState, type FormEvent } from "react";
import { Button } from "@/components/ui/Button";
import { IconCheck } from "@/components/ui/icons";
import { browserFetch } from "@/lib/api/client";

const fieldClass =
  "min-h-11 w-full rounded-lg border border-border bg-white px-3 text-[16px] text-text outline-none focus:border-primary-500";
const labelClass = "flex flex-col gap-1.5 text-xs font-semibold text-text";

type SubmitResult = { referenceCode: string };

/** Mini-form "để lại số điện thoại" trong bong bóng chat — cùng pattern chống
 * spam (honeypot + timing) và consent NĐ13 như ApplyForm.tsx, nhưng gọi
 * POST /api/leads (không phải /api/applications — endpoint riêng, xem
 * CLAUDE.md §Quyết định kiến trúc) vì đây là tư vấn chung, không gắn 1 job. */
export function LeadForm({ quizSummary }: { quizSummary: string }) {
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [result, setResult] = useState<SubmitResult | null>(null);
  const renderedAt = useRef(new Date().toISOString());

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setPending(true);

    const formData = new FormData(event.currentTarget);
    formData.set("notes", quizSummary);
    formData.set("form_rendered_at", renderedAt.current);

    const res = await browserFetch<{ ok: boolean; reference_code: string }>("/api/leads", {
      method: "POST",
      body: formData,
    });

    setPending(false);
    if (!res.ok) {
      setError(res.error);
      return;
    }
    setResult({ referenceCode: res.data.reference_code });
  }

  if (result) {
    return (
      <div className="rounded-xl border border-primary-200 bg-primary-50 p-3.5">
        <div className="flex items-center gap-2 text-primary-900">
          <IconCheck className="h-4 w-4 flex-shrink-0" />
          <p className="text-sm font-bold">Đã ghi nhận, cảm ơn bạn!</p>
        </div>
        <p className="mt-1.5 text-xs text-text-muted">
          Mã liên hệ:{" "}
          <span className="font-mono font-bold text-text">{result.referenceCode}</span>
        </p>
        <p className="mt-1.5 text-xs text-text-muted">
          LA Group sẽ liên hệ với bạn qua số điện thoại đã cung cấp trong thời gian sớm nhất.
        </p>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-col gap-2.5 rounded-xl border border-border bg-white p-3.5"
    >
      <input
        type="text"
        name="website"
        tabIndex={-1}
        autoComplete="off"
        defaultValue=""
        className="absolute left-[-9999px] top-auto h-0 w-0 overflow-hidden opacity-0"
        aria-hidden="true"
      />

      <label className={labelClass}>
        Số điện thoại *
        <input
          type="tel"
          name="phone"
          required
          placeholder="09xxxxxxxx"
          inputMode="tel"
          className={fieldClass}
        />
      </label>

      <label className={labelClass}>
        Họ và tên
        <input name="full_name" maxLength={150} className={fieldClass} />
      </label>

      <label className="flex min-h-11 items-start gap-2 text-xs text-text">
        <input
          type="checkbox"
          name="consent_given"
          value="true"
          required
          className="mt-0.5 h-5 w-5 flex-shrink-0"
        />
        <span>
          Tôi đồng ý để LA Group (LAHR) thu thập, sử dụng thông tin trên nhằm mục đích tư vấn theo{" "}
          <Link
            href="/chinh-sach-bao-mat"
            target="_blank"
            className="font-semibold text-primary-700 underline"
          >
            Chính sách bảo mật
          </Link>
          .
        </span>
      </label>

      {error ? <p className="text-xs font-semibold text-accent-dark">{error}</p> : null}

      <Button type="submit" disabled={pending} block>
        {pending ? "Đang gửi..." : "Gửi thông tin"}
      </Button>
    </form>
  );
}
