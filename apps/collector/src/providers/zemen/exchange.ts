import type { ProviderTaskConfig } from "@ethiodata/types";
import type { ExchangeRate } from "@ethiodata/types";
import { fetchWithRetry } from "../../shared/http";
import { getDb } from "@ethiodata/database";
import { seedProvider, upsertCurrencyByCode } from "@ethiodata/database";
import { shouldSkipDate, recordFetch } from "@ethiodata/database";
import { saveExchangeRates, saveAggregates } from "@ethiodata/database";
import { calculateAggregates } from "../../shared/aggregates";
import { ZEMEN_PROVIDER } from "../registry";

const CURRENCY_NAMES: Record<string, string> = {
  USD: "US Dollar", EUR: "Euro", GBP: "British Pound", CHF: "Swiss Franc",
  CAD: "Canadian Dollar", AUD: "Australian Dollar", JPY: "Japanese Yen", CNY: "Chinese Yuan",
  AED: "UAE Dirham", SAR: "Saudi Riyal", SEK: "Swedish Krona", NOK: "Norwegian Krone",
  DKK: "Danish Krone", KWD: "Kuwaiti Dinar", ZAR: "South African Rand", INR: "Indian Rupee",
};

interface ZemenRate {
  currency_code: string;
  buying_rate?: string;
  selling_rate?: string;
  cash_buying_rate?: string;
  cash_selling_rate?: string;
  avg_buying_rate?: string;
  avg_selling_rate?: string;
}
interface ZemenResponse { status: string; date: string; rates?: { day?: ZemenRate[] } }

const num = (s?: string): number | undefined => {
  if (s == null) return undefined;
  const n = parseFloat(s);
  return Number.isFinite(n) ? n : undefined;
};

export async function fetchZemenDaily(_task: ProviderTaskConfig, date: string): Promise<ExchangeRate[]> {
  const db = getDb("currency");
  seedProvider(db, ZEMEN_PROVIDER);
  if (shouldSkipDate(db, "zemen", _task.id, date)) return [];

  const res = await fetchWithRetry<ZemenResponse>(`${ZEMEN_PROVIDER.api_url}/wp-admin/admin-ajax.php`, 0, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: `action=get_exchange_rates&date=${date}`,
  });
  if (res.status !== "success" || !res.rates?.day?.length) { recordFetch(db, "zemen", _task.id, date, "empty", 0); return []; }

  const rates: ExchangeRate[] = [];
  for (const item of res.rates.day) {
    const code = item.currency_code?.trim();
    if (!code) continue;
    const currencyId = upsertCurrencyByCode(db, { code, name: CURRENCY_NAMES[code] || code });

    const txnBuy = num(item.buying_rate), txnSell = num(item.selling_rate);
    const cashBuy = num(item.cash_buying_rate), cashSell = num(item.cash_selling_rate);
    const avgBuy = num(item.avg_buying_rate), avgSell = num(item.avg_selling_rate);

    const buying = Math.max(txnBuy ?? 0, cashBuy ?? 0, avgBuy ?? 0);
    const selling = Math.max(txnSell ?? 0, cashSell ?? 0, avgSell ?? 0);
    if (buying === 0 && selling === 0) continue;

    rates.push({
      id: `zemen_${currencyId}_${date}`,
      provider_id: "zemen", currency_id: currencyId,
      currency: { id: currencyId, code, name: CURRENCY_NAMES[code] || code },
      date, buying, selling,
      buying_rate: txnBuy, selling_rate: txnSell,
      cash_buying: cashBuy, cash_selling: cashSell,
      transaction_buying: txnBuy, transaction_selling: txnSell,
      avg_buying_rate: avgBuy, avg_selling_rate: avgSell,
    });
  }

  saveExchangeRates(db, rates);
  saveAggregates(db, [
    ...calculateAggregates(rates, "week"),
    ...calculateAggregates(rates, "month"),
    ...calculateAggregates(rates, "year"),
  ]);
  recordFetch(db, "zemen", _task.id, date, rates.length ? "ok" : "empty", rates.length);
  return rates;
}
