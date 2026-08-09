"use client";

import Link from "next/link";
import { useState } from "react";
import { LeadForm } from "@/components/chatbot/LeadForm";
import { browserFetch } from "@/lib/api/client";
import type { components } from "@/lib/api/schema";
import { toJobCardVM } from "@/lib/view-models/job";
import type { JobCardVM } from "@/lib/view-models/types";

type ParkOption = { slug: string; name: string };
type JobsPageDTO = components["schemas"]["PageResponse_JobListItem_"];

type EmploymentType = "official" | "seasonal";
type SalaryPeriod = "weekly" | "monthly";
type ContactChoice = "call" | "phone";

const EMPLOYMENT_LABEL: Record<EmploymentType, string> = {
  seasonal: "thời vụ",
  official: "chính thức",
};

const SALARY_LABEL: Record<SalaryPeriod, string> = {
  weekly: "lương tuần",
  monthly: "lương tháng",
};

const QUESTIONS = [
  "Bạn cần tìm việc làm thời vụ hay chính thức?",
  "Bạn muốn nhận lương tuần hay lương tháng?",
  "Bạn cần tìm việc ở KCN nào?",
  "Bạn muốn để lại số điện thoại để được tư vấn hay muốn gọi trực tiếp cho tư vấn viên?",
];

const HOTLINE = "0922.86.99.66";
const HOTLINE_HREF = "tel:0922869966";
const MATCHED_JOBS_LIMIT = 3;

const pillClass =
  "min-h-11 rounded-full border border-primary-600 bg-white px-3.5 py-2 text-xs font-bold text-primary-700 disabled:opacity-50";

// Khớp style bong bóng bot ở ChatWidget.tsx (self-start, bg trắng, bo góc) — câu
// hỏi hiện NGAY phía trên các lựa chọn thay vì chỉ ghi vào lịch sử sau khi trả lời.
const questionBubbleClass =
  "max-w-[80%] self-start rounded-2xl rounded-bl-sm border border-border bg-white px-3.5 py-2.5 text-[13.5px] leading-snug";

function buildSummary(
  employmentType: EmploymentType,
  salaryPeriod: SalaryPeriod,
  parkName: string | null,
): string {
  const base = `Tôi cần tìm việc làm ${EMPLOYMENT_LABEL[employmentType]}, nhận ${SALARY_LABEL[salaryPeriod]}`;
  return parkName ? `${base}, tại ${parkName}.` : `${base}.`;
}

async function fetchMatchedJobs(
  employmentType: EmploymentType,
  salaryPeriod: SalaryPeriod,
  parkSlug: string,
): Promise<JobCardVM[]> {
  const params = new URLSearchParams();
  params.set("employment_type", employmentType);
  params.set("salary_period", salaryPeriod);
  if (parkSlug) params.set("industrial_park", parkSlug);
  params.set("page_size", String(MATCHED_JOBS_LIMIT));
  const res = await browserFetch<JobsPageDTO>(`/api/jobs?${params.toString()}`);
  return res.ok ? res.data.items.map(toJobCardVM) : [];
}

/**
 * Quiz 4 câu hỏi có thứ tự cố định + nút quay lại, đặt HOÀN TOÀN ở frontend
 * (không để LLM tự quyết định thứ tự — không đáng tin cậy để đảm bảo đúng thứ
 * tự qua nhiều lượt hội thoại). Mỗi câu trả lời được đẩy vào transcript chung
 * qua `onPushMessage` để hiện đúng vị trí thời gian thực trong khung chat.
 * Sau câu 3, gọi thẳng `GET /api/jobs` (đã hỗ trợ filter `employment_type`/
 * `salary_period`) để hiện danh sách việc làm phù hợp thật — KHÔNG qua LLM,
 * nhanh/rẻ/chắc chắn không bịa, hiện cùng lúc với câu 4.
 */
export function ChatQuiz({
  industrialParks,
  onPushMessage,
}: {
  industrialParks: ParkOption[];
  onPushMessage: (from: "bot" | "user", text: string, telHref?: string) => void;
}) {
  const [step, setStep] = useState(0);
  const [employmentType, setEmploymentType] = useState<EmploymentType | null>(null);
  const [salaryPeriod, setSalaryPeriod] = useState<SalaryPeriod | null>(null);
  const [contactChoice, setContactChoice] = useState<ContactChoice | null>(null);
  const [quizSummary, setQuizSummary] = useState("");
  const [matchedJobs, setMatchedJobs] = useState<JobCardVM[] | null>(null);
  const [jobsLoading, setJobsLoading] = useState(false);

  function selectEmploymentType(value: EmploymentType, label: string) {
    onPushMessage("bot", QUESTIONS[0]);
    onPushMessage("user", label);
    setEmploymentType(value);
    setStep(1);
  }

  function selectSalaryPeriod(value: SalaryPeriod, label: string) {
    onPushMessage("bot", QUESTIONS[1]);
    onPushMessage("user", label);
    setSalaryPeriod(value);
    setStep(2);
  }

  async function selectPark(value: string, label: string) {
    onPushMessage("bot", QUESTIONS[2]);
    onPushMessage("user", label);
    const resolvedPark = value ? label : null;
    setStep(3);
    setMatchedJobs(null);

    if (!employmentType || !salaryPeriod) return;

    setQuizSummary(buildSummary(employmentType, salaryPeriod, resolvedPark));

    setJobsLoading(true);
    const jobs = await fetchMatchedJobs(employmentType, salaryPeriod, value);
    setJobsLoading(false);
    setMatchedJobs(jobs);

    onPushMessage(
      "bot",
      jobs.length > 0
        ? `Mình tìm được ${jobs.length} việc làm phù hợp với bạn:`
        : "Hiện chưa có tin tuyển dụng nào khớp đúng tiêu chí bạn chọn. Bạn để lại số điện thoại để LAHR liên hệ tư vấn thêm nhé, hoặc gọi hotline.",
    );
  }

  function selectContact(value: ContactChoice, label: string) {
    onPushMessage("bot", QUESTIONS[3]);
    onPushMessage("user", label);
    setContactChoice(value);
    setStep(4);
    if (value === "call") {
      onPushMessage(
        "bot",
        `Bạn có thể gọi ngay cho tư vấn viên LA Group qua hotline ${HOTLINE}:`,
        HOTLINE_HREF,
      );
    }
  }

  if (step === 0) {
    return (
      <div className="flex flex-col gap-2">
        <div className={questionBubbleClass}>{QUESTIONS[0]}</div>
        <p className="text-xs font-semibold text-text-muted">Câu 1/4</p>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            className={pillClass}
            onClick={() => selectEmploymentType("seasonal", "Thời vụ")}
          >
            Thời vụ
          </button>
          <button
            type="button"
            className={pillClass}
            onClick={() => selectEmploymentType("official", "Chính thức")}
          >
            Chính thức
          </button>
        </div>
      </div>
    );
  }

  if (step === 1) {
    return (
      <div className="flex flex-col gap-2">
        <div className={questionBubbleClass}>{QUESTIONS[1]}</div>
        <p className="text-xs font-semibold text-text-muted">Câu 2/4</p>
        <div className="flex flex-wrap gap-2">
          <button type="button" className={pillClass} onClick={() => setStep(0)}>
            ← Quay lại
          </button>
          <button
            type="button"
            className={pillClass}
            onClick={() => selectSalaryPeriod("weekly", "Lương tuần")}
          >
            Lương tuần
          </button>
          <button
            type="button"
            className={pillClass}
            onClick={() => selectSalaryPeriod("monthly", "Lương tháng")}
          >
            Lương tháng
          </button>
        </div>
      </div>
    );
  }

  if (step === 2) {
    return (
      <div className="flex flex-col gap-2">
        <div className={questionBubbleClass}>{QUESTIONS[2]}</div>
        <p className="text-xs font-semibold text-text-muted">Câu 3/4</p>
        <div className="flex flex-wrap gap-2">
          <button type="button" className={pillClass} onClick={() => setStep(1)}>
            ← Quay lại
          </button>
          {industrialParks.map((park) => (
            <button
              key={park.slug}
              type="button"
              className={pillClass}
              onClick={() => selectPark(park.slug, park.name)}
            >
              {park.name}
            </button>
          ))}
          <button type="button" className={pillClass} onClick={() => selectPark("", "Tất cả KCN")}>
            Tất cả KCN
          </button>
        </div>
      </div>
    );
  }

  if (step === 3) {
    return (
      <div className="flex flex-col gap-2">
        {jobsLoading ? (
          <p className="text-xs text-text-muted">Đang tìm việc phù hợp...</p>
        ) : null}

        {matchedJobs && matchedJobs.length > 0 ? (
          <div className="flex flex-col gap-2">
            {matchedJobs.map((job) => (
              <Link
                key={job.id}
                href={job.href}
                className="rounded-lg border border-border bg-white p-2.5 text-xs hover:border-primary-600"
              >
                <span className="font-bold text-text">{job.title}</span>
                <span className="mt-0.5 block text-text-muted">
                  {job.company} · {job.salaryLabel} · {job.location}
                </span>
              </Link>
            ))}
          </div>
        ) : null}

        <div className={questionBubbleClass}>{QUESTIONS[3]}</div>
        <p className="text-xs font-semibold text-text-muted">Câu 4/4</p>
        <div className="flex flex-wrap gap-2">
          <button type="button" className={pillClass} onClick={() => setStep(2)}>
            ← Quay lại
          </button>
          <button
            type="button"
            className={pillClass}
            onClick={() => selectContact("call", "Gọi trực tiếp cho tư vấn viên")}
          >
            Gọi trực tiếp cho tư vấn viên
          </button>
          <button
            type="button"
            className={pillClass}
            onClick={() => selectContact("phone", "Để lại số điện thoại")}
          >
            Để lại số điện thoại
          </button>
        </div>
      </div>
    );
  }

  if (contactChoice === "phone") {
    return <LeadForm quizSummary={quizSummary} />;
  }

  if (contactChoice === "call") {
    // Vẫn cho quay lại câu 4 để đổi ý sang "để lại số điện thoại" — chọn gọi
    // hotline không nên là ngõ cụt của quiz.
    return (
      <div className="flex flex-wrap gap-2">
        <button type="button" className={pillClass} onClick={() => setStep(3)}>
          ← Quay lại
        </button>
      </div>
    );
  }

  return null;
}
