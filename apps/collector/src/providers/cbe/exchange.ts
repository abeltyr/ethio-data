import type { ProviderTaskConfig } from "@ethiodata/types";
import type { ExchangeRate } from "@ethiodata/types";
import { fetchWithRetry } from "../../shared/http";
import { getDb } from "@ethiodata/database";
import { seedProvider, upsertCurrencyByCode } from "@ethiodata/database";
import { shouldSkipDate, recordFetch } from "@ethiodata/database";
import { saveExchangeRates, saveAggregates } from "@ethiodata/database";
import { calculateAggregates } from "../../shared/aggregates";
import { CBE_PROVIDER } from "../registry";

interface CbeCurrency {
  CurrencyCode: string;
  CurrencyName: string;
}

interface CbeExchangeRate {
  cashBuying: number;
  cashSelling: number;
  transactionalBuying: number;
  transactionalSelling: number;
  weightedAverageBuying?: number;
  weightedAverageSelling?: number;
  currency: CbeCurrency;
}

interface CbeResponse {
  Date: string;
  ExchangeRate: CbeExchangeRate[];
}

export async function fetchCbeDaily(task: ProviderTaskConfig, date: string): Promise<ExchangeRate[]> {
  if (!task.endpoint) throw new Error("No endpoint configured");
  
  const db = getDb("currency");
  seedProvider(db, CBE_PROVIDER);

  if (shouldSkipDate(db, "cbe", task.id, date)) return [];

  const data = await fetchWithRetry<CbeResponse[]>(`${CBE_PROVIDER.api_url}${task.endpoint}?_limit=1&Date=${date}`);
  if (!data || data.length === 0) { recordFetch(db, "cbe", task.id, date, "empty", 0); return []; }
  
  const rates: ExchangeRate[] = [];
  const rateData = data[0]!;
  
  for (const item of rateData.ExchangeRate) {
    const currencyId = upsertCurrencyByCode(db, {
      code: item.currency.CurrencyCode,
      name: item.currency.CurrencyName
    });
    
    const cashBuying = item.cashBuying ?? undefined;
    const cashSelling = item.cashSelling ?? undefined;
    const transactionBuying = item.transactionalBuying ?? undefined;
    const transactionSelling = item.transactionalSelling ?? undefined;
    const weightedAvgBuying = item.weightedAverageBuying ?? undefined;
    const weightedAvgSelling = item.weightedAverageSelling ?? undefined;
    
    const buyingRate = Math.max(
      cashBuying ?? 0,
      transactionBuying ?? 0,
      weightedAvgBuying ?? 0
    );
    const sellingRate = Math.max(
      cashSelling ?? 0,
      transactionSelling ?? 0,
      weightedAvgSelling ?? 0
    );
    
    rates.push({
      id: `cbe_${currencyId}_${date}`,
      provider_id: "cbe",
      currency_id: currencyId,
      currency: { id: currencyId, code: item.currency.CurrencyCode, name: item.currency.CurrencyName },
      date: rateData.Date,
      buying: buyingRate,
      selling: sellingRate,
      buying_rate: buyingRate,
      selling_rate: sellingRate,
      cash_buying: cashBuying,
      cash_selling: cashSelling,
      transaction_buying: transactionBuying,
      transaction_selling: transactionSelling,
      avg_buying_rate: weightedAvgBuying,
      avg_selling_rate: weightedAvgSelling
    });
  }
  
  saveExchangeRates(db, rates);
  saveAggregates(db, [
    ...calculateAggregates(rates, "week"),
    ...calculateAggregates(rates, "month"),
    ...calculateAggregates(rates, "year")
  ]);

  recordFetch(db, "cbe", task.id, date, rates.length ? "ok" : "empty", rates.length);
  return rates;
}
