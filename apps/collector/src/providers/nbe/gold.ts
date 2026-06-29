import type { GoldRate } from "@ethiodata/types";
import type { ProviderTaskConfig } from "@ethiodata/types";
import { fetchWithRetry } from "../../shared/http";
import { getDb } from "@ethiodata/database";
import { upsertGoldType } from "@ethiodata/database";
import { shouldSkipDate, recordFetch } from "@ethiodata/database";
import { saveGoldRates } from "@ethiodata/database";
import { NBE_PROVIDER } from "../registry";

interface GoldResponse {
  success: boolean;
  message: string;
  data: Array<{
    id: string; gold_type_id: string; price_usd: string; price_birr: string;
    date: string; gold_type: { id: string; karat: string; level: string };
  }>;
}

export async function fetchNbeGold(task: ProviderTaskConfig, date: string): Promise<GoldRate[]> {
  if (!task.endpoint) throw new Error("No endpoint configured");
  
  const db = getDb("currency");

  if (shouldSkipDate(db, "nbe", task.id, date)) return [];

  const url = `${NBE_PROVIDER.api_url}${task.endpoint}?date=${date}`;
  const data = await fetchWithRetry<GoldResponse>(url);
  
  if (!data.success) throw new Error(data.message);
  
  data.data.forEach(item => upsertGoldType(db, {
    id: item.gold_type_id, karat: item.gold_type.karat, level: item.gold_type.level
  }));
  
  const goldRates: GoldRate[] = data.data.map(item => ({
    id: `gold_${item.gold_type_id}_${date}`,
    gold_type_id: item.gold_type_id,
    price_usd: parseFloat(item.price_usd),
    price_birr: parseFloat(item.price_birr),
    date: item.date,
    gold_type: { id: item.gold_type_id, karat: item.gold_type.karat, level: item.gold_type.level }
  }));
  
  saveGoldRates(db, goldRates);
  recordFetch(db, "nbe", task.id, date, goldRates.length ? "ok" : "empty", goldRates.length);
  return goldRates;
}
