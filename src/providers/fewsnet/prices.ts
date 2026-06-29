import type { ProviderTaskConfig } from "../../shared/provider_types";
import type { CommodityPrice, Commodity, Market, CommodityCategory, PriceType } from "../../shared/types";
import { fetchWithRetry } from "../../shared/http";
import { getProviderDb } from "../../shared/database";
import { seedProvider, upsertCommodity, upsertMarket } from "../../shared/database/seed";
import { saveCommodityPrices, saveCommodityAggregates } from "../../shared/database/save";
import { calculateCommodityAggregates } from "../../shared/commodity_aggregates";
import { FEWSNET_PROVIDER } from "../registry";
import type { ExecCtx } from "../dispatch";

const MAX_PAGES = 60;

function categorize(product: string, unit: string): CommodityCategory {
  const p = product.toLowerCase();
  const u = unit.toLowerCase();
  if (p.includes("coffee")) return "coffee";
  if (u.includes("head") || /(cattle|sheep|goat|camel|oxen|bull|ox|donkey|livestock)/.test(p)) return "livestock";
  if (/(fuel|diesel|petrol|kerosene|gas)/.test(p)) return "fuel";
  if (/(maize|wheat|sorghum|teff|barley|rice|millet)/.test(p)) return "cereal";
  if (/(bean|pea|lentil|chickpea|pulse)/.test(p)) return "pulse";
  if (/(sesame|oil seed|niger|groundnut)/.test(p)) return "oilseed";
  if (/(milk|butter|cheese|yogurt|dairy)/.test(p)) return "dairy";
  if (/(meat|beef|egg|chicken|mutton)/.test(p)) return "meat";
  if (p.includes("wage") || p.includes("labour") || p.includes("labor")) return "other";
  return "other";
}

function priceType(t: string): PriceType {
  const p = (t || "").toLowerCase();
  if (p.includes("wholesale")) return "wholesale";
  if (p.includes("export")) return "export";
  if (p.includes("wage")) return "wage";
  if (p.includes("producer") || p.includes("farm")) return "producer";
  return "retail";
}

interface FewsRow {
  admin_1?: string; admin_2?: string; market?: string; fnid?: string;
  cpcv2?: string; cpcv2_description?: string; product?: string;
  period_date?: string; price_type?: string; product_source?: string;
  unit?: string; currency?: string; value?: number | null;
  common_currency_price?: number | null;
}
interface FewsResponse { count: number; next: string | null; results: FewsRow[] }

export async function fetchFewsNet(_task: ProviderTaskConfig, ctx: ExecCtx): Promise<number> {
  const db = getProviderDb("fewsnet");
  seedProvider(db, FEWSNET_PROVIDER);

  const start = ctx.startDate || "2000-01-01";
  let url: string | null =
    `${FEWSNET_PROVIDER.api_url}/marketpricefacts/?format=json&country_code=ET&start_date=${start}&page_size=10000`;

  const commodities = new Map<string, Commodity>();
  const markets = new Map<string, Market>();
  const allPrices: CommodityPrice[] = [];
  let page = 0;

  while (url && page < MAX_PAGES) {
    const res: FewsResponse = await fetchWithRetry<FewsResponse>(url);
    page++;
    const prices: CommodityPrice[] = [];

    for (const r of res.results) {
      const date = r.period_date?.trim();
      const value = r.value;
      const productName = (r.product || r.cpcv2_description || "").trim();
      if (!date || value == null || !productName) continue;

      const code = r.cpcv2 || productName.toLowerCase().replace(/\s+/g, "_");
      const commodityId = `fewsnet_${code}`;
      const unit = r.unit?.trim() || "unit";
      // FEWS distinguishes local vs export-grade animals via product_source; fold it into the name.
      const fullName = r.product_source && r.product_source !== "Local"
        ? `${productName} (${r.product_source})` : productName;
      if (!commodities.has(commodityId)) {
        commodities.set(commodityId, {
          id: commodityId, code, name: fullName, category: categorize(fullName, unit), unit,
        });
      }

      let marketId = "national";
      const marketName = r.market?.trim();
      if (marketName) {
        marketId = `fewsnet_${r.fnid?.trim() || marketName.toLowerCase().replace(/\s+/g, "_")}`;
        if (!markets.has(marketId)) {
          markets.set(marketId, {
            id: marketId, name: marketName,
            admin1: r.admin_1?.trim() || undefined, admin2: r.admin_2?.trim() || undefined,
          });
        }
      }

      const pt = priceType(r.price_type || "");
      prices.push({
        id: `fewsnet_${commodityId}_${marketId ?? "na"}_${date}_${pt}`,
        provider_id: "fewsnet", commodity_id: commodityId, market_id: marketId,
        date, price: value, currency: r.currency?.trim() || "ETB",
        price_usd: r.common_currency_price ?? null, price_type: pt, unit,
      });
    }

    db.transaction(() => {
      for (const c of commodities.values()) upsertCommodity(db, c);
      for (const m of markets.values()) upsertMarket(db, m);
    })();
    saveCommodityPrices(db, prices);
    allPrices.push(...prices);
    console.log(`  page ${page}: ${prices.length} prices (total ${allPrices.length}/${res.count})`);
    url = res.next;
  }

  saveCommodityAggregates(db, [
    ...calculateCommodityAggregates(allPrices, "month"),
    ...calculateCommodityAggregates(allPrices, "year"),
  ]);
  console.log(`  ${commodities.size} commodities, ${markets.size} markets, ${allPrices.length} prices`);
  return allPrices.length;
}
