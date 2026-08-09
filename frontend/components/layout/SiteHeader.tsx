import { MainNav } from "@/components/layout/MainNav";
import { SearchBar, type SearchBarTaxonomy } from "@/components/layout/SearchBar";
import { TopBar } from "@/components/layout/TopBar";

export function SiteHeader({
  categories,
  industrialParks,
}: {
  categories: SearchBarTaxonomy[];
  industrialParks: SearchBarTaxonomy[];
}) {
  // Chỉ TopBar + MainNav được sticky. SearchBar cố ý nằm NGOÀI khối sticky:
  // gộp cả ba vào `sticky` làm header cao 461px trên iPhone (55% của viewport
  // 844px, đo bằng trình duyệt thật) — người dùng cuộn mãi vẫn bị che gần hết
  // nội dung. Nay phần dính lại chỉ còn 64px trên mobile (TopBar ẩn dưới `sm`).
  return (
    <>
      <header className="sticky top-0 z-50">
        <TopBar />
        <MainNav />
      </header>
      <SearchBar categories={categories} industrialParks={industrialParks} />
    </>
  );
}
