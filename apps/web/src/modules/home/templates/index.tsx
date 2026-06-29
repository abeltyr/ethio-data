import type { PremiumRow } from "@/lib/data/warehouse/currency";
import type { DomainSummary, Headline } from "@/lib/data/warehouse/overview";
import type { BalanceRow } from "@/lib/data/warehouse/trade";
import { num, pct, usdB } from "@/lib/utils";
import { Ticker, type TickerItem } from "@/modules/common/components/ticker";
import type { Point } from "@/types/warehouse";
import { FeaturedPlates } from "../components/featuredPlates";
import { Masthead } from "../components/masthead";
import { WarehouseGrid } from "../components/warehouseGrid";

export type HomeTemplateProps = {
  summary: DomainSummary[];
  headline: Headline;
  premium: PremiumRow[];
  balance: BalanceRow[];
  cpi: Point[];
};

export function HomeTemplate({
  summary,
  headline,
  premium,
  balance,
  cpi,
}: HomeTemplateProps) {
  const totalRows = summary.reduce((acc, s) => acc + s.rows, 0);
  const lo = summary.map((s) => s.lo.slice(0, 4)).sort()[0] ?? "";
  const hi =
    summary
      .map((s) => s.hi.slice(0, 4))
      .sort()
      .at(-1) ?? "";

  const { fx, inflation, balance: latestBalance } = headline;
  const ticker: TickerItem[] = [
    {
      label: "USD · official",
      value: fx.official ? num(fx.official.v, 2) : "—",
      tone: "primary",
    },
    {
      label: "USD · parallel",
      value: fx.premium ? num(fx.premium.parallel, 2) : "—",
      tone: "gold",
    },
    {
      label: "Parallel premium",
      value: fx.premium ? pct(fx.premium.premium) : "—",
      tone: "negative",
    },
    {
      label: "Inflation · CPI YoY",
      value: inflation.latestYoY !== null ? pct(inflation.latestYoY) : "—",
      tone: "negative",
      deltaPositiveIsGood: false,
    },
    {
      label: `Trade balance · ${latestBalance?.period ?? ""}`,
      value: latestBalance ? usdB(latestBalance.balance_usd) : "—",
      tone: "negative",
    },
    {
      label: "Gold · ETB/g",
      value: fx.gold ? num(fx.gold.price_birr) : "—",
      tone: "gold",
    },
  ];

  const premiumPoints: Point[] = premium.map((p) => ({
    x: p.period,
    y: p.premium,
  }));
  const balanceBn: Point[] = balance.map((b) => ({
    x: b.period,
    y: b.balance_usd / 1e9,
  }));

  return (
    <>
      <Masthead
        observations={num(totalRows)}
        span={`${lo}–${hi}`}
        sources={summary.length * 3}
      />
      <Ticker items={ticker} />
      <WarehouseGrid summary={summary} />
      <FeaturedPlates premium={premiumPoints} balanceBn={balanceBn} cpi={cpi} />
    </>
  );
}
