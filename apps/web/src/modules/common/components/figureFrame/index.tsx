import type { ReactNode } from "react";

export type FigureFrameProps = {
  index: number;
  title: string;
  xAxis: string;
  yAxis: string;
  reading: string;
  source: string;
  coverage?: string;
  children: ReactNode;
};

/** Wraps a chart with a numbered, self-explaining research caption: what it shows, what the
 *  axes are, how to read it, and where it comes from. */
export function FigureFrame({
  index,
  title,
  xAxis,
  yAxis,
  reading,
  source,
  coverage,
  children,
}: FigureFrameProps) {
  return (
    <figure className="flex flex-col gap-4 rounded-md border border-border bg-card p-5">
      <figcaption>
        <p className="eyebrow text-primary">Figure {index}</p>
        <h3 className="mt-1 font-display text-foreground text-xl leading-tight">
          {title}
        </h3>
      </figcaption>
      {children}
      <dl className="grid gap-2 border-border border-t pt-4 text-muted-foreground text-sm">
        <div className="flex gap-2">
          <dt className="shrink-0 font-medium text-foreground">Reading</dt>
          <dd className="leading-relaxed">{reading}</dd>
        </div>
        <div className="flex flex-wrap gap-x-6 gap-y-1">
          <span>
            <span className="font-medium text-foreground">X-axis</span> ·{" "}
            {xAxis}
          </span>
          <span>
            <span className="font-medium text-foreground">Y-axis</span> ·{" "}
            {yAxis}
          </span>
        </div>
        <div className="text-xs">
          Source · {source}
          {coverage ? ` · ${coverage}` : ""}
        </div>
      </dl>
    </figure>
  );
}
