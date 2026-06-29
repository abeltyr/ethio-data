import type { ReactNode } from "react";
import { FigureFrame } from "@/modules/common/components/figureFrame";
import { SectionHeader } from "@/modules/common/components/sectionHeader";

export type FigureSpec = {
  title: string;
  xAxis: string;
  yAxis: string;
  reading: string;
  source: string;
  coverage?: string;
  chart: ReactNode;
  wide?: boolean;
};

export type FigureSectionProps = {
  eyebrow: string;
  amharic?: string;
  title: string;
  note?: ReactNode;
  figures: FigureSpec[];
};

/** A titled set of numbered figures (Figure 1, 2, …), each fully captioned. */
export function FigureSection({
  eyebrow,
  amharic,
  title,
  note,
  figures,
}: FigureSectionProps) {
  return (
    <section className="sp-x py-14">
      <SectionHeader
        eyebrow={eyebrow}
        amharic={amharic}
        title={title}
        note={note}
      />
      <div className="mt-8 grid items-start gap-5 lg:grid-cols-2">
        {figures.map((f, i) => (
          <div key={f.title} className={f.wide ? "lg:col-span-2" : undefined}>
            <FigureFrame
              index={i + 1}
              title={f.title}
              xAxis={f.xAxis}
              yAxis={f.yAxis}
              reading={f.reading}
              source={f.source}
              coverage={f.coverage}
            >
              {f.chart}
            </FigureFrame>
          </div>
        ))}
      </div>
    </section>
  );
}
