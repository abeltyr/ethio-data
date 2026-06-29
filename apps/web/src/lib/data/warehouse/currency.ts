import "server-only";
import { count, type Point, row, rows } from "./db";

export type PremiumRow = {
  period: string;
  parallel: number;
  official: number;
  premium: number;
};
export type RawRate = {
  date: string;
  provider_id: string;
  code: string;
  buying: number;
  selling: number;
};

export function premiumSeries(): PremiumRow[] {
  return rows<PremiumRow>(
    "currency",
    `SELECT period, parallel_rate AS parallel, official_rate AS official, premium_pct AS premium
     FROM v_informal_fx_premium WHERE currency = 'USD' ORDER BY period`,
  );
}

export function officialUsdSeries(): Point[] {
  return rows<Point>(
    "currency",
    `SELECT substr(e.date,1,7) AS x, ROUND(AVG(e.selling),2) AS y
     FROM exchange_rates e JOIN currencies c ON c.id = e.currency_id
     WHERE c.code = 'USD' AND e.provider_id IN ('cbe','nbe','zemen') AND e.selling > 0
     GROUP BY x ORDER BY x`,
  );
}

export function goldSeries(): Point[] {
  return rows<Point>(
    "currency",
    `SELECT substr(date,1,7) AS x, ROUND(AVG(price_birr)) AS y
     FROM gold_rates WHERE price_birr > 0 GROUP BY x ORDER BY x`,
  );
}

export function latestFx() {
  const official = row<{ d: string; v: number }>(
    "currency",
    `SELECT e.date AS d, e.selling AS v FROM exchange_rates e JOIN currencies c ON c.id = e.currency_id
     WHERE c.code='USD' AND e.provider_id IN ('cbe','nbe') AND e.selling > 0 ORDER BY e.date DESC LIMIT 1`,
  );
  const premium = row<PremiumRow>(
    "currency",
    `SELECT period, parallel_rate AS parallel, official_rate AS official, premium_pct AS premium
     FROM v_informal_fx_premium WHERE currency='USD' ORDER BY period DESC LIMIT 1`,
  );
  const gold = row<{ price_birr: number; price_usd: number; date: string }>(
    "currency",
    "SELECT price_birr, price_usd, date FROM gold_rates ORDER BY date DESC LIMIT 1",
  );
  return { official, premium, gold };
}

export function rawRates(limit = 40): RawRate[] {
  return rows<RawRate>(
    "currency",
    `SELECT e.date, e.provider_id, c.code, e.buying, e.selling
     FROM exchange_rates e JOIN currencies c ON c.id = e.currency_id
     ORDER BY e.date DESC, e.provider_id, c.code LIMIT ?`,
    limit,
  );
}

export function coverage() {
  return {
    rates: count("currency", "exchange_rates"),
    gold: count("currency", "gold_rates"),
    currencies: count("currency", "currencies"),
    span: row<{ lo: string; hi: string }>(
      "currency",
      "SELECT MIN(date) lo, MAX(date) hi FROM exchange_rates",
    ),
  };
}
