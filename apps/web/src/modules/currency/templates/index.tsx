import type { PremiumRow, RawRate } from "@/lib/data/warehouse/currency";
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

export type CurrencyTemplateProps = {
  coverage: {
    rates: number;
    gold: number;
    currencies: number;
    span?: { lo: string; hi: string };
  };
  latest: {
    official?: { d: string; v: number };
    premium?: PremiumRow;
    gold?: { price_birr: number; date: string };
  };
  premium: PremiumRow[];
  gold: Point[];
  raw: RawRate[];
  findings: Finding[];
};

const cols: GlossColumn<RawRate>[] = [
  {
    key: "date",
    label: "Date",
    mono: true,
    help: "Trading day the rate was published.",
  },
  {
    key: "provider_id",
    label: "Source",
    help: "Who quoted it — nbe/cbe/zemen are official banks; blackmarket/parallel is the street.",
  },
  { key: "code", label: "Ccy", help: "ISO currency code (USD, EUR, GBP…)." },
  {
    key: "buying",
    label: "Buying",
    align: "right",
    mono: true,
    help: "Birr paid to buy one unit of the currency.",
    format: (v) => num(v as number, 2),
  },
  {
    key: "selling",
    label: "Selling",
    align: "right",
    mono: true,
    help: "Birr charged to sell one unit — the rate you actually pay.",
    format: (v) => num(v as number, 2),
  },
];

export function CurrencyTemplate({
  coverage,
  latest,
  premium,
  gold,
  raw,
  findings,
}: CurrencyTemplateProps) {
  const heroFigures: HeroFigure[] = [
    {
      label: "USD · official",
      value: latest.official ? num(latest.official.v, 2) : "—",
      unit: "ETB",
    },
    {
      label: "USD · parallel",
      value: latest.premium ? num(latest.premium.parallel, 2) : "—",
      unit: "ETB",
      tone: "gold",
    },
    {
      label: "Premium",
      value: latest.premium ? pct(latest.premium.premium) : "—",
      tone: "negative",
    },
  ];

  const premiumPts: Point[] = premium.map((p) => ({
    x: p.period,
    y: p.premium,
  }));
  const parallelPts: Point[] = premium.map((p) => ({
    x: p.period,
    y: p.parallel,
  }));
  const officialPts: Point[] = premium.map((p) => ({
    x: p.period,
    y: p.official,
  }));
  const cov = `${premium.length} months · ${coverage.span?.lo} to ${coverage.span?.hi}`;

  const figures: FigureSpec[] = [
    {
      title: "The black-market premium on the US dollar",
      xAxis: "Calendar month",
      yAxis: "Premium — % the street rate sits above the official rate",
      reading:
        "When the line rises, a dollar costs much more on the street than at the bank — the textbook signal that hard currency is scarce. A flat line near zero would mean the two rates agree.",
      source: "official banks vs black-market USD (v_informal_fx_premium)",
      coverage: cov,
      wide: true,
      chart: (
        <Chart
          ariaLabel="USD parallel-market premium over the official rate, percent, by month"
          xLabel="Month"
          yLabel="Premium (%)"
          xKind="month"
          yKind="pct"
          series={[
            {
              name: "Premium",
              points: premiumPts,
              tone: "negative",
              area: true,
            },
          ]}
        />
      ),
    },
    {
      title: "Official vs parallel exchange rate",
      xAxis: "Calendar month",
      yAxis: "Birr per US dollar",
      reading:
        "The solid line is the street rate, the dashed line the official bank rate. The vertical gap between them is exactly the premium plotted in Figure 1 — here you see the two prices that produce it.",
      source: "banks (official) and black-market (parallel), monthly average",
      coverage: cov,
      chart: (
        <Chart
          ariaLabel="Parallel and official USD exchange rate, birr per dollar, by month"
          xLabel="Month"
          yLabel="ETB per USD"
          xKind="month"
          yKind="int"
          series={[
            { name: "Parallel (street)", points: parallelPts, tone: "gold" },
            {
              name: "Official (banks)",
              points: officialPts,
              tone: "primary",
              dashed: true,
            },
          ]}
        />
      ),
    },
    {
      title: "Gold as a store of value",
      xAxis: "Calendar month",
      yAxis: "Birr per gram",
      reading:
        "Gold's birr price tends to climb as the currency weakens — so a rising line here is the flip side of the depreciation in the figures above, priced in something tangible.",
      source: "gold_rates, monthly average",
      coverage: `${gold.length} months`,
      chart: (
        <Chart
          ariaLabel="Gold price in birr per gram, by month"
          xLabel="Month"
          yLabel="ETB per gram"
          xKind="month"
          yKind="thousands"
          series={[
            { name: "Gold (ETB/g)", points: gold, tone: "gold", area: true },
          ]}
        />
      ),
    },
  ];

  return (
    <>
      <DomainHero
        eyebrow="Currency & FX"
        amharic="ብር"
        title="The price of money in Ethiopia"
        lead="The story of the birr is the gap between two prices for a dollar: the official rate the banks publish, and the parallel rate people actually pay. That gap is the country's clearest gauge of hard-currency scarcity — and it has been wide."
        figures={heroFigures}
      />
      <Findings
        title="What the exchange-rate data shows"
        amharic="ዋና ግኝቶች"
        note="Read top to bottom: each figure below is the evidence behind one of these findings."
        findings={findings}
      />
      <FigureSection
        eyebrow="Figures"
        amharic="ሥዕላዊ መግለጫ"
        title="The evidence, plotted"
        note="Hover any chart to read the exact value at each month."
        figures={figures}
      />
      <RawDataSection
        title="Where these numbers come from"
        amharic="ጥሬ መረጃ"
        note="Every figure above is computed from these raw rows — the exact rates each bank and market published. Open the table to inspect or audit them."
        description={`Latest of ${num(coverage.rates)} exchange-rate records, one per source, currency, and day.`}
        columns={cols}
        rows={raw}
        total={coverage.rates}
        source="NBE · CBE · Zemen · Hibret · black-market · parallel"
      />
    </>
  );
}
