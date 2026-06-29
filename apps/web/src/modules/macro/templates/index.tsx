import type { IndicatorRow } from "@/lib/data/warehouse/macro";
import { num, pct } from "@/lib/utils";
import { Chart } from "@/modules/common/components/chart";
import type { GlossColumn } from "@/modules/common/components/dataDisclosure";
import {
  DomainHero,
  type HeroFigure,
} from "@/modules/common/components/domainHero";
import {
  FigureSection,
  type FigureSpec,
} from "@/modules/common/components/figureSection";
import { Findings } from "@/modules/common/components/findings";
import { RawDataSection } from "@/modules/common/components/rawDataSection";
import type { Finding, Point } from "@/types/warehouse";

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
  findings: Finding[];
};

const cols: GlossColumn<IndicatorRow>[] = [
  {
    key: "indicator_code",
    label: "Code",
    mono: true,
    help: "World Bank / IMF series code (e.g. FP.CPI.TOTL).",
  },
  {
    key: "indicator_name",
    label: "Indicator",
    help: "What the series measures.",
  },
  {
    key: "period",
    label: "Latest",
    mono: true,
    help: "Most recent year with data.",
  },
  {
    key: "value",
    label: "Value",
    align: "right",
    mono: true,
    help: "The reading, in the unit shown.",
    format: (v) => num(v as number, 2),
  },
  { key: "unit", label: "Unit", help: "Unit of measure where given." },
  { key: "provider_id", label: "Source", help: "World Bank or IMF." },
];

export function MacroTemplate({
  coverage,
  indicators,
  cpi,
  gdp,
  inflationYoY,
  inflationPeriod,
  findings,
}: MacroTemplateProps) {
  const heroFigures: HeroFigure[] = [
    {
      label: `Inflation · ${inflationPeriod ?? ""}`,
      value: inflationYoY !== null ? pct(inflationYoY) : "—",
      tone: "negative",
    },
    { label: "Indicators", value: num(coverage.distinct) },
    {
      label: "Coverage",
      value: `${coverage.span?.lo}–${coverage.span?.hi}`,
      tone: "gold",
    },
  ];
  const gdpBn: Point[] = gdp.map((p) => ({ x: p.x, y: p.y / 1e9 }));
  const span = `${coverage.span?.lo} to ${coverage.span?.hi}, annual`;

  const figures: FigureSpec[] = [
    {
      title: "Consumer prices over the long run",
      xAxis: "Year",
      yAxis: "Consumer price index (level)",
      reading:
        "The index measures the cost of a fixed basket. The steeper the line, the faster money loses value — and dividing any nominal price by this curve turns it into a real, inflation-adjusted figure.",
      source: "World Bank, FP.CPI.TOTL, annual",
      coverage: span,
      wide: true,
      chart: (
        <Chart
          ariaLabel="Consumer price index level, annual"
          xLabel="Year"
          yLabel="CPI level"
          xKind="year"
          yKind="thousands"
          series={[{ name: "CPI", points: cpi, tone: "gold", area: true }]}
        />
      ),
    },
    {
      title: "The size of the economy",
      xAxis: "Year",
      yAxis: "GDP, USD billions (current)",
      reading:
        "Gross domestic product in current US dollars — the broad measure of national output. Read alongside the CPI: nominal growth and inflation are not the same thing.",
      source: "World Bank, NY.GDP.MKTP.CD, annual",
      coverage: span,
      wide: true,
      chart: (
        <Chart
          ariaLabel="Gross domestic product, current USD billions, annual"
          xLabel="Year"
          yLabel="USD billions"
          xKind="year"
          yKind="billions"
          series={[
            {
              name: "GDP (USD bn)",
              points: gdpBn,
              tone: "primary",
              area: true,
            },
          ]}
        />
      ),
    },
  ];

  return (
    <>
      <DomainHero
        eyebrow="Macro"
        amharic="ማክሮ"
        title="The big picture, year by year"
        lead="Inflation, growth, and the national indicators that frame everything else — some series reaching back to 1960. The consumer price index here is the yardstick the rest of the site uses to turn nominal prices into real ones."
        figures={heroFigures}
      />
      <Findings
        title="What the macro data shows"
        amharic="ዋና ግኝቶች"
        note="Annual series from the World Bank and IMF. The IMF forecast series may be sparse if the source blocked collection."
        findings={findings}
      />
      <FigureSection
        eyebrow="Figures"
        amharic="ሥዕላዊ መግለጫ"
        title="The evidence, plotted"
        note="Hover either chart to read a given year."
        figures={figures}
      />
      <RawDataSection
        title="Where these numbers come from"
        amharic="ጥሬ መረጃ"
        note="The most recent reading of every indicator the warehouse tracks — the same series the charts above are drawn from."
        description={`Latest value per indicator, ${num(coverage.distinct)} series.`}
        columns={cols}
        rows={indicators}
        total={coverage.indicators}
        source="World Bank · IMF"
      />
    </>
  );
}
