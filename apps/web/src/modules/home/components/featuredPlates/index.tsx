import Link from "next/link";
import { Chart } from "@/modules/common/components/chart";
import { Plate } from "@/modules/common/components/plate";
import { SectionHeader } from "@/modules/common/components/sectionHeader";
import type { Point } from "@/types/warehouse";

export type FeaturedPlatesProps = {
  premium: Point[];
  balanceBn: Point[];
  cpi: Point[];
};

export function FeaturedPlates({
  premium,
  balanceBn,
  cpi,
}: FeaturedPlatesProps) {
  const plates = [
    {
      eyebrow: "Currency",
      title: "Black-market premium on the dollar",
      href: "/currency",
      source: "official vs black-market USD, monthly",
      foot: "How much more a dollar costs on the street than at the bank.",
      chart: (
        <Chart
          series={[
            { name: "Premium", points: premium, tone: "negative", area: true },
          ]}
          xLabel="Month"
          yLabel="Premium (%)"
          xKind="month"
          yKind="pct"
          ariaLabel="USD black-market premium over the official rate, percent, monthly"
        />
      ),
    },
    {
      eyebrow: "Trade",
      title: "The trade balance",
      href: "/trade",
      source: "UN Comtrade, annual",
      foot: "Exports minus imports, in USD billions — a persistent deficit.",
      chart: (
        <Chart
          series={[
            {
              name: "Balance",
              points: balanceBn,
              tone: "negative",
              area: true,
            },
          ]}
          xLabel="Year"
          yLabel="USD billions"
          xKind="year"
          yKind="billions"
          ariaLabel="Annual trade balance, USD billions"
        />
      ),
    },
    {
      eyebrow: "Macro",
      title: "Consumer prices",
      href: "/macro",
      source: "World Bank, annual",
      foot: "The consumer price index — the backbone for real, inflation-adjusted figures.",
      chart: (
        <Chart
          series={[{ name: "CPI", points: cpi, tone: "gold", area: true }]}
          xLabel="Year"
          yLabel="CPI level"
          xKind="year"
          yKind="thousands"
          ariaLabel="Consumer price index level, annual"
        />
      ),
    },
  ];

  return (
    <section className="sp-x py-14">
      <SectionHeader
        eyebrow="Selected indicators"
        amharic="ተመራጭ አሃዞች"
        title="Three readings on the economy"
        note="A preview of the analysis on each domain page — every series is computed live from the warehouse."
      />
      <div className="mt-8 grid gap-5 lg:grid-cols-3">
        {plates.map((p) => (
          <Plate
            key={p.title}
            eyebrow={p.eyebrow}
            title={p.title}
            source={p.source}
          >
            {p.chart}
            <p className="mt-3 text-muted-foreground text-sm">{p.foot}</p>
            <Link
              href={p.href}
              className="eyebrow animate mt-3 inline-block text-primary hover:underline"
            >
              Explore {p.eyebrow} →
            </Link>
          </Plate>
        ))}
      </div>
    </section>
  );
}
