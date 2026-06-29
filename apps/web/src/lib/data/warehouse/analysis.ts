import "server-only";
import type { Point } from "@/types/warehouse";
import { officialUsdSeries } from "./currency";
import { rows } from "./db";
import { inflation } from "./macro";
import { firstStapleWithSeries, monthlyTrend } from "./prices";

const STAPLES = ["Maize", "Wheat", "Teff", "Sorghum", "maize", "wheat", "teff"];
const pickStaple = () => firstStapleWithSeries(STAPLES);

function pearson(x: number[], y: number[]): number {
  const n = Math.min(x.length, y.length);
  if (n < 2) return 0;
  const mx = x.reduce((s, v) => s + v, 0) / n;
  const my = y.reduce((s, v) => s + v, 0) / n;
  let sxy = 0;
  let sxx = 0;
  let syy = 0;
  for (let i = 0; i < n; i++) {
    const dx = (x[i] ?? 0) - mx;
    const dy = (y[i] ?? 0) - my;
    sxy += dx * dy;
    sxx += dx * dx;
    syy += dy * dy;
  }
  return sxx && syy ? sxy / Math.sqrt(sxx * syy) : 0;
}

/** A staple's price in nominal (tag) birr vs real (inflation-adjusted, base-year) birr. */
export function realPrices() {
  const name = pickStaple();
  if (!name) return null;
  const nominal = monthlyTrend(name);
  const cpi = inflation().cpi;
  if (nominal.length < 12 || cpi.length < 2) return null;
  const byYear = new Map(cpi.map((p) => [p.x.slice(0, 4), p.y]));
  const years = [...byYear.keys()].sort();
  const lastCpi = byYear.get(years[years.length - 1] ?? "") ?? 1;
  const cpiFor = (ym: string) => byYear.get(ym.slice(0, 4)) ?? lastCpi;
  const base = cpiFor(nominal[0]?.x ?? "");
  const real: Point[] = nominal.map((p) => ({
    x: p.x,
    y: p.y * (base / cpiFor(p.x)),
  }));
  const nomRise = nominal[0]?.y
    ? ((nominal.at(-1)?.y ?? 0) / nominal[0].y - 1) * 100
    : 0;
  const realRise = real[0]?.y
    ? ((real.at(-1)?.y ?? 0) / real[0].y - 1) * 100
    : 0;
  return {
    name,
    nominal,
    real,
    nomRise,
    realRise,
    baseYear: nominal[0]?.x.slice(0, 4) ?? "",
  };
}

/** Co-movement of the official USD rate and an import-linked food price, both indexed to 100. */
export function passThrough() {
  const fxRaw = officialUsdSeries();
  const priceName =
    firstStapleWithSeries(["Wheat", "wheat", "Maize", "maize"]) ?? pickStaple();
  if (!priceName || fxRaw.length < 6) return null;
  const fxMap = new Map(fxRaw.map((p) => [p.x, p.y]));
  const common = monthlyTrend(priceName).filter((p) => fxMap.has(p.x));
  if (common.length < 6) return null;
  const fxBase = fxMap.get(common[0]?.x ?? "") ?? 1;
  const prBase = common[0]?.y ?? 1;
  const fx: Point[] = common.map((p) => ({
    x: p.x,
    y: ((fxMap.get(p.x) ?? 0) / fxBase) * 100,
  }));
  const price: Point[] = common.map((p) => ({
    x: p.x,
    y: (p.y / prBase) * 100,
  }));
  const correlation = pearson(
    fx.map((p) => p.y),
    price.map((p) => p.y),
  );
  return { fx, price, priceName, correlation };
}

const MONTHS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

/** A staple's seasonal index — average by calendar month (100 = annual mean). */
export function seasonality() {
  const name = pickStaple();
  if (!name) return null;
  const s = monthlyTrend(name);
  if (s.length < 24) return null;
  const overall = s.reduce((sum, p) => sum + p.y, 0) / s.length;
  const buckets = new Map<number, number[]>();
  for (const p of s) {
    const m = Number(p.x.slice(5, 7));
    if (!buckets.has(m)) buckets.set(m, []);
    buckets.get(m)?.push(p.y);
  }
  const months: Point[] = [];
  for (let m = 1; m <= 12; m++) {
    const arr = buckets.get(m) ?? [];
    const avg = arr.length
      ? arr.reduce((a, b) => a + b, 0) / arr.length
      : overall;
    months.push({ x: MONTHS[m - 1] ?? String(m), y: (avg / overall) * 100 });
  }
  const peak = months.reduce(
    (a, b) => (b.y > a.y ? b : a),
    months[0] ?? { x: "", y: 100 },
  );
  const trough = months.reduce(
    (a, b) => (b.y < a.y ? b : a),
    months[0] ?? { x: "", y: 100 },
  );
  return { name, months, peak, trough };
}

/** Average recent price of a staple by region — the geography of cost. */
export function regionalSpread() {
  const name = pickStaple();
  if (!name) return null;
  const regions = rows<{ region: string; price: number }>(
    "prices",
    `SELECT m.admin1 AS region, ROUND(AVG(p.price), 2) AS price, COUNT(*) n
     FROM commodity_prices p
     JOIN commodities c ON c.id = p.commodity_id
     JOIN markets m ON m.id = p.market_id
     WHERE c.name = ? AND p.currency = 'ETB' AND p.price > 0 AND m.admin1 IS NOT NULL
       AND p.date >= (SELECT date(MAX(date), '-12 months') FROM commodity_prices)
     GROUP BY m.admin1 HAVING n >= 3 ORDER BY price DESC`,
    name,
  );
  if (regions.length < 2) return null;
  const high = regions[0];
  const low = regions[regions.length - 1];
  const spreadPct =
    high && low && low.price ? (high.price / low.price - 1) * 100 : 0;
  return { name, regions, high, low, spreadPct };
}
