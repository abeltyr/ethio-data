import type { IndicatorRow } from "@/lib/data/warehouse/macro";
import { num, pct } from "@/lib/utils";
import {
  AnalysisGrid,
  type PlateSpec,
} from "@/modules/common/components/analysisGrid";
import type { Column } from "@/modules/common/components/dataTable";
import {
  DomainHero,
  type HeroFigure,
} from "@/modules/common/components/domainHero";
import { RawDataSection } from "@/modules/common/components/rawDataSection";
import { SeriesChart } from "@/modules/common/components/seriesChart";
import type { Point } from "@/types/warehouse";

export type MacroTemplateProps = {
  coverage: {
    indicators: number;
    distinct: number;
    span?: { lo: string; hi: string };
  };
  indicators: IndicatorRow[];
  cpi: Point[];
  gdp: Point[];
  inflationYoY: number | null;
  inflationPeriod: string | null;
};

const cols: Column<IndicatorRow>[] = [
  { key: "indicator_code", label: "Code", mono: true },
  { key: "indicator_name", label: "Indicator" },
  { key: "period", label: "Latest", mono: true },
  {
    key: "value",
    label: "Value",
    align: "right",
    mono: true,
    format: (v) => num(v as number, 2),
  },
  { key: "unit", label: "Unit" },
  { key: "provider_id", label: "Source" },
];

export function MacroTemplate({
  coverage,
  indicators,
  cpi,
  gdp,
  inflationYoY,
  inflationPeriod,
}: MacroTemplateProps) {
  const figures: HeroFigure[] = [
    {
      label: `Inflation · CPI YoY · ${inflationPeriod ?? ""}`,
      value: inflationYoY !== null ? pct(inflationYoY) : "—",
      tone: "negative",
    },
    { label: "Indicators", value: num(coverage.distinct) },
    { label: "Observations", value: num(coverage.indicators) },
    {
      label: "Coverage",
      value: `${coverage.span?.lo}–${coverage.span?.hi}`,
      tone: "gold",
    },
  ];

  const plates: PlateSpec[] = [
    {
      eyebrow: "Inflation",
      title: "Consumer price index",
      source: "World Bank, FP.CPI.TOTL, annual",
      note: "The CPI is the backbone for turning nominal figures into real, inflation-adjusted ones across the whole warehouse.",
      chart: (
        <SeriesChart
          points={cpi}
          tone="gold"
          area
          ariaLabel="Consumer price index level, annual"
        />
      ),
      wide: true,
    },
    {
      eyebrow: "Output",
      title: "Gross domestic product",
      source: "World Bank, NY.GDP.MKTP.CD, annual (current USD)",
      note: "GDP in current US dollars — the size of the economy over the long run.",
      chart: (
        <SeriesChart
          points={gdp}
          tone="primary"
          area
          ariaLabel="Gross domestic product, current USD, annual"
        />
      ),
      wide: true,
    },
  ];

  return (
    <>
      <DomainHero
        eyebrow="Macro"
        amharic="ማክሮ"
        title="The big picture, year by year"
        lead="Inflation, growth, and the national indicators that frame everything else — going back as far as 1960. This is the inflation backbone the rest of the site uses to compute real prices."
        figures={figures}
      />
      <AnalysisGrid
        eyebrow="Analysis"
        amharic="ትንተና"
        title="Prices and output over the long run"
        note={`${num(coverage.distinct)} distinct indicators, ${num(coverage.indicators)} observations, ${coverage.span?.lo} to ${coverage.span?.hi}. Annual data.`}
        plates={plates}
      />
      <RawDataSection
        title="Latest value per indicator"
        amharic="ጥሬ መረጃ"
        note="The most recent reading of each macro indicator, exactly as collected."
        columns={cols}
        rows={indicators}
        total={coverage.indicators}
        source="World Bank · IMF"
      />
    </>
  );
}
