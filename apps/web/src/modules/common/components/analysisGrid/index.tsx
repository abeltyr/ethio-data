import type { ReactNode } from "react";
import { Plate } from "@/modules/common/components/plate";
import { SectionHeader } from "@/modules/common/components/sectionHeader";

export type PlateSpec = {
  eyebrow?: string;
  title: string;
  source: string;
  note?: ReactNode;
  chart: ReactNode;
  figure?: ReactNode;
  wide?: boolean;
};

export type AnalysisGridProps = {
  eyebrow: string;
  amharic?: string;
  title: string;
  note?: ReactNode;
  plates: PlateSpec[];
};

/** A titled grid of data plates. Templates build the chart specs and pass them in. */
export function AnalysisGrid({
  eyebrow,
  amharic,
  title,
  note,
  plates,
}: AnalysisGridProps) {
  return (
    <section className="sp-x py-14">
      <SectionHeader
        eyebrow={eyebrow}
        amharic={amharic}
        title={title}
        note={note}
      />
      <div className="mt-8 grid gap-5 lg:grid-cols-2">
        {plates.map((p) => (
          <Plate
            key={p.title}
            eyebrow={p.eyebrow}
            title={p.title}
            source={p.source}
            figure={p.figure}
            className={p.wide ? "lg:col-span-2" : undefined}
          >
            {p.chart}
            {p.note && (
              <p className="mt-3 text-muted-foreground text-sm leading-relaxed">
                {p.note}
              </p>
            )}
          </Plate>
        ))}
      </div>
    </section>
  );
}
