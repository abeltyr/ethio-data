import type {
  HousingSummaryRow,
  RawListing,
} from "@/lib/data/warehouse/property";
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

export type HousingTemplateProps = {
  coverage: {
    listings: number;
    regions: number;
    span?: { lo: string; hi: string };
  };
  byBedroom: HousingSummaryRow[];
  trends: { type: string; points: Point[] }[];
  raw: RawListing[];
  findings: Finding[];
};

const cols: GlossColumn<RawListing>[] = [
  {
    key: "listing_type",
    label: "Type",
    help: "Whether the home is for sale or for rent.",
  },
  { key: "property_type", label: "Property", help: "House, apartment, etc." },
  { key: "region", label: "Region", help: "Location (mostly Addis Ababa)." },
  {
    key: "bedrooms",
    label: "Beds",
    align: "right",
    mono: true,
    help: "Number of bedrooms.",
  },
  {
    key: "size_sqm",
    label: "m²",
    align: "right",
    mono: true,
    help: "Floor area in square metres.",
    format: (v) => (v ? num(v as number) : "—"),
  },
  {
    key: "price",
    label: "Price",
    align: "right",
    mono: true,
    help: "Asking price (not a closed sale).",
    format: (v) => num(v as number),
  },
  { key: "currency", label: "Ccy", help: "Currency of the price." },
  {
    key: "price_sqm",
    label: "Price/m²",
    align: "right",
    mono: true,
    help: "Price per square metre — the fair, size-adjusted comparison.",
    format: (v) => (v ? num(v as number) : "—"),
  },
];

export function HousingTemplate({
  coverage,
  byBedroom,
  trends,
  raw,
  findings,
}: HousingTemplateProps) {
  const heroFigures: HeroFigure[] = [
    { label: "Listings", value: num(coverage.listings) },
    { label: "Regions", value: num(coverage.regions) },
    {
      label: "Coverage",
      value: `${coverage.span?.lo?.slice(0, 4)}–${coverage.span?.hi?.slice(0, 4)}`,
      tone: "gold",
    },
  ];

  const figures: FigureSpec[] = [
    {
      title: "Average asking price by size",
      xAxis: "Bar length = average asking price (ETB)",
      yAxis: "Listing type and bedroom count, ranked",
      reading:
        "Each bar is the average asking price for a given type and number of bedrooms — the quickest read on how price scales with size.",
      source: "property_prices, Addis Ababa (v_housing_summary)",
      wide: true,
      chart: (
        <BarSeries
          tone="primary"
          items={byBedroom
            .filter((b) => b.avg_price > 0)
            .slice(0, 10)
            .map((b) => ({
              label: `${b.listing_type} · ${b.bedrooms} bd`,
              value: b.avg_price,
              display: num(b.avg_price),
            }))}
        />
      ),
    },
    ...trends.map(
      (t): FigureSpec => ({
        title: `${t.type} — average price over time`,
        xAxis: "Calendar month",
        yAxis: "Average asking price, birr",
        reading: `The monthly average asking price for ${t.type.toLowerCase()} listings. Treat the level as the top of the market — these are asks, not closed sales.`,
        source: "property_prices, monthly (v_housing_monthly)",
        coverage: `${t.points.length} months`,
        chart: (
          <Chart
            ariaLabel={`${t.type} monthly average asking price`}
            xLabel="Month"
            yLabel="ETB"
            xKind="month"
            yKind="thousands"
            series={[
              {
                name: `${t.type} (ETB)`,
                points: t.points,
                tone: "gold",
                area: true,
              },
            ]}
          />
        ),
      }),
    ),
  ];

  return (
    <>
      <DomainHero
        eyebrow="Housing"
        amharic="ቤት"
        title="The cost of a roof in Addis Ababa"
        lead="House and apartment listings — for sale and for rent — by size, area, and price. A direct read on urban affordability in the capital, from a historical dataset plus ongoing snapshots. These are asking prices, so read them as the ceiling, not the clearing price."
        figures={heroFigures}
      />
      <Findings
        title="What the housing data shows"
        amharic="ዋና ግኝቶች"
        note="Asking prices from listings, Addis-centric, a collected sample. Prefer price-per-m² over headline price for fair comparisons."
        findings={findings}
      />
      <FigureSection
        eyebrow="Figures"
        amharic="ሥዕላዊ መግለጫ"
        title="The evidence, plotted"
        note="Hover the trend lines to read a given month."
        figures={figures}
      />
      <RawDataSection
        title="Where these numbers come from"
        amharic="ጥሬ መረጃ"
        note="Each figure above summarises listings like these — one row per advertised home, with its size, price, and price per square metre."
        description={`Latest of ${num(coverage.listings)} listings.`}
        columns={cols}
        rows={raw}
        total={coverage.listings}
        source="realethio · Zenodo (Addis Ababa 2017–2024)"
      />
    </>
  );
}
