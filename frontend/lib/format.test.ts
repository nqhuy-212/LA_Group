import { describe, expect, it } from "vitest";
import { formatDate, formatDeadline, formatPhone, formatSalary, initials } from "@/lib/format";

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
