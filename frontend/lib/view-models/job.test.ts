import { describe, expect, it } from "vitest";
import {
  buildJobPostingJsonLd,
  toJobCardVM,
  toJobCategoryCardVM,
  toJobCategoryTabsVM,
  toJobDetailVM,
  type JobCategoryWithCountDTO,
  type JobDetailDTO,
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

function makeJobDetailDTO(overrides: Partial<JobDetailDTO> = {}): JobDetailDTO {
  return {
    ...makeJobDTO(),
    quantity: 5,
    age_min: 18,
    age_max: 35,
    shift_type: "Theo ca",
    employment_type: "Toàn thời gian",
    description: "Lắp ráp linh kiện điện tử theo dây chuyền.",
    requirements: "Sức khoẻ tốt.\n\nChăm chỉ, cẩn thận.",
    benefits: "Thưởng tháng 13.",
    status: "published",
    meta_title: null,
    meta_description: null,
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

describe("toJobDetailVM", () => {
  it("extends the card VM with detail-only fields", () => {
    const vm = toJobDetailVM(makeJobDetailDTO());
    expect(vm.title).toBe("Công nhân lắp ráp điện tử");
    expect(vm.quantityLabel).toBe("Tuyển 5 người");
    expect(vm.ageLabel).toBe("18 - 35 tuổi");
    expect(vm.description).toEqual(["Lắp ráp linh kiện điện tử theo dây chuyền."]);
    expect(vm.requirements).toEqual(["Sức khoẻ tốt.", "Chăm chỉ, cẩn thận."]);
    expect(vm.isExpired).toBe(false);
    expect(vm.publishedDateLabel).toBe("20/07/2026");
  });

  it("marks non-published jobs as expired", () => {
    expect(toJobDetailVM(makeJobDetailDTO({ status: "closed" })).isExpired).toBe(true);
    expect(toJobDetailVM(makeJobDetailDTO({ status: "archived" })).isExpired).toBe(true);
  });
});

describe("buildJobPostingJsonLd", () => {
  it("builds a JobPosting with all required fields present", () => {
    const jsonLd = buildJobPostingJsonLd(makeJobDetailDTO());
    expect(jsonLd["@type"]).toBe("JobPosting");
    expect(jsonLd.title).toBe("Công nhân lắp ráp điện tử");
    expect(jsonLd.description).toBe("Lắp ráp linh kiện điện tử theo dây chuyền.");
    expect(jsonLd.datePosted).toBe("2026-07-20T00:00:00Z");
    expect(jsonLd.validThrough).toBe("2026-08-15");
    expect(jsonLd.hiringOrganization).toEqual({
      "@type": "Organization",
      name: "Công ty TNHH Điện tử Việt Phát",
    });
    expect(jsonLd.jobLocation).toEqual({
      "@type": "Place",
      address: {
        "@type": "PostalAddress",
        addressCountry: "VN",
        addressRegion: "Hải Dương",
        addressLocality: "KCN Kỹ thuật cao An Phát",
      },
    });
    expect(jsonLd.baseSalary).toEqual({
      "@type": "MonetaryAmount",
      currency: "VND",
      value: {
        "@type": "QuantitativeValue",
        minValue: 9_000_000,
        maxValue: 12_000_000,
        unitText: "MONTH",
      },
    });
  });

  it("synthesizes a description when the DB field is null", () => {
    const jsonLd = buildJobPostingJsonLd(makeJobDetailDTO({ description: null }));
    expect(jsonLd.description).toContain("Công nhân lắp ráp điện tử");
    expect(jsonLd.description).toContain("Công ty TNHH Điện tử Việt Phát");
  });

  it("falls back validThrough to 30 days after datePosted when deadline is missing", () => {
    const jsonLd = buildJobPostingJsonLd(makeJobDetailDTO({ deadline: null }));
    expect(jsonLd.validThrough).toBe("2026-08-19");
  });

  it("omits baseSalary when the job is negotiable", () => {
    const jsonLd = buildJobPostingJsonLd(
      makeJobDetailDTO({ salary_negotiable: true, salary_min: null, salary_max: null }),
    );
    expect(jsonLd.baseSalary).toBeUndefined();
  });
});
