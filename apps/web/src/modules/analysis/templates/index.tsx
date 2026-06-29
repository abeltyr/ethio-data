import type {
  passThrough,
  realPrices,
  regionalSpread,
  seasonality,
} from "@/lib/data/warehouse/analysis";
import { num, pct } from "@/lib/utils";
import { BarSeries } from "@/modules/common/components/barSeries";
import { Chart } from "@/modules/common/components/chart";
import {
  DomainHero,
  type HeroFigure,
} from "@/modules/common/components/domainHero";
import {
  FigureSection,
  type FigureSpec,
} from "@/modules/common/components/figureSection";
import { Findings } from "@/modules/common/components/findings";
import type { Finding } from "@/types/warehouse";

export type AnalysisTemplateProps = {
  real: ReturnType<typeof realPrices>;
  pass: ReturnType<typeof passThrough>;
  season: ReturnType<typeof seasonality>;
  region: ReturnType<typeof regionalSpread>;
};

export function AnalysisTemplate({
  real,
  pass,
  season,
  region,
}: AnalysisTemplateProps) {
  const findings: Finding[] = [];
  const figures: FigureSpec[] = [];

  if (real) {
    findings.push({
      stat: pct(real.realRise),
      label: `Real ${real.name} price · since ${real.baseYear}`,
      tone: real.realRise > 0 ? "negative" : "positive",
      detail: `${real.name} is up ${pct(real.nomRise)} on the tag, but only ${pct(real.realRise)} once inflation is stripped out — most of the headline rise is the currency losing value, not the good getting dearer.`,
    });
    figures.push({
      title: `${real.name} — nominal vs real (inflation-adjusted) price`,
      xAxis: "Calendar month",
      yAxis: `Birr (real = constant ${real.baseYear} birr)`,
      reading:
        "The gold line is the price on the tag; the green line removes inflation using the CPI. The distance between them is pure inflation — the real line is the honest trend.",
      source: "prices × macro CPI (cross-domain)",
      coverage: `${real.nominal.length} months`,
      wide: true,
      chart: (
        <Chart
          ariaLabel={`${real.name} nominal and real price, birr, monthly`}
          xLabel="Month"
          yLabel="ETB"
          xKind="month"
          yKind="decimal"
          series={[
            {
              name: "Nominal (tag price)",
              points: real.nominal,
              tone: "gold",
              area: false,
            },
            {
              name: "Real (inflation-adjusted)",
              points: real.real,
              tone: "primary",
              area: false,
            },
          ]}
        />
      ),
    });
  }

  if (pass) {
    findings.push({
      stat: num(pass.correlation, 2),
      label: "Exchange rate ↔ food price",
      tone: "gold",
      detail: `The official birr rate and ${pass.priceName} prices track each other closely (correlation ${num(pass.correlation, 2)} of 1.00). When the birr weakens, this food price tends to follow — exchange-rate pass-through.`,
    });
    figures.push({
      title: "Exchange-rate pass-through to food prices",
      xAxis: "Calendar month",
      yAxis: "Index (first month = 100)",
      reading: `Both lines start at 100 so their shapes can be compared. When the birr line (depreciation) climbs, the ${pass.priceName} line tends to climb with it — that co-movement is pass-through. Correlation is ${num(pass.correlation, 2)}; note correlation is not proof of cause.`,
      source: "currency × prices (cross-domain)",
      coverage: `${pass.fx.length} months`,
      wide: true,
      chart: (
        <Chart
          ariaLabel="Official USD rate and food price, both indexed to 100, monthly"
          xLabel="Month"
          yLabel="Index (=100 at start)"
          xKind="month"
          yKind="int"
          series={[
            { name: "Birr per USD (index)", points: pass.fx, tone: "negative" },
            {
              name: `${pass.priceName} price (index)`,
              points: pass.price,
              tone: "gold",
            },
          ]}
        />
      ),
    });
  }

  if (season) {
    findings.push({
      stat: `${num(season.peak.y - 100, 0)}%`,
      label: `Lean-season premium · ${season.peak.x}`,
      tone: "negative",
      detail: `${season.name} is dearest in ${season.peak.x} (about ${num(season.peak.y, 0)}% of the yearly average) and cheapest around ${season.trough.x} — a predictable harvest-to-lean cycle households and aid planners can time.`,
    });
    figures.push({
      title: `When ${season.name} is dearest — the seasonal cycle`,
      xAxis: "Month of the year",
      yAxis: "Seasonal index (100 = yearly average)",
      reading:
        "Averaged across all years. Points above 100 are months when the staple costs more than the yearly average (the lean season); points below 100 are cheaper (just after harvest).",
      source: "prices, seasonal decomposition",
      coverage: "12-month average",
      chart: (
        <Chart
          ariaLabel={`${season.name} seasonal price index by month`}
          xLabel="Month"
          yLabel="Index (=100 avg)"
          xKind="plain"
          yKind="int"
          series={[
            {
              name: "Seasonal index",
              points: season.months,
              tone: "gold",
              area: true,
            },
          ]}
        />
      ),
    });
  }

  if (region) {
    findings.push({
      stat: pct(region.spreadPct),
      label: `Regional price gap · ${region.name}`,
      tone: "negative",
      detail: `${region.name} costs about ${pct(region.spreadPct)} more in ${region.high?.region ?? ""} than in ${region.low?.region ?? ""}. Large, persistent gaps mean markets aren't well connected — transport, infrastructure, or local shortages.`,
    });
    figures.push({
      title: `The geography of cost — ${region.name} by region`,
      xAxis: "Bar length = average recent price (ETB)",
      yAxis: "Region, ranked dearest to cheapest",
      reading:
        "Average price over the last year in each region. The spread between the longest and shortest bar is the regional gap — a read on how integrated the country's food markets are.",
      source: "prices × markets, last 12 months",
      chart: (
        <BarSeries
          tone="primary"
          items={region.regions.slice(0, 12).map((r) => ({
            label: r.region,
            value: r.price,
            display: num(r.price, 2),
          }))}
        />
      ),
    });
  }

  const heroFigures: HeroFigure[] = [
    real
      ? {
          label: "Real staple rise",
          value: pct(real.realRise),
          tone: "negative",
        }
      : { label: "Real prices", value: "—" },
    pass
      ? {
          label: "FX ↔ food corr.",
          value: num(pass.correlation, 2),
          tone: "gold",
        }
      : { label: "Pass-through", value: "—" },
    region
      ? {
          label: "Regional gap",
          value: pct(region.spreadPct),
          tone: "negative",
        }
      : { label: "Regional gap", value: "—" },
  ];

  return (
    <>
      <DomainHero
        eyebrow="Cross-domain analysis"
        amharic="ጥልቅ ትንተና"
        title="Where the data joins up"
        lead="The sharpest findings come from putting datasets together: deflating prices by inflation, watching food prices follow the exchange rate, separating seasonal swings from trend, and mapping the same good's price across regions. This page is the research layer — methods stated, caveats included."
        figures={heroFigures}
      />
      <Findings
        title="What the combined data shows"
        amharic="ዋና ግኝቶች"
        note="Each finding joins two or more datasets. Correlations describe co-movement, not proven cause."
        findings={findings}
      />
      <FigureSection
        eyebrow="Figures"
        amharic="ሥዕላዊ መግለጫ"
        title="The evidence, plotted"
        note="Hover any chart to read exact values; every figure states its method and axes."
        figures={figures}
      />
    </>
  );
}
