import type { CategoryRow, RawPrice } from "@/lib/data/warehouse/prices";
import { num } from "@/lib/utils";
import {
  AnalysisGrid,
  type PlateSpec,
} from "@/modules/common/components/analysisGrid";
import { BarSeries } from "@/modules/common/components/barSeries";
import type { Column } from "@/modules/common/components/dataTable";
import {
  DomainHero,
  type HeroFigure,
} from "@/modules/common/components/domainHero";
import { RawDataSection } from "@/modules/common/components/rawDataSection";
import { SeriesChart } from "@/modules/common/components/seriesChart";
import type { Point } from "@/types/warehouse";

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
};

const cols: Column<RawPrice>[] = [
  { key: "date", label: "Date", mono: true },
  { key: "provider_id", label: "Source" },
  { key: "category", label: "Category" },
  { key: "commodity", label: "Commodity" },
  { key: "market", label: "Market" },
  {
    key: "price",
    label: "Price",
    align: "right",
    mono: true,
    format: (v) => num(v as number, 2),
  },
  { key: "currency", label: "Ccy" },
  { key: "price_type", label: "Type" },
];

export function PricesTemplate({
  coverage,
  categories,
  staple,
  raw,
}: PricesTemplateProps) {
  const figures: HeroFigure[] = [
    { label: "Observations", value: num(coverage.prices) },
    { label: "Commodities", value: num(coverage.commodities) },
    { label: "Markets", value: num(coverage.markets) },
    {
      label: "Coverage",
      value: `${coverage.span?.lo?.slice(0, 4)}–${coverage.span?.hi?.slice(0, 4)}`,
      tone: "gold",
    },
  ];

  const plates: PlateSpec[] = [
    staple && {
      eyebrow: "Staple trend",
      title: `${staple.name} — monthly price`,
      source: "WFP / FEWS NET, ETB, monthly average",
      note: "The price of a daily staple over time — the inflation people feel at the market.",
      chart: (
        <SeriesChart
          points={staple.points}
          tone="gold"
          area
          ariaLabel={`${staple.name} monthly price in birr`}
        />
      ),
      wide: true,
    },
    {
      eyebrow: "Coverage",
      title: "Observations by category",
      source: "commodity_prices",
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
      wide: true,
    },
  ].filter(Boolean) as PlateSpec[];

  return (
    <>
      <DomainHero
        eyebrow="Prices"
        amharic="ዋጋ"
        title="The price of things, across the country"
        lead="Food, commodity, and livestock prices in markets nationwide, going back decades — plus global benchmarks. The basis for measuring real, inflation-adjusted living costs."
        figures={figures}
      />
      <AnalysisGrid
        eyebrow="Analysis"
        amharic="ትንተና"
        title="What it costs, and where"
        note={`${num(coverage.commodities)} commodities across ${num(coverage.markets)} markets, ${coverage.span?.lo} to ${coverage.span?.hi}.`}
        plates={plates}
      />
      <RawDataSection
        title="Every price, as recorded"
        amharic="ጥሬ መረጃ"
        note="The most recent market price observations exactly as collected — commodity, market, price, and price type."
        columns={cols}
        rows={raw}
        total={coverage.prices}
        source="WFP · FEWS NET · FAOSTAT · World Bank · ECX"
      />
    </>
  );
}
