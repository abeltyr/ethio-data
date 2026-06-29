import type { ProviderTaskConfig } from "../../shared/provider_types";
import { fetchWithRetry } from "../../shared/http";
import { getProviderDb } from "../../shared/database";
import { seedProvider, upsertCurrency } from "../../shared/database/seed";
import { shouldSkipDate, recordFetch } from "../../shared/database/ledger";
import { saveExchangeRates, saveAggregates } from "../../shared/database/save";
import { calculateAggregates } from "../../shared/aggregates";
import { NBE_PROVIDER } from "../registry";

interface NbeResponse {
  success: boolean;
  message: string;
  data: Array<{ currency_id: string; buying: string; selling: string; date: string;
                weighted_average: string; currency: { id: string; code: string; name: string } }>;
}

export async function fetchNbeDaily(task: ProviderTaskConfig, date: string): Promise<any[]> {
  if (!task.endpoint) throw new Error("No endpoint configured");
  
  const db = getProviderDb("nbe");
  seedProvider(db, NBE_PROVIDER);

  if (shouldSkipDate(db, "nbe", task.id, date)) return [];

  const data = await fetchWithRetry<NbeResponse>(`${NBE_PROVIDER.api_url}${task.endpoint}?date=${date}`);
  if (!data.success) throw new Error(data.message);
  
  data.data.forEach(item => upsertCurrency(db, {
    id: item.currency_id, code: item.currency.code, name: item.currency.name
  }));
  
  const rates = data.data.map(item => ({
    id: `nbe_${item.currency_id}_${date}`,
    provider_id: "nbe",
    currency_id: item.currency_id,
    currency: { id: item.currency_id, code: item.currency.code, name: item.currency.name },
    date: item.date,
    buying: parseFloat(item.buying),
    selling: parseFloat(item.selling),
    weighted_average: parseFloat(item.weighted_average)
  }));
  
  saveExchangeRates(db, rates);
  saveAggregates(db, [...calculateAggregates(rates, "week"), ...calculateAggregates(rates, "month"),
                         ...calculateAggregates(rates, "year")]);

  recordFetch(db, "nbe", task.id, date, rates.length ? "ok" : "empty", rates.length);
  return rates;
}
