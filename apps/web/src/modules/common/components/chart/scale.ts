import type { Point } from "@/types/warehouse";

export type Series = {
  name: string;
  points: Point[];
  tone: "primary" | "gold" | "negative" | "positive" | "neutral";
  dashed?: boolean;
  area?: boolean;
};

/** "Nice" round axis ticks spanning [min, max]. */
export function niceTicks(min: number, max: number, count = 5): number[] {
  if (!Number.isFinite(min) || !Number.isFinite(max)) return [0, 1];
  if (min === max) {
    min -= 1;
    max += 1;
  }
  const step0 = (max - min) / count;
  const mag = 10 ** Math.floor(Math.log10(Math.abs(step0) || 1));
  const norm = step0 / mag;
  const step = (norm >= 5 ? 5 : norm >= 2 ? 2 : 1) * mag;
  const lo = Math.floor(min / step) * step;
  const hi = Math.ceil(max / step) * step;
  const ticks: number[] = [];
  for (let v = lo; v <= hi + step / 2; v += step)
    ticks.push(Number(v.toFixed(6)));
  return ticks;
}

/** Pick ~`count` evenly spaced indices across `length` items (always includes first & last). */
export function tickIndices(length: number, count = 6): number[] {
  if (length <= count) return Array.from({ length }, (_, i) => i);
  const out: number[] = [];
  for (let i = 0; i < count; i++)
    out.push(Math.round((i * (length - 1)) / (count - 1)));
  return [...new Set(out)];
}

export function extent(series: Series[]): { min: number; max: number } {
  const ys = series.flatMap((s) => s.points.map((p) => p.y));
  if (!ys.length) return { min: 0, max: 1 };
  return { min: Math.min(...ys), max: Math.max(...ys) };
}

export type Pt = readonly [number, number];

export function project(
  points: Point[],
  plot: { x: number; y: number; w: number; h: number },
  yMin: number,
  yMax: number,
): Pt[] {
  const span = yMax - yMin || 1;
  const stepX = plot.w / Math.max(points.length - 1, 1);
  return points.map(
    (p, i) =>
      [plot.x + i * stepX, plot.y + plot.h * (1 - (p.y - yMin) / span)] as Pt,
  );
}

export function linePath(coords: Pt[]): string {
  return coords
    .map(([x, y], i) => `${i === 0 ? "M" : "L"}${x.toFixed(1)} ${y.toFixed(1)}`)
    .join(" ");
}

export function areaPath(coords: Pt[], baseY: number): string {
  if (coords.length < 2) return "";
  const first = coords[0];
  const last = coords[coords.length - 1];
  return `${linePath(coords)} L${last[0].toFixed(1)} ${baseY} L${first[0].toFixed(1)} ${baseY} Z`;
}
