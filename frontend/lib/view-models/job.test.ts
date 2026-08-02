import { describe, expect, it } from "vitest";
import {
  toJobCardVM,
  toJobCategoryCardVM,
  toJobCategoryTabsVM,
  type JobCategoryWithCountDTO,
  type JobListItemDTO,
} from "@/lib/view-models/job";

function makeJobDTO(overrides: Partial<JobListItemDTO> = {}): JobListItemDTO {
  return {
    slug: "cn-lap-rap-dien-tu",
    title: "Công nhân lắp ráp điện tử",
    company: {
      slug: "dien-tu-viet-phat",
      name: "Công ty TNHH Điện tử Việt Phát",
      logo_initials: "CTY",
      logo_url: null,
      created_at: "2026-07-01T00:00:00Z",
    },
    category: { slug: "sx", name: "Sản xuất – Lắp ráp" },
    industrial_park: { slug: "an-phat-ky-thuat-cao", name: "KCN Kỹ thuật cao An Phát" },
    province_code: "30",
    province_name: "Hải Dương",
    salary_min: 9_000_000,
    salary_max: 12_000_000,
    salary_negotiable: false,
    is_hot: true,
    deadline: "2026-08-15",
    published_at: "2026-07-20T00:00:00Z",
    ...overrides,
  };
}

describe("toJobCardVM", () => {
  it("maps a full DTO to the JobCardVM shape used by JobCard", () => {
    expect(toJobCardVM(makeJobDTO())).toEqual({
      id: "cn-lap-rap-dien-tu",
      href: "/viec-lam/cn-lap-rap-dien-tu",
      title: "Công nhân lắp ráp điện tử",
      company: "Công ty TNHH Điện tử Việt Phát",
      logoInitials: "CTY",
      category: "sx",
      hot: true,
      salaryLabel: "9 – 12 triệu",
      location: "KCN Kỹ thuật cao An Phát, Hải Dương",
      deadlineLabel: "Hạn nộp: 15/08/2026",
    });
  });

  it("falls back to computed initials when logo_initials is null", () => {
    const vm = toJobCardVM(
      makeJobDTO({
        company: {
          slug: "x",
          name: "Chuỗi Siêu thị Bình Minh Mart",
          logo_initials: null,
          logo_url: null,
          created_at: "2026-07-01T00:00:00Z",
        },
      }),
    );
    expect(vm.logoInitials).toBe("CM");
  });

  it("uses province name alone when there is no industrial park", () => {
    const vm = toJobCardVM(makeJobDTO({ industrial_park: null }));
    expect(vm.location).toBe("Hải Dương");
  });

  it("prefers display_name_public already resolved by backend as company.name", () => {
    // Backend đã resolve display_name_public ưu tiên hơn name thật trước khi trả
    // JSON — mapper phía FE chỉ cần dùng thẳng company.name, không tự xử lý lại.
    const vm = toJobCardVM(makeJobDTO({ company: { ...makeJobDTO().company, name: "Đối tác ẩn danh" } }));
    expect(vm.company).toBe("Đối tác ẩn danh");
  });
});

describe("toJobCategoryTabsVM / toJobCategoryCardVM", () => {
  const categories: JobCategoryWithCountDTO[] = [
    { slug: "sx", name: "Sản xuất – Lắp ráp", job_count: 2 },
    { slug: "kt", name: "Cơ khí – Kỹ thuật", job_count: 1 },
  ];

  it("prepends an 'all' tab", () => {
    const tabs = toJobCategoryTabsVM(categories);
    expect(tabs[0]).toEqual({ slug: "all", label: "Tất cả" });
    expect(tabs).toHaveLength(3);
  });

  it("formats job_count into a countLabel", () => {
    const cards = toJobCategoryCardVM(categories);
    expect(cards[0]).toEqual({ slug: "sx", label: "Sản xuất – Lắp ráp", countLabel: "2 việc làm" });
  });
});
