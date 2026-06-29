import type {
  HousingSummaryRow,
  RawListing,
} from "@/lib/data/warehouse/property";
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

export type HousingTemplateProps = {
  coverage: {
    listings: number;
    regions: number;
    span?: { lo: string; hi: string };
  };
  byBedroom: HousingSummaryRow[];
  trends: { type: string; points: Point[] }[];
  raw: RawListing[];
};

const cols: Column<RawListing>[] = [
  { key: "listing_type", label: "Type" },
  { key: "property_type", label: "Property" },
  { key: "region", label: "Region" },
  { key: "bedrooms", label: "Beds", align: "right", mono: true },
  {
    key: "size_sqm",
    label: "m²",
    align: "right",
    mono: true,
    format: (v) => (v ? num(v as number) : "—"),
  },
  {
    key: "price",
    label: "Price",
    align: "right",
    mono: true,
    format: (v) => num(v as number),
  },
  { key: "currency", label: "Ccy" },
  {
    key: "price_sqm",
    label: "Price/m²",
    align: "right",
    mono: true,
    format: (v) => (v ? num(v as number) : "—"),
  },
];

export function HousingTemplate({
  coverage,
  byBedroom,
  trends,
  raw,
}: HousingTemplateProps) {
  const figures: HeroFigure[] = [
    { label: "Listings", value: num(coverage.listings) },
    { label: "Regions", value: num(coverage.regions) },
    {
      label: "Coverage",
      value: `${coverage.span?.lo?.slice(0, 4)}–${coverage.span?.hi?.slice(0, 4)}`,
      tone: "gold",
    },
  ];

  const plates: PlateSpec[] = [
    {
      eyebrow: "By size",
      title: "Average price by bedroom count",
      source: "property_prices, Addis Ababa (v_housing_summary)",
      note: "Asking prices by listing type and number of bedrooms.",
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
      wide: true,
    },
    ...trends.map(
      (t): PlateSpec => ({
        eyebrow: "Trend",
        title: `${t.type} — monthly average price`,
        source: "property_prices, monthly (v_housing_monthly)",
        chart: (
          <SeriesChart
            points={t.points}
            tone="gold"
            area
            ariaLabel={`${t.type} monthly average price`}
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
        lead="House and apartment listings — for sale and for rent — by size, area, and price. A view of urban affordability in the capital, from a historical dataset plus ongoing snapshots."
        figures={figures}
      />
      <AnalysisGrid
        eyebrow="Analysis"
        amharic="ትንተና"
        title="What it costs to live in the capital"
        note={`${num(coverage.listings)} listings across ${num(coverage.regions)} regions, ${coverage.span?.lo} to ${coverage.span?.hi}. Asking prices, not sale prices.`}
        plates={plates}
      />
      <RawDataSection
        title="Every listing, as recorded"
        amharic="ጥሬ መረጃ"
        note="The most recent listings exactly as collected — type, size, price, and price per square metre."
        columns={cols}
        rows={raw}
        total={coverage.listings}
        source="realethio · Zenodo (Addis Ababa 2017–2024)"
      />
    </>
  );
}
