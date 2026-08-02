import { describe, expect, it } from "vitest";
import {
  toEventItemVM,
  toNewPartnerFeedItemVM,
  toNewsPostVM,
  toScamAlertFeedItemVM,
  type CompanyPublicDTO,
  type PostListItemDTO,
} from "@/lib/view-models/post";

function makePostDTO(overrides: Partial<PostListItemDTO> = {}): PostListItemDTO {
  return {
    slug: "chinh-sach-bao-hiem-2026",
    title: "Chính sách bảo hiểm và phúc lợi cho người lao động 2026",
    excerpt: "Tổng hợp các chế độ bảo hiểm xã hội, y tế và phúc lợi.",
    cover_image_url: null,
    type: "policy",
    published_at: "2026-07-20T00:00:00Z",
    ...overrides,
  };
}

describe("toNewsPostVM", () => {
  it("maps post type to Vietnamese tag label", () => {
    expect(toNewsPostVM(makePostDTO({ type: "policy" })).tag).toBe("Chính sách");
    expect(toNewsPostVM(makePostDTO({ type: "guide" })).tag).toBe("Hướng dẫn");
    expect(toNewsPostVM(makePostDTO({ type: "news" })).tag).toBe("Tin tức");
  });

  it("builds the detail href from slug", () => {
    expect(toNewsPostVM(makePostDTO()).href).toBe("/tin-tuc/chinh-sach-bao-hiem-2026");
  });
});

describe("icon cycling for events and feeds", () => {
  it("cycles event icons calendar/graduation/users by index", () => {
    const icons = [0, 1, 2, 3].map((i) => toEventItemVM(makePostDTO(), i).icon);
    expect(icons).toEqual(["calendar", "graduation", "users", "calendar"]);
  });

  it("cycles scam-alert icons alert-triangle/alert-circle/mail by index", () => {
    const icons = [0, 1, 2].map((i) => toScamAlertFeedItemVM(makePostDTO(), i).icon);
    expect(icons).toEqual(["alert-triangle", "alert-circle", "mail"]);
  });
});

describe("toNewPartnerFeedItemVM", () => {
  it("builds a Vietnamese announcement title from the company name and created_at date", () => {
    const company: CompanyPublicDTO = {
      slug: "dien-tu-viet-phat",
      name: "Công ty TNHH Điện tử Việt Phát",
      logo_initials: "CTY",
      logo_url: null,
      created_at: "2026-07-26T00:00:00Z",
    };
    const vm = toNewPartnerFeedItemVM(company, 0);
    expect(vm.title).toBe(
      "Công ty TNHH Điện tử Việt Phát chính thức hợp tác tuyển dụng cùng LA Group",
    );
    expect(vm.dateLabel).toBe("26/07/2026");
  });
});
