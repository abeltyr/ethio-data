import type { PremiumRow, RawRate } from "@/lib/data/warehouse/currency";
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
};

const cols: Column<RawRate>[] = [
  { key: "date", label: "Date", mono: true },
  { key: "provider_id", label: "Source" },
  { key: "code", label: "Ccy" },
  {
    key: "buying",
    label: "Buying",
    align: "right",
    mono: true,
    format: (v) => num(v as number, 2),
  },
  {
    key: "selling",
    label: "Selling",
    align: "right",
    mono: true,
    format: (v) => num(v as number, 2),
  },
];

export function CurrencyTemplate({
  coverage,
  latest,
  premium,
  gold,
  raw,
}: CurrencyTemplateProps) {
  const figures: HeroFigure[] = [
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
    {
      label: "Gold",
      value: latest.gold ? num(latest.gold.price_birr) : "—",
      unit: "ETB/g",
      tone: "gold",
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

  const plates: PlateSpec[] = [
    {
      eyebrow: "Informal market",
      title: "Black-market premium on the dollar",
      source: "black-market vs official USD, monthly (v_informal_fx_premium)",
      note: "A persistent positive premium is the clearest sign of foreign-currency scarcity and pressure to devalue.",
      chart: (
        <SeriesChart
          points={premiumPts}
          tone="negative"
          area
          ariaLabel="USD black-market premium over the official rate, percent, monthly"
        />
      ),
      wide: true,
    },
    {
      eyebrow: "Exchange rate",
      title: "Official vs parallel USD",
      source: "official (banks) and black-market USD, monthly",
      note: "The dashed line is the official bank rate; the solid line is the street rate. The gap is the premium above.",
      chart: (
        <SeriesChart
          points={parallelPts}
          baseline={officialPts}
          tone="gold"
          ariaLabel="Parallel and official USD exchange rate, monthly"
        />
      ),
    },
    {
      eyebrow: "Store of value",
      title: "Gold price, birr per gram",
      source: "gold_rates, monthly average",
      note: "When a currency is unstable, gold is a refuge — its birr price tracks depreciation.",
      chart: (
        <SeriesChart
          points={gold}
          tone="gold"
          area
          ariaLabel="Gold price in birr per gram, monthly"
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
        lead="Official bank exchange rates, the black-market (parallel) rate people actually pay, and gold — the clearest window onto foreign-currency scarcity and the value of the birr."
        figures={figures}
      />
      <AnalysisGrid
        eyebrow="Analysis"
        amharic="ትንተና"
        title="Official, parallel, and the premium between"
        note={`Covering ${num(coverage.rates)} exchange-rate and ${num(coverage.gold)} gold observations across ${num(coverage.currencies)} currencies, ${coverage.span?.lo} to ${coverage.span?.hi}.`}
        plates={plates}
      />
      <RawDataSection
        title="Every rate, as recorded"
        amharic="ጥሬ መረጃ"
        note="The most recent exchange-rate rows exactly as collected from each source — buying and selling, per currency, per day."
        columns={cols}
        rows={raw}
        total={coverage.rates}
        source="NBE · CBE · Zemen · Hibret · black-market · parallel"
      />
    </>
  );
}
