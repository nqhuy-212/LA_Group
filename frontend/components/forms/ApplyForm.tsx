"use client";

import Link from "next/link";
import { useRef, useState, type FormEvent } from "react";
import { Button } from "@/components/ui/Button";
import { IconCheck } from "@/components/ui/icons";
import { browserFetch } from "@/lib/api/client";

const PROVINCE_CODE = "30";
const PROVINCE_NAME = "Hải Dương";

// Font 16px trên input (chống iOS tự zoom khi focus — design-system.md), vùng chạm
// ≥44px, trường bắt buộc tối thiểu để điền nhanh trên di động (feature-recruitment.md).
const fieldClass =
  "min-h-11 w-full rounded-lg border border-border bg-white px-3 text-[16px] text-text outline-none focus:border-primary-500";
const labelClass = "flex flex-col gap-1.5 text-sm font-semibold text-text";

type SubmitResult = { referenceCode: string; duplicate: boolean; message?: string };

export function ApplyForm({ jobSlug }: { jobSlug: string }) {
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [result, setResult] = useState<SubmitResult | null>(null);
  // Ghi lại thời điểm form thực sự render ra màn hình — dùng để tính elapsed_ms
  // phía server (D10: anti-spam bằng honeypot + timing, không dùng captcha ở MVP).
  const renderedAt = useRef(new Date().toISOString());

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setPending(true);

    const formData = new FormData(event.currentTarget);
    formData.set("job_slug", jobSlug);
    formData.set("province_code", PROVINCE_CODE);
    formData.set("form_rendered_at", renderedAt.current);

    const res = await browserFetch<{
      ok: boolean;
      reference_code: string;
      duplicate: boolean;
      message?: string;
    }>("/api/applications", { method: "POST", body: formData });

    setPending(false);
    if (!res.ok) {
      setError(res.error);
      return;
    }
    setResult({
      referenceCode: res.data.reference_code,
      duplicate: res.data.duplicate,
      message: res.data.message,
    });
  }

  if (result) {
    return (
      <div className="rounded-xl border border-primary-200 bg-primary-50 p-5">
        <div className="flex items-center gap-2 text-primary-900">
          <IconCheck className="h-5 w-5 flex-shrink-0" />
          <p className="font-bold">
            {result.duplicate ? "Bạn đã ứng tuyển vị trí này" : "Đã gửi hồ sơ ứng tuyển thành công!"}
          </p>
        </div>
        <p className="mt-2 text-sm text-text-muted">
          Mã hồ sơ của bạn:{" "}
          <span className="font-mono font-bold text-text">{result.referenceCode}</span>
        </p>
        {result.message ? <p className="mt-2 text-sm text-text-muted">{result.message}</p> : null}
        {!result.duplicate ? (
          <p className="mt-2 text-sm text-text-muted">
            LA Group sẽ liên hệ với bạn qua số điện thoại đã cung cấp trong thời gian sớm nhất.
          </p>
        ) : null}
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      {/* Honeypot — ẩn khỏi mắt người thật bằng CSS, nhưng bot điền form tự động
          thường vẫn tự điền vào field này. Không dùng display:none/hidden vì một số
          bot bỏ qua field ẩn kiểu đó; đẩy ra ngoài khung nhìn là đủ mà vẫn có mặt
          trong DOM/tab order tối thiểu cho bot "thấy". */}
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
        Họ và tên *
        <input name="full_name" required minLength={2} maxLength={150} className={fieldClass} />
      </label>

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
        Email
        <input type="email" name="email" className={fieldClass} />
      </label>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className={labelClass}>
          Ngày sinh
          <input type="date" name="birth_date" className={fieldClass} />
        </label>
        <label className={labelClass}>
          Quê quán/Nơi thường trú
          <input
            name="hometown_text"
            maxLength={200}
            placeholder={PROVINCE_NAME}
            className={fieldClass}
          />
        </label>
      </div>

      <label className={labelClass}>
        CV/Hồ sơ (PDF, JPG hoặc PNG, tối đa 5MB) *
        <input
          type="file"
          name="cv"
          required
          accept=".pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png"
          className={`${fieldClass} py-1.5`}
        />
      </label>

      <label className="flex min-h-11 items-start gap-2.5 text-sm text-text">
        <input
          type="checkbox"
          name="consent_given"
          value="true"
          required
          className="mt-0.5 h-5 w-5 flex-shrink-0"
        />
        <span>
          Tôi đồng ý để LA Group (LAHR) thu thập, sử dụng thông tin trên nhằm mục đích tư vấn,
          giới thiệu việc làm theo{" "}
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

      {error ? <p className="text-sm font-semibold text-accent-dark">{error}</p> : null}

      <Button type="submit" disabled={pending} block>
        {pending ? "Đang gửi..." : "Gửi hồ sơ ứng tuyển"}
      </Button>
    </form>
  );
}
