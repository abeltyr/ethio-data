import "server-only";
import type { Domain } from "@ethiodata/types";
import { latestFx } from "./currency";
import { count, row } from "./db";
import { inflation } from "./macro";
import { balanceSeries } from "./trade";

const FACT: Record<Domain, { table: string; dateExpr: string }> = {
  currency: { table: "exchange_rates", dateExpr: "date" },
  prices: { table: "commodity_prices", dateExpr: "date" },
  macro: { table: "economic_indicators", dateExpr: "period" },
  trade: { table: "trade_flows", dateExpr: "period" },
  property: {
    table: "property_prices",
    dateExpr: "COALESCE(listed_date, collected_at)",
  },
};

export type DomainSummary = {
  key: Domain;
  rows: number;
  lo: string;
  hi: string;
};

export function warehouseSummary(): DomainSummary[] {
  return (Object.keys(FACT) as Domain[]).map((key) => {
    const { table, dateExpr } = FACT[key];
    const span = row<{ lo: string; hi: string }>(
      key,
      `SELECT MIN(${dateExpr}) lo, MAX(${dateExpr}) hi FROM ${table}`,
    );
    return {
      key,
      rows: count(key, table),
      lo: span?.lo ?? "—",
      hi: span?.hi ?? "—",
    };
  });
}

export function headline() {
  const fx = latestFx();
  const inf = inflation();
  const balance = balanceSeries();
  return {
    fx,
    inflation: inf,
    balance: balance.at(-1) ?? null,
  };
}

export type Headline = ReturnType<typeof headline>;
