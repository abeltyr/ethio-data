import type { CategoryRow, RawPrice } from "@/lib/data/warehouse/prices";
import { num } from "@/lib/utils";
import { BarSeries } from "@/modules/common/components/barSeries";
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

export type PricesTemplateProps = {
  coverage: {
    prices: number;
    commodities: number;
    markets: number;
    span?: { lo: string; hi: string };
  };
  categories: CategoryRow[];
  staple: { name: string; points: Point[] } | null;
  raw: RawPrice[];
  findings: Finding[];
};

const cols: GlossColumn<RawPrice>[] = [
  { key: "date", label: "Date", mono: true, help: "Observation date." },
  {
    key: "provider_id",
    label: "Source",
    help: "Collecting agency (wfp, fewsnet, etc.).",
  },
  {
    key: "category",
    label: "Category",
    help: "Broad group — cereals, pulses, livestock…",
  },
  { key: "commodity", label: "Commodity", help: "The specific good priced." },
  {
    key: "market",
    label: "Market",
    help: "Where it was observed (a town, or 'national').",
  },
  {
    key: "price",
    label: "Price",
    align: "right",
    mono: true,
    help: "Price in the currency shown, per unit.",
    format: (v) => num(v as number, 2),
  },
  {
    key: "currency",
    label: "Ccy",
    help: "Currency of the price (usually ETB).",
  },
  { key: "price_type", label: "Type", help: "Retail, wholesale, or farmgate." },
];

export function PricesTemplate({
  coverage,
  categories,
  staple,
  raw,
  findings,
}: PricesTemplateProps) {
  const heroFigures: HeroFigure[] = [
    { label: "Observations", value: num(coverage.prices) },
    { label: "Commodities", value: num(coverage.commodities) },
    { label: "Markets", value: num(coverage.markets), tone: "gold" },
  ];

  const figures: FigureSpec[] = [
    staple && {
      title: `${staple.name} — the price of a daily staple`,
      xAxis: "Calendar month",
      yAxis: "Price, birr",
      reading: `Each point is the average market price of ${staple.name.toLowerCase()} that month. A rising line is food inflation as households experience it — far more tangible than a national index.`,
      source: "WFP / FEWS NET, monthly average, ETB",
      coverage: `${staple.points.length} months · ${coverage.span?.lo} to ${coverage.span?.hi}`,
      wide: true,
      chart: (
        <Chart
          ariaLabel={`${staple.name} monthly price in birr`}
          xLabel="Month"
          yLabel="ETB"
          xKind="month"
          yKind="decimal"
          series={[
            {
              name: `${staple.name} (ETB)`,
              points: staple.points,
              tone: "gold",
              area: true,
            },
          ]}
        />
      ),
    },
    {
      title: "Where the data is deepest",
      xAxis: "Bar length = number of price observations",
      yAxis: "Commodity category, ranked",
      reading:
        "Longer bars mean more observations — the categories where trends and regional gaps can be measured most confidently.",
      source: "commodity_prices",
      wide: true,
      chart: (
        <BarSeries
          tone="primary"
          items={categories.slice(0, 8).map((c) => ({
            label: c.category,
            value: c.observations,
            display: num(c.observations),
          }))}
        />
      ),
    },
  ].filter(Boolean) as FigureSpec[];

  return (
    <>
      <DomainHero
        eyebrow="Prices"
        amharic="ዋጋ"
        title="The price of things, across the country"
        lead="Food, commodity, and livestock prices in markets nationwide, going back decades. This is where inflation stops being an abstraction: it is the cost of teff, maize, and oil, market by market and month by month."
        figures={heroFigures}
      />
      <Findings
        title="What the price data shows"
        amharic="ዋና ግኝቶች"
        note="Prices are nominal (the tag price). To compare across years honestly, deflate them by the CPI on the macro page."
        findings={findings}
      />
      <FigureSection
        eyebrow="Figures"
        amharic="ሥዕላዊ መግለጫ"
        title="The evidence, plotted"
        note="Hover the line to read each month's price."
        figures={figures}
      />
      <RawDataSection
        title="Where these numbers come from"
        amharic="ጥሬ መረጃ"
        note="Every trend above is averaged from rows like these — individual market observations, each with its commodity, place, and price type."
        description={`Latest of ${num(coverage.prices)} price observations.`}
        columns={cols}
        rows={raw}
        total={coverage.prices}
        source="WFP · FEWS NET · FAOSTAT · World Bank · ECX"
      />
    </>
  );
}
