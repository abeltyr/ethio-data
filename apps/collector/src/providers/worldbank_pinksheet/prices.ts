import type { ProviderTaskConfig } from "@ethiodata/types";
import type { CommodityPrice, Commodity, CommodityCategory } from "@ethiodata/types";
import { fetchTextWithRetry, fetchBufferWithRetry } from "../../shared/http";
import { getDb } from "@ethiodata/database";
import { seedProvider, upsertCommodity, upsertMarket } from "@ethiodata/database";
import { saveCommodityPrices, saveCommodityAggregates } from "@ethiodata/database";
import { calculateCommodityAggregates } from "../../shared/commodity_aggregates";
import { readSheetMatrix } from "../../shared/parse";
import { WORLDBANK_PINKSHEET_PROVIDER } from "../registry";

const MARKETS_PAGE = "https://www.worldbank.org/en/research/commodity-markets";
const FALLBACK_XLSX = "https://thedocs.worldbank.org/en/doc/74e8be41ceb20fa0da750cda2f6b9e4e-0050012026/related/CMO-Historical-Data-Monthly.xlsx";

// Global benchmark series we care about; matched against the sheet's header cells.
const TARGETS: Array<{ match: RegExp; name: string; code: string; category: CommodityCategory }> = [
  { match: /coffee.*arabica/i, name: "Coffee, Arabica", code: "coffee_arabica", category: "coffee" },
  { match: /coffee.*robusta/i, name: "Coffee, Robusta", code: "coffee_robusta", category: "coffee" },
  { match: /^gold/i, name: "Gold", code: "gold", category: "metal" },
  { match: /crude oil, average/i, name: "Crude oil, average", code: "crude_oil_avg", category: "fuel" },
  { match: /^tea, avg|^tea,/i, name: "Tea, average", code: "tea_avg", category: "other" },
  { match: /^maize/i, name: "Maize", code: "maize", category: "cereal" },
  { match: /wheat, us hrw|^wheat,/i, name: "Wheat", code: "wheat", category: "cereal" },
  { match: /^sorghum/i, name: "Sorghum", code: "sorghum", category: "cereal" },
  { match: /^soybeans/i, name: "Soybeans", code: "soybeans", category: "oilseed" },
  { match: /^sugar.*world|^sugar,/i, name: "Sugar, world", code: "sugar", category: "other" },
];

async function resolveXlsxUrl(): Promise<string> {
  try {
    const html = await fetchTextWithRetry(MARKETS_PAGE);
    const m = html.match(/https:\/\/[^"' ]*CMO-Historical-Data-Monthly\.xlsx/);
    if (m) return m[0];
  } catch { /* fall through */ }
  return FALLBACK_XLSX;
}

function parseDate(cell: any): string | null {
  const m = String(cell).match(/^(\d{4})M(\d{2})$/);
  return m ? `${m[1]}-${m[2]}-15` : null;
}

export async function fetchPinkSheet(_task: ProviderTaskConfig): Promise<number> {
  const db = getDb("prices");
  seedProvider(db, WORLDBANK_PINKSHEET_PROVIDER);
  upsertMarket(db, { id: "global", name: "Global benchmark", country: "WLD" });

  const url = await resolveXlsxUrl();
  const rows = readSheetMatrix(await fetchBufferWithRetry(url), "Monthly Prices");

  // Find first data row (col 0 looks like "1960M01"); header names sit two rows above, units one above.
  const dataStart = rows.findIndex(r => r[0] && /^\d{4}M\d{2}$/.test(String(r[0])));
  if (dataStart < 2) throw new Error("Could not locate data rows in Pink Sheet");
  const names = rows[dataStart - 2] ?? [];
  const units = rows[dataStart - 1] ?? [];

  // Resolve each target to its column index (first matching header cell).
  const cols = TARGETS.map(t => {
    const idx = names.findIndex(n => typeof n === "string" && t.match.test(n));
    return { ...t, idx, unit: idx >= 0 ? String(units[idx] ?? "").replace(/[()]/g, "").trim() || "USD" : "USD" };
  }).filter(c => c.idx >= 0);

  const commodities = new Map<string, Commodity>();
  const prices: CommodityPrice[] = [];
  for (let i = dataStart; i < rows.length; i++) {
    const date = parseDate(rows[i]![0]);
    if (!date) continue;
    for (const c of cols) {
      const v = rows[i]![c.idx];
      if (typeof v !== "number" || !Number.isFinite(v)) continue;
      const commodityId = `pinksheet_${c.code}`;
      if (!commodities.has(commodityId)) {
        commodities.set(commodityId, { id: commodityId, code: c.code, name: c.name, category: c.category, unit: c.unit });
      }
      prices.push({
        id: `pinksheet_${commodityId}_global_${date}_spot`,
        provider_id: "worldbank_pinksheet", commodity_id: commodityId, market_id: "global",
        date, price: v, currency: "USD", price_usd: v, price_type: "spot", unit: c.unit,
      });
    }
  }

  db.transaction(() => { for (const c of commodities.values()) upsertCommodity(db, c); })();
  saveCommodityPrices(db, prices);
  saveCommodityAggregates(db, calculateCommodityAggregates(prices, "year"));

  console.log(`  ${commodities.size} benchmarks, ${prices.length} monthly prices`);
  return prices.length;
}
