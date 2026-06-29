import { cn } from "@/lib/utils";
import type { Tone } from "@/types/warehouse";

export type BarItem = {
  label: string;
  value: number;
  display: string;
  href?: string;
};
export type BarSeriesProps = {
  items: BarItem[];
  tone?: Tone;
  className?: string;
};

const FILL: Record<Tone, string> = {
  primary: "fill-primary",
  gold: "fill-gold",
  negative: "fill-negative",
  positive: "fill-positive",
  neutral: "fill-muted-foreground",
};

export function BarSeries({
  items,
  tone = "primary",
  className,
}: BarSeriesProps) {
  const max = Math.max(...items.map((i) => i.value), 1);
  return (
    <ul className={cn("flex flex-col divide-y divide-border", className)}>
      {items.map((it) => (
        <li
          key={it.label}
          className="grid grid-cols-[1fr_auto] items-center gap-x-3 py-2"
        >
          <div className="min-w-0">
            <p className="truncate text-sm">{it.label}</p>
            <svg
              viewBox="0 0 100 4"
              preserveAspectRatio="none"
              className="mt-1 h-1 w-full"
              aria-hidden="true"
            >
              <rect
                x={0}
                y={0}
                width={(it.value / max) * 100}
                height={4}
                className={FILL[tone]}
              />
            </svg>
          </div>
          <span className="tnum self-start text-sm tabular-nums">
            {it.display}
          </span>
        </li>
      ))}
    </ul>
  );
}
