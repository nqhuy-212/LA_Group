import { describe, expect, it } from "vitest";
import {
  addDaysIso,
  formatAgeRange,
  formatDate,
  formatDeadline,
  formatPhone,
  formatSalary,
  initials,
  splitParagraphs,
  toIsoDate,
} from "@/lib/format";

describe("formatSalary", () => {
  it("formats a min-max range in triệu", () => {
    expect(formatSalary(9_000_000, 12_000_000, false)).toBe("9 – 12 triệu");
  });

  it("formats decimal triệu values", () => {
    expect(formatSalary(9_500_000, 11_500_000, false)).toBe("9.5 – 11.5 triệu");
  });

  it("formats min-only as 'Từ'", () => {
    expect(formatSalary(8_000_000, null, false)).toBe("Từ 8 triệu");
  });

  it("formats max-only as 'Đến'", () => {
    expect(formatSalary(null, 10_000_000, false)).toBe("Đến 10 triệu");
  });

  it("falls back to 'Thoả thuận' when negotiable and no range", () => {
    expect(formatSalary(null, null, true)).toBe("Thoả thuận");
  });

  it("falls back to 'Đang cập nhật' when not negotiable and no range", () => {
    expect(formatSalary(null, null, false)).toBe("Đang cập nhật");
  });
});

describe("formatDate / formatDeadline", () => {
  it("formats an ISO date pinned to Asia/Ho_Chi_Minh", () => {
    expect(formatDate("2026-08-15")).toBe("15/08/2026");
  });

  it("prefixes deadline with 'Hạn nộp:'", () => {
    expect(formatDeadline("2026-08-15")).toBe("Hạn nộp: 15/08/2026");
  });

  it("shows 'Không thời hạn' when deadline is null", () => {
    expect(formatDeadline(null)).toBe("Không thời hạn");
  });
});

describe("formatPhone", () => {
  it("groups a 10-digit VN phone number", () => {
    expect(formatPhone("0922869966")).toBe("0922 869 966");
  });

  it("passes through non-10-digit values unchanged", () => {
    expect(formatPhone("123")).toBe("123");
  });
});

describe("initials", () => {
  it("takes first+last word initials for multi-word names", () => {
    expect(initials("Công ty TNHH Điện tử Việt Phát")).toBe("CP");
  });

  it("takes first 2 chars for single-word names", () => {
    expect(initials("Vietcombank")).toBe("VI");
  });

  it("returns empty string for blank input", () => {
    expect(initials("   ")).toBe("");
  });
});

describe("formatAgeRange", () => {
  it("formats a min-max range", () => {
    expect(formatAgeRange(18, 35)).toBe("18 - 35 tuổi");
  });

  it("formats min-only as 'Từ'", () => {
    expect(formatAgeRange(18, null)).toBe("Từ 18 tuổi");
  });

  it("formats max-only as 'Đến'", () => {
    expect(formatAgeRange(null, 40)).toBe("Đến 40 tuổi");
  });

  it("returns null when both are missing", () => {
    expect(formatAgeRange(null, null)).toBeNull();
  });
});

describe("splitParagraphs", () => {
  it("splits on blank lines and trims each paragraph", () => {
    expect(splitParagraphs("Dòng 1.\n\n  Dòng 2.  \n\nDòng 3.")).toEqual([
      "Dòng 1.",
      "Dòng 2.",
      "Dòng 3.",
    ]);
  });

  it("returns empty array for null/empty input", () => {
    expect(splitParagraphs(null)).toEqual([]);
    expect(splitParagraphs("")).toEqual([]);
  });
});

describe("addDaysIso", () => {
  it("adds days and returns a date-only ISO string", () => {
    expect(addDaysIso("2026-07-01T00:00:00Z", 30)).toBe("2026-07-31");
  });
});

describe("toIsoDate", () => {
  it("truncates a datetime to a date-only string", () => {
    expect(toIsoDate("2026-08-15T10:20:30Z")).toBe("2026-08-15");
  });

  it("returns null for null/undefined input", () => {
    expect(toIsoDate(null)).toBeNull();
    expect(toIsoDate(undefined)).toBeNull();
  });
});
