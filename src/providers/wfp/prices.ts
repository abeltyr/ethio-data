import type { ProviderTaskConfig } from "../../shared/provider_types";
import type { CommodityPrice, Commodity, Market, CommodityCategory, PriceType } from "../../shared/types";
import { fetchTextWithRetry } from "../../shared/http";
import { getProviderDb } from "../../shared/database";
import { seedProvider, upsertCommodity, upsertMarket } from "../../shared/database/seed";
import { saveCommodityPrices, saveCommodityAggregates } from "../../shared/database/save";
import { calculateCommodityAggregates } from "../../shared/commodity_aggregates";
import { parseCsv, dropHxlRow, toNumber } from "../../shared/parse";
import { WFP_PROVIDER } from "../registry";

const CSV_URL = "https://data.humdata.org/dataset/2e4f1922-e446-4b57-a98a-d0e2d5e34afa/resource/87bac18e-f3aa-4b29-8cf8-76763e823dc5/download/wfp_food_prices_eth.csv";

function categorize(category: string, commodity: string, unit: string): CommodityCategory {
  const cat = category.toLowerCase();
  const c = commodity.toLowerCase();
  const u = unit.toLowerCase();
  if (c.includes("coffee")) return "coffee";
  if (u.includes("head") || c.includes("livestock") || c.includes("cattle") || c.includes("sheep") ||
      c.includes("goat") || c.includes("camel") || c.includes("bull") || c.includes("ox") || c.includes("donkey")) return "livestock";
  if (c.includes("fuel") || c.includes("diesel") || c.includes("petrol") || c.includes("gas") || c.includes("kerosene")) return "fuel";
  if (cat.includes("cereal") || cat.includes("tuber")) return "cereal";
  if (cat.includes("pulse")) return "pulse";
  if (cat.includes("oil")) return "oilseed";
  if (cat.includes("milk") || cat.includes("dairy")) return "dairy";
  if (cat.includes("meat") || cat.includes("egg") || cat.includes("fish")) return "meat";
  if (cat.includes("vegetable") || cat.includes("fruit")) return "vegetable";
  return "other";
}

function priceType(pricetype: string): PriceType {
  const p = pricetype.toLowerCase();
  if (p.includes("wholesale")) return "wholesale";
  if (p.includes("farm") || p.includes("producer")) return "producer";
  return "retail";
}

export async function fetchWfp(_task: ProviderTaskConfig): Promise<number> {
  const db = getProviderDb("wfp");
  seedProvider(db, WFP_PROVIDER);

  const text = await fetchTextWithRetry(CSV_URL);
  const rows = dropHxlRow(parseCsv(text));

  const commodities = new Map<string, Commodity>();
  const markets = new Map<string, Market>();
  const prices: CommodityPrice[] = [];

  for (const r of rows) {
    const date = r.date?.trim();
    const price = toNumber(r.price);
    const commodityName = r.commodity?.trim();
    if (!date || price == null || !commodityName) continue;

    const commodityId = `wfp_${r.commodity_id || commodityName.toLowerCase().replace(/\s+/g, "_")}`;
    const unit = r.unit?.trim() || "unit";
    if (!commodities.has(commodityId)) {
      commodities.set(commodityId, {
        id: commodityId, code: r.commodity_id || commodityId, name: commodityName,
        category: categorize(r.category || "", commodityName, unit), unit,
      });
    }

    let marketId = "national";
    if (r.market_id?.trim()) {
      marketId = `wfp_${r.market_id.trim()}`;
      if (!markets.has(marketId)) {
        markets.set(marketId, {
          id: marketId, name: r.market?.trim() || marketId,
          admin1: r.admin1?.trim() || undefined, admin2: r.admin2?.trim() || undefined,
          latitude: toNumber(r.latitude) ?? undefined, longitude: toNumber(r.longitude) ?? undefined,
        });
      }
    }

    const pt = priceType(r.pricetype || "");
    prices.push({
      id: `wfp_${commodityId}_${marketId ?? "na"}_${date}_${pt}`,
      provider_id: "wfp", commodity_id: commodityId, market_id: marketId,
      date, price, currency: r.currency?.trim() || "ETB",
      price_usd: toNumber(r.usdprice), price_type: pt, unit,
    });
  }

  db.transaction(() => {
    for (const c of commodities.values()) upsertCommodity(db, c);
    for (const m of markets.values()) upsertMarket(db, m);
  })();
  saveCommodityPrices(db, prices);
  saveCommodityAggregates(db, calculateCommodityAggregates(prices, "year"));

  console.log(`  ${commodities.size} commodities, ${markets.size} markets, ${prices.length} prices`);
  return prices.length;
}
