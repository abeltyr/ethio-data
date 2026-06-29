import "server-only";
import { count, type Point, row, rows } from "./db";

export type IndicatorRow = {
  indicator_code: string;
  indicator_name: string;
  period: string;
  value: number;
  unit: string | null;
  provider_id: string;
};

export function latestIndicators(limit = 24): IndicatorRow[] {
  return rows<IndicatorRow>(
    "macro",
    `SELECT provider_id, indicator_code, indicator_name, period, value, unit
     FROM v_latest_indicators ORDER BY ABS(value) DESC LIMIT ?`,
    limit,
  );
}

export function indicatorSeries(code: string): Point[] {
  return rows<Point>(
    "macro",
    `SELECT period AS x, value AS y FROM economic_indicators
     WHERE indicator_code = ? AND provider_id='worldbank' ORDER BY period`,
    code,
  );
}

/** CPI level series and the latest year-over-year inflation rate derived from it. */
export function inflation() {
  const cpi = indicatorSeries("FP.CPI.TOTL");
  let latestYoY: number | null = null;
  let latestPeriod: string | null = null;
  if (cpi.length >= 2) {
    const a = cpi[cpi.length - 2];
    const b = cpi[cpi.length - 1];
    if (a && b && a.y) {
      latestYoY = ((b.y - a.y) / a.y) * 100;
      latestPeriod = b.x;
    }
  }
  return { cpi, latestYoY, latestPeriod };
}

export function coverage() {
  return {
    indicators: count("macro", "economic_indicators"),
    distinct:
      row<{ n: number }>(
        "macro",
        "SELECT COUNT(DISTINCT indicator_code) AS n FROM economic_indicators",
      )?.n ?? 0,
    span: row<{ lo: string; hi: string }>(
      "macro",
      "SELECT MIN(period) lo, MAX(period) hi FROM economic_indicators",
    ),
  };
}
