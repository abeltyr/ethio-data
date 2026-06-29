import type { ProviderTaskConfig } from "@ethiodata/types";
import type { CommodityPrice, Commodity, Market, CommodityCategory } from "@ethiodata/types";
import { fetchTextWithRetry } from "../../shared/http";
import { getDb } from "@ethiodata/database";
import { seedProvider, upsertCommodity, upsertMarket } from "@ethiodata/database";
import { saveCommodityPrices } from "@ethiodata/database";
import { parseCsvEach, toNumber } from "../../shared/parse";
import { WORLDBANK_RTP_PROVIDER } from "../registry";

const CSV_URL = "https://data.humdata.org/dataset/7752a1d8-7d7a-4feb-a857-11026dad7188/resource/825d0fbb-4a6e-4602-9d10-10262b2bf5aa/download/real-time-food-prices-for-ethiopia.csv";

const META_COLS = new Set([
  "ISO3", "country", "adm1_name", "adm2_name", "mkt_name", "lat", "lon", "geo_id", "DATES",
  "year", "month", "currency", "components", "start_dense_data", "last_survey_point",
  "data_coverage", "data_coverage_recent", "index_confidence_score", "spatially_interpolated",
]);
const EXCLUDED_PREFIXES = ["o_", "h_", "l_", "c_", "inflation_", "trust_"];

function isCommodityCol(k: string): boolean {
  return !META_COLS.has(k) && !EXCLUDED_PREFIXES.some(p => k.startsWith(p));
}

function categorize(code: string): CommodityCategory {
  const c = code.toLowerCase();
  if (c.includes("coffee")) return "coffee";
  if (c.startsWith("livestock") || /(cattle|sheep|goat|camel|oxen)/.test(c)) return "livestock";
  if (/(fuel|diesel|petrol|kerosene|gas)/.test(c)) return "fuel";
  if (/(maize|wheat|sorghum|teff|barley|rice|millet|bread|pasta|bulgur|cassava)/.test(c)) return "cereal";
  if (/(bean|pea|lentil|chickpea|cowpea|gram)/.test(c)) return "pulse";
  if (/(oil|sesame|niger|groundnut|sunflower)/.test(c)) return "oilseed";
  if (/(milk|butter|cheese|yogurt)/.test(c)) return "dairy";
  if (/(meat|beef|egg|chicken|mutton|fish)/.test(c)) return "meat";
  if (/(apple|banana|orange|mango|tomato|onion|cabbage|carrot|potato|chili|pepper|garlic)/.test(c)) return "vegetable";
  return "other";
}

function prettify(code: string): string {
  return code.replace(/_fao$/, " (FAO)").replace(/_/g, " ").replace(/\b\w/g, m => m.toUpperCase());
}

export async function fetchWorldBankRtp(_task: ProviderTaskConfig): Promise<number> {
  const db = getDb("prices");
  seedProvider(db, WORLDBANK_RTP_PROVIDER);

  const text = await fetchTextWithRetry(CSV_URL);

  const commodities = new Map<string, Commodity>();
  const markets = new Map<string, Market>();
  const persisted = new Set<string>();
  let commodityCols: string[] | null = null;
  let batch: CommodityPrice[] = [];
  let total = 0;

  const flush = () => {
    if (!batch.length) return;
    // Persist any newly-seen dimensions before the prices that reference them.
    db.transaction(() => {
      for (const c of commodities.values()) if (!persisted.has(c.id)) { upsertCommodity(db, c); persisted.add(c.id); }
      for (const m of markets.values()) if (!persisted.has(m.id)) { upsertMarket(db, m); persisted.add(m.id); }
    })();
    saveCommodityPrices(db, batch);
    total += batch.length;
    batch = [];
  };

  parseCsvEach(text, row => {
    if (!commodityCols) commodityCols = Object.keys(row).filter(isCommodityCol);

    const date = row["DATES"]?.trim();
    const geoId = row["geo_id"]?.trim();
    if (!date) return;

    const marketId = geoId ? `wbrtp_${geoId}` : "national";
    if (marketId !== "national" && !markets.has(marketId)) {
      markets.set(marketId, {
        id: marketId, name: row["mkt_name"]?.trim() || marketId,
        admin1: row["adm1_name"]?.trim() || undefined, admin2: row["adm2_name"]?.trim() || undefined,
        latitude: toNumber(row["lat"]) ?? undefined, longitude: toNumber(row["lon"]) ?? undefined,
      });
    }
    const currency = row["currency"]?.trim() || "ETB";

    for (const col of commodityCols) {
      const price = toNumber(row[col]);
      if (price == null) continue;
      const commodityId = `wbrtp_${col}`;
      if (!commodities.has(commodityId)) {
        commodities.set(commodityId, { id: commodityId, code: col, name: prettify(col), category: categorize(col), unit: "unit" });
      }
      batch.push({
        id: `wbrtp_${commodityId}_${marketId ?? "na"}_${date}_retail`,
        provider_id: "worldbank_rtp", commodity_id: commodityId, market_id: marketId,
        date, price, currency, price_usd: null, price_type: "retail", unit: "unit",
      });
    }
    if (batch.length >= 5000) flush();
  });

  flush();

  console.log(`  ${commodities.size} commodities, ${markets.size} markets, ${total} prices (ML-imputed estimates; aggregates skipped)`);
  return total;
}
