import type {
  BalanceRow,
  PartnerRow,
  RankRow,
  RawFlow,
} from "@/lib/data/warehouse/trade";
import { num, usdB } from "@/lib/utils";
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

export type TradeTemplateProps = {
  coverage: { flows: number; span?: { lo: string; hi: string } };
  year: string;
  balance: BalanceRow[];
  exports: RankRow[];
  imports: RankRow[];
  partners: PartnerRow[];
  coffee: Point[];
  raw: RawFlow[];
  findings: Finding[];
};

const cols: GlossColumn<RawFlow>[] = [
  {
    key: "period",
    label: "Year",
    mono: true,
    help: "Calendar year of the flow (annual data).",
  },
  {
    key: "flow",
    label: "Flow",
    help: "export = sold abroad; import = bought from abroad.",
  },
  {
    key: "commodity_hs",
    label: "HS",
    mono: true,
    help: "Harmonised System product code (e.g. 0901 = coffee).",
  },
  {
    key: "commodity_desc",
    label: "Commodity",
    help: "Plain-language product name.",
  },
  {
    key: "partner",
    label: "Partner",
    help: "Trading-partner country (World = all partners combined).",
  },
  {
    key: "value_usd",
    label: "Value",
    align: "right",
    mono: true,
    help: "Trade value in current US dollars.",
    format: (v) => usdB(v as number),
  },
];

export function TradeTemplate({
  coverage,
  year,
  balance,
  exports,
  imports,
  partners,
  coffee,
  raw,
  findings,
}: TradeTemplateProps) {
  const latest = balance.at(-1);
  const heroFigures: HeroFigure[] = [
    {
      label: `Exports · ${year}`,
      value: latest ? usdB(latest.exports_usd) : "—",
      tone: "positive",
    },
    {
      label: `Imports · ${year}`,
      value: latest ? usdB(latest.imports_usd) : "—",
    },
    {
      label: "Deficit",
      value: latest ? usdB(latest.balance_usd) : "—",
      tone: "negative",
    },
  ];

  const exportsBn: Point[] = balance.map((b) => ({
    x: b.period,
    y: b.exports_usd / 1e9,
  }));
  const importsBn: Point[] = balance.map((b) => ({
    x: b.period,
    y: b.imports_usd / 1e9,
  }));
  const exportPartners = partners
    .filter((p) => p.flow === "export")
    .slice(0, 6);
  const span = `${coverage.span?.lo}–${coverage.span?.hi}, annual`;

  const figures: FigureSpec[] = [
    {
      title: "Exports versus imports — the widening gap",
      xAxis: "Year",
      yAxis: "Value, USD billions",
      reading:
        "The lower line (exports) has barely moved while the upper line (imports) climbed — so the shaded distance between them, the trade deficit, has grown. That gap must be financed in foreign currency.",
      source: "UN Comtrade, annual",
      coverage: span,
      wide: true,
      chart: (
        <Chart
          ariaLabel="Annual exports and imports, USD billions"
          xLabel="Year"
          yLabel="USD billions"
          xKind="year"
          yKind="billions"
          series={[
            {
              name: "Imports",
              points: importsBn,
              tone: "negative",
              area: true,
            },
            {
              name: "Exports",
              points: exportsBn,
              tone: "positive",
              area: true,
            },
          ]}
        />
      ),
    },
    {
      title: "Coffee export earnings",
      xAxis: "Year",
      yAxis: "Value, USD millions",
      reading:
        "Coffee is the single biggest export. Its swings move the whole export line above — a reminder of how much foreign income rides on one crop and one world price.",
      source: "UN Comtrade, HS 0901, annual",
      coverage: span,
      chart: (
        <Chart
          ariaLabel="Coffee export value, USD millions, annual"
          xLabel="Year"
          yLabel="USD millions"
          xKind="year"
          yKind="thousands"
          series={[
            {
              name: "Coffee (USD m)",
              points: coffee,
              tone: "gold",
              area: true,
            },
          ]}
        />
      ),
    },
    {
      title: `What Ethiopia sells · ${year}`,
      xAxis: "Bar length = export value (USD)",
      yAxis: "Top export categories, ranked",
      reading:
        "The longest bars are the country's biggest earners. A short list dominating the total is the concentration the findings flag.",
      source: "UN Comtrade, HS chapters",
      chart: (
        <BarSeries
          tone="positive"
          items={exports.map((e) => ({
            label: e.commodity_desc,
            value: e.value_usd,
            display: usdB(e.value_usd),
          }))}
        />
      ),
    },
    {
      title: `What Ethiopia buys · ${year}`,
      xAxis: "Bar length = import value (USD)",
      yAxis: "Top import categories, ranked",
      reading:
        "The biggest bar is the country's largest import bill — where a jump in world prices hits the deficit hardest.",
      source: "UN Comtrade, HS chapters",
      chart: (
        <BarSeries
          tone="negative"
          items={imports.map((i) => ({
            label: i.commodity_desc,
            value: i.value_usd,
            display: usdB(i.value_usd),
          }))}
        />
      ),
    },
    {
      title: `Who buys from Ethiopia · ${year}`,
      xAxis: "Bar length = export value to partner (USD)",
      yAxis: "Top destination countries, ranked",
      reading:
        "The destinations for Ethiopia's exports — concentration here is a dependency on a few buyers.",
      source: "UN Comtrade, bilateral",
      wide: true,
      chart: (
        <BarSeries
          tone="primary"
          items={exportPartners.map((p) => ({
            label: p.partner,
            value: p.value_usd,
            display: usdB(p.value_usd),
          }))}
        />
      ),
    },
  ];

  return (
    <>
      <DomainHero
        eyebrow="Trade"
        amharic="ንግድ"
        title="What Ethiopia trades with the world"
        lead="Ethiopia sells coffee, sesame, and gold and buys fuel, wheat, and machinery — and it buys far more than it sells. The resulting deficit is the hidden engine behind the demand for hard currency seen on the currency page."
        figures={heroFigures}
      />
      <Findings
        title="What the trade data shows"
        amharic="ዋና ግኝቶች"
        note="Annual UN Comtrade records, through 2023. Khat and overland trade are under-reported, so these are a floor."
        findings={findings}
      />
      <FigureSection
        eyebrow="Figures"
        amharic="ሥዕላዊ መግለጫ"
        title="The evidence, plotted"
        note="Hover the time-series charts to read each year's value."
        figures={figures}
      />
      <RawDataSection
        title="Where these numbers come from"
        amharic="ጥሬ መረጃ"
        note="Each figure above aggregates these raw flow records — one row per product, partner, and year."
        description={`Largest of ${num(coverage.flows)} trade-flow records, by value.`}
        columns={cols}
        rows={raw}
        total={coverage.flows}
        source="UN Comtrade (reporter Ethiopia = 231)"
      />
    </>
  );
}
