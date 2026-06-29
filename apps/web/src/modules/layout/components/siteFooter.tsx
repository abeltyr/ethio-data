import Link from "next/link";
import { DOMAINS, site } from "@/lib/constants";

export function SiteFooter() {
  return (
    <footer className="sp-x mt-20 border-border border-t py-12">
      <div className="flex flex-col gap-10 md:flex-row md:justify-between">
        <div className="flex max-w-sm flex-col gap-2">
          <p className="font-display text-foreground text-lg">{site.name}</p>
          <p className="font-display text-muted-foreground text-sm italic">
            {site.amharic}
          </p>
          <p className="text-muted-foreground text-sm leading-relaxed">
            {site.description}
          </p>
        </div>
        <nav
          aria-label="Footer"
          className="grid grid-cols-2 gap-x-12 gap-y-2 sm:grid-cols-3"
        >
          {DOMAINS.map((d) => (
            <Link
              key={d.href}
              href={d.href}
              className="animate text-muted-foreground text-sm hover:text-primary"
            >
              {d.label}
            </Link>
          ))}
          <Link
            href="/methodology"
            className="animate text-muted-foreground text-sm hover:text-primary"
          >
            Methodology
          </Link>
        </nav>
      </div>
      <p className="eyebrow mt-10 text-muted-foreground">
        Collected from public &amp; private sources · shown as-is · figures
        update each collection run
      </p>
    </footer>
  );
}
