import Link from "next/link";
import { DOMAINS } from "@/lib/constants";
import type { DomainSummary } from "@/lib/data/warehouse/overview";
import { num } from "@/lib/utils";
import { SectionHeader } from "@/modules/common/components/sectionHeader";

export function WarehouseGrid({ summary }: { summary: DomainSummary[] }) {
  const byKey = new Map(summary.map((s) => [s.key, s]));
  return (
    <section className="sp-x py-14">
      <SectionHeader
        eyebrow="The warehouse"
        amharic="የመረጃ ቤቱ"
        title="Five domains, one source of truth"
        note="Each subject is its own database — queried live on this site and on its own page. Counts and coverage update every collection run."
      />
      <ul className="mt-8 grid gap-px overflow-hidden rounded-md border border-border bg-border sm:grid-cols-2 lg:grid-cols-3">
        {DOMAINS.map((d) => {
          const s = byKey.get(d.key);
          return (
            <li key={d.key} className="bg-card">
              <Link
                href={d.href}
                className="animate flex h-full flex-col gap-3 p-5 hover:bg-accent/40"
              >
                <div className="flex items-baseline justify-between">
                  <span className="font-display text-foreground text-lg">
                    {d.label}
                  </span>
                  <span className="font-display text-muted-foreground italic">
                    {d.amharic}
                  </span>
                </div>
                <p className="text-muted-foreground text-sm">{d.tagline}</p>
                <div className="mt-auto flex items-baseline justify-between gap-2 border-border border-t pt-3">
                  <span className="tnum text-sm tabular-nums">
                    {num(s?.rows)} rows
                  </span>
                  <span className="tnum text-muted-foreground text-xs tabular-nums">
                    {s?.lo} → {s?.hi}
                  </span>
                </div>
                <span className="eyebrow text-muted-foreground">
                  {d.sources}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
