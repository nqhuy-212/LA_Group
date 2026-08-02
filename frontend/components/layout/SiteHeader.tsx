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
  return (
    <header className="sticky top-0 z-50">
      <TopBar />
      <MainNav />
      <SearchBar categories={categories} industrialParks={industrialParks} />
    </header>
  );
}
