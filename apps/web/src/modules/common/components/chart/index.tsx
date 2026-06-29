"use client";

import { type PointerEvent, useRef, useState } from "react";
import { cn, num } from "@/lib/utils";
import {
  areaPath,
  extent,
  linePath,
  niceTicks,
  project,
  type Series,
  tickIndices,
} from "./scale";

export type XKind = "month" | "year" | "plain";
export type YKind = "int" | "thousands" | "pct" | "billions" | "decimal";

export type ChartProps = {
  series: Series[];
  xLabel: string;
  yLabel: string;
  xKind?: XKind;
  yKind?: YKind;
  ariaLabel: string;
};

function fmtX(x: string, kind: XKind): string {
  if (kind === "month") return x.length >= 7 ? x.slice(0, 7) : x;
  if (kind === "year") return x.slice(0, 4);
  return x;
}
function fmtY(y: number, kind: YKind): string {
  if (kind === "pct") return `${num(y, 0)}%`;
  if (kind === "billions") return `$${num(y, 0)}B`;
  if (kind === "decimal") return num(y, 1);
  return num(y, 0);
}

const W = 760;
const H = 300;
const PLOT = { x: 58, y: 16, w: 686, h: 232 };
const STROKE = {
  primary: "stroke-primary",
  gold: "stroke-gold",
  negative: "stroke-negative",
  positive: "stroke-positive",
  neutral: "stroke-muted-foreground",
} as const;
const FILL = {
  primary: "fill-primary/10",
  gold: "fill-gold/10",
  negative: "fill-negative/10",
  positive: "fill-positive/10",
  neutral: "fill-muted-foreground/10",
} as const;
const DOT = {
  primary: "fill-primary",
  gold: "fill-gold",
  negative: "fill-negative",
  positive: "fill-positive",
  neutral: "fill-muted-foreground",
} as const;

export function Chart({
  series,
  xLabel,
  yLabel,
  xKind = "month",
  yKind = "int",
  ariaLabel,
}: ChartProps) {
  const ref = useRef<SVGSVGElement>(null);
  const [hover, setHover] = useState<number | null>(null);
  const base = series.find((s) => s.points.length > 1);

  if (!base) {
    return (
      <div className="flex h-64 items-center justify-center text-muted-foreground text-sm">
        Not enough data to plot.
      </div>
    );
  }

  const { min, max } = extent(series);
  const yticks = niceTicks(min, max, 5);
  const yMin = yticks[0] ?? min;
  const yMax = yticks[yticks.length - 1] ?? max;
  const xIdx = tickIndices(base.points.length, 6);
  const stepX = PLOT.w / Math.max(base.points.length - 1, 1);
  const yOf = (v: number) =>
    PLOT.y + PLOT.h * (1 - (v - yMin) / (yMax - yMin || 1));

  const onMove = (e: PointerEvent<SVGSVGElement>) => {
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const px = ((e.clientX - rect.left) / rect.width) * W;
    const i = Math.round((px - PLOT.x) / stepX);
    setHover(i >= 0 && i < base.points.length ? i : null);
  };

  const hx = hover !== null ? PLOT.x + hover * stepX : 0;
  const tipX = Math.min(Math.max(hx, PLOT.x + 4), PLOT.x + PLOT.w - 150);

  return (
    <figure className="w-full">
      <ul className="mb-3 flex flex-wrap gap-x-4 gap-y-1">
        {series.map((s) => (
          <li
            key={s.name}
            className="flex items-center gap-1.5 text-muted-foreground text-xs"
          >
            <span
              className={cn(
                "inline-block h-0.5 w-4",
                s.tone === "gold"
                  ? "bg-gold"
                  : s.tone === "negative"
                    ? "bg-negative"
                    : s.tone === "positive"
                      ? "bg-positive"
                      : s.tone === "neutral"
                        ? "bg-muted-foreground"
                        : "bg-primary",
              )}
            />
            {s.name}
          </li>
        ))}
      </ul>
      <svg
        ref={ref}
        viewBox={`0 0 ${W} ${H}`}
        className="h-72 w-full touch-none"
        role="img"
        aria-label={ariaLabel}
        onPointerMove={onMove}
        onPointerLeave={() => setHover(null)}
      >
        <title>{ariaLabel}</title>
        {yticks.map((t) => (
          <g key={t}>
            <line
              x1={PLOT.x}
              x2={PLOT.x + PLOT.w}
              y1={yOf(t)}
              y2={yOf(t)}
              className="stroke-grid"
              strokeWidth={1}
            />
            <text
              x={PLOT.x - 8}
              y={yOf(t) + 3}
              textAnchor="end"
              className="fill-muted-foreground font-mono text-xs"
            >
              {fmtY(t, yKind)}
            </text>
          </g>
        ))}
        {xIdx.map((i) => (
          <text
            key={i}
            x={PLOT.x + i * stepX}
            y={H - 14}
            textAnchor="middle"
            className="fill-muted-foreground font-mono text-xs"
          >
            {fmtX(base.points[i]?.x ?? "", xKind)}
          </text>
        ))}
        <text
          x={16}
          y={PLOT.y + PLOT.h / 2}
          transform={`rotate(-90 16 ${PLOT.y + PLOT.h / 2})`}
          textAnchor="middle"
          className="fill-foreground font-medium text-xs"
        >
          {yLabel}
        </text>
        <text
          x={PLOT.x + PLOT.w / 2}
          y={H - 1}
          textAnchor="middle"
          className="fill-foreground font-medium text-xs"
        >
          {xLabel}
        </text>
        {series.map((s) => {
          const coords = project(s.points, PLOT, yMin, yMax);
          return (
            <g key={s.name}>
              {s.area && (
                <path
                  d={areaPath(coords, PLOT.y + PLOT.h)}
                  className={FILL[s.tone]}
                />
              )}
              <path
                d={linePath(coords)}
                className={cn(STROKE[s.tone], "fill-none")}
                strokeWidth={2}
                strokeLinejoin="round"
                strokeDasharray={s.dashed ? "4 3" : undefined}
                vectorEffect="non-scaling-stroke"
              />
            </g>
          );
        })}
        {hover !== null && (
          <g>
            <line
              x1={hx}
              x2={hx}
              y1={PLOT.y}
              y2={PLOT.y + PLOT.h}
              className="stroke-foreground/40"
              strokeWidth={1}
            />
            {series.map((s) => {
              const p = s.points[hover];
              return p ? (
                <circle
                  key={s.name}
                  cx={hx}
                  cy={yOf(p.y)}
                  r={3.5}
                  className={DOT[s.tone]}
                />
              ) : null;
            })}
            <g transform={`translate(${tipX} ${PLOT.y + 6})`}>
              <rect
                width={146}
                height={18 + series.length * 16}
                rx={3}
                className="fill-card stroke-border"
              />
              <text
                x={8}
                y={14}
                className="fill-muted-foreground font-mono text-xs"
              >
                {fmtX(base.points[hover]?.x ?? "", xKind)}
              </text>
              {series.map((s, j) => (
                <text
                  key={s.name}
                  x={8}
                  y={32 + j * 16}
                  className="fill-foreground font-mono text-xs"
                >
                  {s.name}: {fmtY(s.points[hover]?.y ?? 0, yKind)}
                </text>
              ))}
            </g>
          </g>
        )}
      </svg>
    </figure>
  );
}
