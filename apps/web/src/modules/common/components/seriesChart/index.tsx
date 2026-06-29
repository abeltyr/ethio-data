import { cn } from "@/lib/utils";
import type { Point, Tone } from "@/types/warehouse";

export type SeriesChartProps = {
  points: Point[];
  tone?: Tone;
  area?: boolean;
  /** Optional second comparison series, drawn muted. */
  baseline?: Point[];
  className?: string;
  ariaLabel: string;
};

const STROKE: Record<Tone, string> = {
  primary: "stroke-primary",
  gold: "stroke-gold",
  negative: "stroke-negative",
  positive: "stroke-positive",
  neutral: "stroke-muted-foreground",
};
const FILL: Record<Tone, string> = {
  primary: "fill-primary/10",
  gold: "fill-gold/10",
  negative: "fill-negative/10",
  positive: "fill-positive/10",
  neutral: "fill-muted-foreground/10",
};

const W = 720;
const H = 200;
const PAD = 8;

function path(
  points: Point[],
  min: number,
  max: number,
): { line: string; area: string } {
  const span = max - min || 1;
  const stepX = (W - PAD * 2) / Math.max(points.length - 1, 1);
  const coords = points.map((p, i) => {
    const x = PAD + i * stepX;
    const y = PAD + (H - PAD * 2) * (1 - (p.y - min) / span);
    return [x, y] as const;
  });
  const line = coords
    .map(([x, y], i) => `${i === 0 ? "M" : "L"}${x.toFixed(1)} ${y.toFixed(1)}`)
    .join(" ");
  const first = coords[0];
  const last = coords.at(-1);
  const area =
    first && last
      ? `${line} L${last[0].toFixed(1)} ${H - PAD} L${first[0].toFixed(1)} ${H - PAD} Z`
      : "";
  return { line, area };
}

export function SeriesChart({
  points,
  tone = "primary",
  area,
  baseline,
  className,
  ariaLabel,
}: SeriesChartProps) {
  if (points.length < 2) {
    return (
      <div
        className={cn(
          "flex h-40 items-center justify-center text-muted-foreground text-sm",
          className,
        )}
      >
        Not enough data to plot.
      </div>
    );
  }
  const all = [...points, ...(baseline ?? [])].map((p) => p.y);
  const min = Math.min(...all);
  const max = Math.max(...all);
  const main = path(points, min, max);
  const base =
    baseline && baseline.length > 1 ? path(baseline, min, max) : null;

  return (
    <figure className={cn("w-full", className)}>
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="h-40 w-full sm:h-48"
        preserveAspectRatio="none"
        role="img"
        aria-label={ariaLabel}
      >
        <title>{ariaLabel}</title>
        {[0.25, 0.5, 0.75].map((g) => (
          <line
            key={g}
            x1={PAD}
            x2={W - PAD}
            y1={PAD + (H - PAD * 2) * g}
            y2={PAD + (H - PAD * 2) * g}
            className="stroke-grid"
            strokeWidth={1}
          />
        ))}
        {base && (
          <path
            d={base.line}
            className="stroke-muted-foreground/50 fill-none"
            strokeWidth={1.5}
            strokeDasharray="3 3"
            vectorEffect="non-scaling-stroke"
          />
        )}
        {area && <path d={main.area} className={FILL[tone]} />}
        <path
          d={main.line}
          className={cn(STROKE[tone], "fill-none")}
          strokeWidth={2}
          vectorEffect="non-scaling-stroke"
          strokeLinejoin="round"
        />
      </svg>
    </figure>
  );
}
