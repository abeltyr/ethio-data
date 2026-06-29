import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import type { Tone } from "@/types/warehouse";

export type FigureProps = {
  label: string;
  value: string;
  unit?: string;
  sub?: ReactNode;
  tone?: Tone;
  className?: string;
};

const VALUE_TONE: Record<Tone, string> = {
  primary: "text-foreground",
  gold: "text-gold",
  negative: "text-negative",
  positive: "text-positive",
  neutral: "text-muted-foreground",
};

/** A labelled ledger figure: small-caps label, big tabular-mono value, optional sub line. */
export function Figure({
  label,
  value,
  unit,
  sub,
  tone = "primary",
  className,
}: FigureProps) {
  return (
    <div className={cn("flex flex-col gap-1", className)}>
      <span className="eyebrow text-muted-foreground">{label}</span>
      <span
        className={cn(
          "tnum text-2xl leading-none tabular-nums sm:text-3xl",
          VALUE_TONE[tone],
        )}
      >
        {value}
        {unit && (
          <span className="ml-1 text-base text-muted-foreground">{unit}</span>
        )}
      </span>
      {sub && <span className="text-muted-foreground text-sm">{sub}</span>}
    </div>
  );
}
