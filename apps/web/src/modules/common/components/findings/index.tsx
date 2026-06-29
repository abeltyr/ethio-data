import { cn } from "@/lib/utils";
import { SectionHeader } from "@/modules/common/components/sectionHeader";
import type { Finding, Tone } from "@/types/warehouse";

export type FindingsProps = {
  eyebrow?: string;
  amharic?: string;
  title: string;
  note?: string;
  findings: Finding[];
};

const STAT: Record<Tone, string> = {
  primary: "text-foreground",
  gold: "text-gold",
  negative: "text-negative",
  positive: "text-positive",
  neutral: "text-muted-foreground",
};

/** The analytical lead of a page: computed findings, each a pattern + its number + what it means. */
export function Findings({
  eyebrow = "Key findings",
  amharic,
  title,
  note,
  findings,
}: FindingsProps) {
  return (
    <section className="sp-x border-border border-b py-14">
      <SectionHeader
        eyebrow={eyebrow}
        amharic={amharic}
        title={title}
        note={note}
      />
      <div className="mt-8 grid gap-x-8 gap-y-8 sm:grid-cols-2 lg:grid-cols-3">
        {findings.map((f) => (
          <div
            key={f.label}
            className="flex flex-col gap-1.5 border-border border-l-2 pl-4"
          >
            <span
              className={cn(
                "tnum text-3xl leading-none tabular-nums",
                STAT[f.tone ?? "primary"],
              )}
            >
              {f.stat}
            </span>
            <span className="eyebrow text-muted-foreground">{f.label}</span>
            <p className="text-muted-foreground text-sm leading-relaxed">
              {f.detail}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}
