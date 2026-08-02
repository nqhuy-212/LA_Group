import { formatDate } from "@/lib/format";
import type { components } from "@/lib/api/schema";
import type { EventItem, FeedItem, NewsPost } from "@/lib/view-models/types";

export type PostListItemDTO = components["schemas"]["PostListItem"];
export type CompanyPublicDTO = components["schemas"]["CompanyPublic"];

const NEWS_TAG_LABELS: Record<string, string> = {
  news: "Tin tức",
  policy: "Chính sách",
  guide: "Hướng dẫn",
};

// Backend không lưu icon trang trí riêng cho từng bài viết (không đáng để thêm cột
// DB chỉ cho mục đích thẩm mỹ) — xoay vòng theo vị trí trong danh sách để vẫn có
// sự đa dạng hình ảnh như bản mock cũ.
const EVENT_ICON_CYCLE: EventItem["icon"][] = ["calendar", "graduation", "users"];
const PARTNER_ICON_CYCLE: FeedItem["icon"][] = ["store", "factory", "truck"];
const SCAM_ALERT_ICON_CYCLE: FeedItem["icon"][] = ["alert-triangle", "alert-circle", "mail"];

export function toNewsPostVM(dto: PostListItemDTO): NewsPost {
  return {
    id: dto.slug,
    href: `/tin-tuc/${dto.slug}`,
    tag: NEWS_TAG_LABELS[dto.type] ?? "Tin tức",
    title: dto.title,
    excerpt: dto.excerpt ?? "",
    dateLabel: dto.published_at ? formatDate(dto.published_at) : "",
  };
}

export function toEventItemVM(dto: PostListItemDTO, index: number): EventItem {
  return {
    id: dto.slug,
    href: `/tin-tuc/${dto.slug}`,
    title: dto.title,
    dateLabel: dto.published_at ? formatDate(dto.published_at) : "",
    icon: EVENT_ICON_CYCLE[index % EVENT_ICON_CYCLE.length],
  };
}

export function toScamAlertFeedItemVM(dto: PostListItemDTO, index: number): FeedItem {
  return {
    id: dto.slug,
    href: `/tin-tuc/${dto.slug}`,
    title: dto.title,
    dateLabel: dto.published_at ? formatDate(dto.published_at) : "",
    icon: SCAM_ALERT_ICON_CYCLE[index % SCAM_ALERT_ICON_CYCLE.length],
  };
}

export function toNewPartnerFeedItemVM(dto: CompanyPublicDTO, index: number): FeedItem {
  return {
    id: dto.slug,
    href: "#",
    title: `${dto.name} chính thức hợp tác tuyển dụng cùng LA Group`,
    dateLabel: formatDate(dto.created_at),
    icon: PARTNER_ICON_CYCLE[index % PARTNER_ICON_CYCLE.length],
  };
}
