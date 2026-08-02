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

export function formatAgeRange(ageMin: number | null, ageMax: number | null): string | null {
  if (ageMin != null && ageMax != null) return `${ageMin} - ${ageMax} tuổi`;
  if (ageMin != null) return `Từ ${ageMin} tuổi`;
  if (ageMax != null) return `Đến ${ageMax} tuổi`;
  return null;
}

// Nội dung mô tả/yêu cầu/quyền lợi lưu dạng Text tự do (không phải rich text/HTML) —
// tách theo dòng trống để render mỗi đoạn thành 1 <p>, bỏ dòng rỗng thừa.
export function splitParagraphs(text: string | null | undefined): string[] {
  if (!text) return [];
  return text
    .split(/\n+/)
    .map((line) => line.trim())
    .filter(Boolean);
}

// Dùng cho fallback validThrough của JSON-LD JobPosting khi tin không đặt deadline.
export function addDaysIso(isoDateTime: string, days: number): string {
  const date = new Date(isoDateTime);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

export function toIsoDate(value: string | null | undefined): string | null {
  if (!value) return null;
  return value.slice(0, 10);
}
