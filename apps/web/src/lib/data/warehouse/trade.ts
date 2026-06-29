import "server-only";
import { count, type Point, row, rows } from "./db";

export type BalanceRow = {
  period: string;
  exports_usd: number;
  imports_usd: number;
  balance_usd: number;
  export_coverage_pct: number;
};
export type RankRow = {
  commodity_hs: string;
  commodity_desc: string;
  value_usd: number;
  rank: number;
};
export type PartnerRow = {
  flow: string;
  partner: string;
  value_usd: number;
  rank: number;
};
export type RawFlow = {
  period: string;
  flow: string;
  commodity_hs: string;
  commodity_desc: string;
  partner: string;
  value_usd: number;
};

export function balanceSeries(): BalanceRow[] {
  return rows<BalanceRow>(
    "trade",
    "SELECT * FROM v_trade_balance ORDER BY period",
  );
}

export function latestYear(): string {
  return (
    row<{ y: string }>("trade", "SELECT MAX(period) AS y FROM v_top_exports")
      ?.y ?? ""
  );
}

export function topExports(year: string, limit = 10): RankRow[] {
  return rows<RankRow>(
    "trade",
    "SELECT commodity_hs, commodity_desc, value_usd, rank FROM v_top_exports WHERE period=? AND rank<=? ORDER BY rank",
    year,
    limit,
  );
}

export function topImports(year: string, limit = 10): RankRow[] {
  return rows<RankRow>(
    "trade",
    "SELECT commodity_hs, commodity_desc, value_usd, rank FROM v_top_imports WHERE period=? AND rank<=? ORDER BY rank",
    year,
    limit,
  );
}

export function topPartners(year: string, limit = 6): PartnerRow[] {
  return rows<PartnerRow>(
    "trade",
    "SELECT flow, partner, value_usd, rank FROM v_top_trade_partners WHERE period=? AND rank<=? ORDER BY flow DESC, rank",
    year,
    limit,
  );
}

/** Coffee (0901), khat (1211), hides/leather (ch.41) export value, USD millions, by year. */
export function signatureExports() {
  const raw = rows<{ hs: string; period: string; v: number }>(
    "trade",
    `SELECT commodity_hs AS hs, period, ROUND(value_usd/1e6,1) AS v FROM trade_flows
     WHERE flow='export' AND commodity_hs IN ('0901','1211','41') ORDER BY period`,
  );
  const years = [...new Set(raw.map((r) => r.period))];
  const pick = (hs: string): Point[] =>
    years.map((y) => ({
      x: y,
      y: raw.find((r) => r.hs === hs && r.period === y)?.v ?? 0,
    }));
  return { coffee: pick("0901"), khat: pick("1211"), leather: pick("41") };
}

export function rawFlows(limit = 40): RawFlow[] {
  return rows<RawFlow>(
    "trade",
    `SELECT period, flow, commodity_hs, commodity_desc, partner, value_usd
     FROM trade_flows ORDER BY period DESC, value_usd DESC LIMIT ?`,
    limit,
  );
}

export function coverage() {
  return {
    flows: count("trade", "trade_flows"),
    span: row<{ lo: string; hi: string }>(
      "trade",
      "SELECT MIN(period) lo, MAX(period) hi FROM trade_flows",
    ),
  };
}
