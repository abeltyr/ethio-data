import Link from "next/link";
import { site } from "@/lib/constants";
import { SiteNav } from "./siteNav";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-30 border-border border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
      <div className="sp-x flex flex-wrap items-center justify-between gap-x-6 gap-y-2 py-3">
        <Link href="/" className="flex items-baseline gap-2">
          <span className="font-display text-foreground text-xl tracking-tight">
            {site.name}
          </span>
          <span className="hidden font-display text-muted-foreground text-sm italic sm:inline">
            {site.amharic}
          </span>
        </Link>
        <SiteNav />
      </div>
    </header>
  );
}
