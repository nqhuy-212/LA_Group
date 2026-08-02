import { MainNav } from "@/components/layout/MainNav";
import { SearchBar } from "@/components/layout/SearchBar";
import { TopBar } from "@/components/layout/TopBar";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-50">
      <TopBar />
      <MainNav />
      <SearchBar />
    </header>
  );
}
