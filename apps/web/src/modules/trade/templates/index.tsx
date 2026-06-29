import type {
  BalanceRow,
  PartnerRow,
  RankRow,
  RawFlow,
} from "@/lib/data/warehouse/trade";
import { num, usdB } from "@/lib/utils";
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

export type TradeTemplateProps = {
  coverage: { flows: number; span?: { lo: string; hi: string } };
  year: string;
  balance: BalanceRow[];
  exports: RankRow[];
  imports: RankRow[];
  partners: PartnerRow[];
  coffee: Point[];
  raw: RawFlow[];
};

const cols: Column<RawFlow>[] = [
  { key: "period", label: "Year", mono: true },
  { key: "flow", label: "Flow" },
  { key: "commodity_hs", label: "HS", mono: true },
  { key: "commodity_desc", label: "Commodity" },
  { key: "partner", label: "Partner" },
  {
    key: "value_usd",
    label: "Value (USD)",
    align: "right",
    mono: true,
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
}: TradeTemplateProps) {
  const latest = balance.at(-1);
  const figures: HeroFigure[] = [
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
      label: "Balance",
      value: latest ? usdB(latest.balance_usd) : "—",
      tone: "negative",
    },
    {
      label: "Export coverage",
      value: latest ? `${num(latest.export_coverage_pct, 1)}%` : "—",
      tone: "negative",
    },
  ];

  const balanceBn: Point[] = balance.map((b) => ({
    x: b.period,
    y: b.balance_usd / 1e9,
  }));
  const exportPartners = partners
    .filter((p) => p.flow === "export")
    .slice(0, 6);

  const plates: PlateSpec[] = [
    {
      eyebrow: "Trade balance",
      title: "Ethiopia buys far more than it sells",
      source: "UN Comtrade, annual (v_trade_balance)",
      note: "Exports minus imports, USD billions. The deficit is structural — it drives much of the demand for foreign currency.",
      chart: (
        <SeriesChart
          points={balanceBn}
          tone="negative"
          area
          ariaLabel="Annual trade balance, USD billions"
        />
      ),
      wide: true,
    },
    {
      eyebrow: "Signature export",
      title: "Coffee export earnings",
      source: "UN Comtrade, HS 0901, annual",
      note: "Coffee is Ethiopia's economic icon and a top foreign-currency earner. Values in USD millions.",
      chart: (
        <SeriesChart
          points={coffee}
          tone="gold"
          area
          ariaLabel="Coffee export value, USD millions, annual"
        />
      ),
    },
    {
      eyebrow: `Top exports · ${year}`,
      title: "What Ethiopia sells",
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
      eyebrow: `Top imports · ${year}`,
      title: "What Ethiopia buys",
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
      eyebrow: `Export partners · ${year}`,
      title: "Who buys from Ethiopia",
      source: "UN Comtrade, bilateral",
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
      wide: true,
    },
  ];

  return (
    <>
      <DomainHero
        eyebrow="Trade"
        amharic="ንግድ"
        title="What Ethiopia trades with the world"
        lead="Annual exports and imports — coffee, khat, sesame, and gold against fuel, wheat, and machinery — and the persistent deficit between them. The deficit, in turn, sits behind the demand for hard currency."
        figures={figures}
      />
      <AnalysisGrid
        eyebrow="Analysis"
        amharic="ትንተና"
        title="Exports, imports, and the deficit"
        note={`Covering ${num(coverage.flows)} trade-flow records, ${coverage.span?.lo} to ${coverage.span?.hi}. Annual data; khat and some overland trade are under-reported, so figures are a floor.`}
        plates={plates}
      />
      <RawDataSection
        title="Every flow, as recorded"
        amharic="ጥሬ መረጃ"
        note="The largest recent export and import flows exactly as collected — by HS code, partner, and year."
        columns={cols}
        rows={raw}
        total={coverage.flows}
        source="UN Comtrade (reporter Ethiopia = 231)"
      />
    </>
  );
}
