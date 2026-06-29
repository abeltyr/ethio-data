import type { ProviderTaskConfig } from "@ethiodata/types";
import type { CommodityPrice, Commodity, CommodityCategory } from "@ethiodata/types";
import { fetchTextWithRetry } from "../../shared/http";
import { getDb } from "@ethiodata/database";
import { seedProvider, upsertCommodity } from "@ethiodata/database";
import { saveCommodityPrices, saveCommodityAggregates } from "@ethiodata/database";
import { calculateCommodityAggregates } from "../../shared/commodity_aggregates";
import { parseCsv, toNumber } from "../../shared/parse";
import { FAOSTAT_PROVIDER } from "../registry";

const CSV_URL = "https://data.humdata.org/dataset/21876c49-d367-407c-8af4-5e47120a4151/resource/87ad9144-e4d8-4995-b4ac-d8e19b60f18a/download/eth_faostat_producer_prices.csv";

function categorize(item: string): CommodityCategory {
  const c = item.toLowerCase();
  if (c.includes("coffee")) return "coffee";
  if (/(cattle|sheep|goat|camel|live |buffalo|swine|pig|poultry|chicken|hen)/.test(c) && !c.includes("meat")) return "livestock";
  if (/meat|offal/.test(c)) return "meat";
  if (/milk|egg|honey|butter|cheese|cream/.test(c)) return "dairy";
  if (/maize|wheat|sorghum|teff|barley|rice|millet|cereal|oats/.test(c)) return "cereal";
  if (/bean|pea|lentil|chickpea|pulse|cowpea|broad bean|gram/.test(c)) return "pulse";
  if (/sesame|oil|seed|niger|groundnut|sunflower|linseed|rape|safflower/.test(c)) return "oilseed";
  if (/vegetable|onion|tomato|potato|cabbage|pepper|garlic/.test(c)) return "vegetable";
  if (/banana|orange|mango|avocado|fruit|papaya|lemon|grape/.test(c)) return "fruit";
  return "other";
}

interface Acc { item: string; year: string; lcu?: number; usd?: number }

export async function fetchFaostat(_task: ProviderTaskConfig): Promise<number> {
  const db = getDb("prices");
  seedProvider(db, FAOSTAT_PROVIDER);

  const rows = parseCsv(await fetchTextWithRetry(CSV_URL));

  // Merge the separate LCU/USD producer-price rows for the same item+year into one record.
  const acc = new Map<string, Acc>();
  for (const r of rows) {
    const item = r["Item"]?.trim();
    const year = r["Year"]?.trim();
    const element = r["Element"] || "";
    const value = toNumber(r["Value"]);
    if (!item || !year || value == null) continue;
    if (!element.includes("Producer Price") || element.includes("Index")) continue;

    const key = `${item}|${year}`;
    const entry = acc.get(key) ?? { item, year };
    if (element.includes("LCU")) entry.lcu = value;
    else if (element.includes("USD")) entry.usd = value;
    acc.set(key, entry);
  }

  const commodities = new Map<string, Commodity>();
  const prices: CommodityPrice[] = [];
  for (const e of acc.values()) {
    const price = e.lcu ?? e.usd;
    if (price == null) continue;
    const commodityId = `faostat_${e.item.toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, "")}`;
    if (!commodities.has(commodityId)) {
      commodities.set(commodityId, {
        id: commodityId, code: commodityId, name: e.item, category: categorize(e.item), unit: "tonne",
      });
    }
    prices.push({
      id: `faostat_${commodityId}_na_${e.year}_producer`,
      provider_id: "faostat", commodity_id: commodityId, market_id: "national",
      date: `${e.year}-12-31`, price,
      currency: e.lcu != null ? "ETB" : "USD",
      price_usd: e.usd ?? null, price_type: "producer", unit: "tonne",
    });
  }

  db.transaction(() => { for (const c of commodities.values()) upsertCommodity(db, c); })();
  saveCommodityPrices(db, prices);
  saveCommodityAggregates(db, calculateCommodityAggregates(prices, "year"));

  console.log(`  ${commodities.size} commodities, ${prices.length} producer prices`);
  return prices.length;
}
