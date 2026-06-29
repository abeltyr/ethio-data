import "server-only";
import { count, type Point, row, rows } from "./db";

export type CategoryRow = {
  category: string;
  commodities: number;
  observations: number;
  lo: string;
  hi: string;
};
export type RawPrice = {
  date: string;
  provider_id: string;
  category: string;
  commodity: string;
  market: string | null;
  price: number;
  currency: string;
  price_type: string;
};

export function categories(): CategoryRow[] {
  return rows<CategoryRow>(
    "prices",
    `SELECT c.category, COUNT(DISTINCT c.id) AS commodities, COUNT(*) AS observations,
            MIN(p.date) AS lo, MAX(p.date) AS hi
     FROM commodity_prices p JOIN commodities c ON c.id = p.commodity_id
     GROUP BY c.category ORDER BY observations DESC`,
  );
}

/** Monthly average ETB price for a commodity name (national/aggregate). */
export function monthlyTrend(name: string): Point[] {
  return rows<Point>(
    "prices",
    `SELECT substr(p.date,1,7) AS x, ROUND(AVG(p.price),2) AS y
     FROM commodity_prices p JOIN commodities c ON c.id = p.commodity_id
     WHERE c.name = ? AND p.currency='ETB' AND p.price > 0
     GROUP BY x ORDER BY x`,
    name,
  );
}

export function topCommodities(limit = 12) {
  return rows<{ name: string; category: string; observations: number }>(
    "prices",
    `SELECT c.name, c.category, COUNT(*) AS observations
     FROM commodity_prices p JOIN commodities c ON c.id = p.commodity_id
     GROUP BY c.id ORDER BY observations DESC LIMIT ?`,
    limit,
  );
}

/** A commodity name that actually has an ETB monthly series, for the trend plate. */
export function firstStapleWithSeries(candidates: string[]): string | null {
  for (const name of candidates) {
    const hit = row<{ n: number }>(
      "prices",
      `SELECT COUNT(*) AS n FROM commodity_prices p JOIN commodities c ON c.id=p.commodity_id
       WHERE c.name = ? AND p.currency='ETB'`,
      name,
    );
    if (hit && hit.n > 12) return name;
  }
  return null;
}

export function rawPrices(limit = 40): RawPrice[] {
  return rows<RawPrice>(
    "prices",
    `SELECT date, provider_id, category, commodity, market, price, currency, price_type
     FROM v_commodity_prices ORDER BY date DESC LIMIT ?`,
    limit,
  );
}

export function coverage() {
  return {
    prices: count("prices", "commodity_prices"),
    commodities: count("prices", "commodities"),
    markets: count("prices", "markets"),
    span: row<{ lo: string; hi: string }>(
      "prices",
      "SELECT MIN(date) lo, MAX(date) hi FROM commodity_prices",
    ),
  };
}
