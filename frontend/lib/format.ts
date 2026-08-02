const TIME_ZONE = "Asia/Ho_Chi_Minh";

function toTrieu(value: number): string {
  const trieu = value / 1_000_000;
  return Number.isInteger(trieu) ? String(trieu) : trieu.toFixed(1);
}

export function formatSalary(
  salaryMin: number | null,
  salaryMax: number | null,
  negotiable: boolean,
): string {
  if (salaryMin != null && salaryMax != null) {
    return `${toTrieu(salaryMin)} – ${toTrieu(salaryMax)} triệu`;
  }
  if (salaryMin != null) return `Từ ${toTrieu(salaryMin)} triệu`;
  if (salaryMax != null) return `Đến ${toTrieu(salaryMax)} triệu`;
  return negotiable ? "Thoả thuận" : "Đang cập nhật";
}

// QUAN TRỌNG: luôn pin timeZone — server chạy container UTC, thiếu dòng này sẽ
// khiến ngày render khác nhau giữa server/client → hydration mismatch.
export function formatDate(isoDate: string): string {
  return new Intl.DateTimeFormat("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    timeZone: TIME_ZONE,
  }).format(new Date(isoDate));
}

export function formatDeadline(isoDate: string | null): string {
  if (!isoDate) return "Không thời hạn";
  return `Hạn nộp: ${formatDate(isoDate)}`;
}

export function formatPhone(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  if (digits.length === 10) {
    return `${digits.slice(0, 4)} ${digits.slice(4, 7)} ${digits.slice(7)}`;
  }
  return phone;
}

export function initials(name: string): string {
  const words = name.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return "";
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
  return (words[0][0] + words[words.length - 1][0]).toUpperCase();
}
