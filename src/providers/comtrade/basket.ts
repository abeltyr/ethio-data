import type { ProviderTaskConfig } from "../../shared/provider_types";
import type { TradeFlow } from "../../shared/types";
import { fetchWithRetry } from "../../shared/http";
import { getProviderDb } from "../../shared/database";
import { seedProvider } from "../../shared/database/seed";
import { shouldSkipYear, recordFetch } from "../../shared/database/ledger";
import { saveTradeFlows } from "../../shared/database/save";
import { COMTRADE_PROVIDER } from "../registry";
import type { ExecCtx } from "../dispatch";
import { FLOW, isAggregateRow, yearRange, type ComtradeResponse } from "./common";

// HS 2-digit chapter titles (abbreviated) for the full import/export basket.
const HS_CHAPTERS: Record<string, string> = {
  "01": "Live animals", "02": "Meat", "03": "Fish", "04": "Dairy, eggs, honey", "05": "Animal products n.e.s.",
  "06": "Live plants & cut flowers", "07": "Vegetables & pulses", "08": "Fruit & nuts", "09": "Coffee, tea, spices",
  "10": "Cereals", "11": "Milling products", "12": "Oil seeds & oleaginous fruit", "13": "Gums & resins",
  "14": "Vegetable plaiting materials", "15": "Animal/vegetable fats & oils", "16": "Meat/fish preparations",
  "17": "Sugars", "18": "Cocoa", "19": "Cereal/flour preparations", "20": "Vegetable/fruit preparations",
  "21": "Misc. edible preparations", "22": "Beverages & spirits", "23": "Food residues & animal feed",
  "24": "Tobacco", "25": "Salt, sulphur, cement", "26": "Ores, slag, ash", "27": "Mineral fuels & oils",
  "28": "Inorganic chemicals", "29": "Organic chemicals", "30": "Pharmaceuticals", "31": "Fertilizers",
  "32": "Tanning/dyeing extracts", "33": "Essential oils, cosmetics", "34": "Soap, waxes", "35": "Albuminoids, glues",
  "36": "Explosives", "37": "Photographic goods", "38": "Misc. chemical products", "39": "Plastics",
  "40": "Rubber", "41": "Raw hides, skins & leather", "42": "Leather articles", "43": "Furskins",
  "44": "Wood", "45": "Cork", "46": "Straw/basketware", "47": "Wood pulp", "48": "Paper & paperboard",
  "49": "Printed books", "50": "Silk", "51": "Wool", "52": "Cotton", "53": "Other vegetable fibres",
  "54": "Man-made filaments", "55": "Man-made staple fibres", "56": "Wadding, felt", "57": "Carpets",
  "58": "Special woven fabrics", "59": "Coated textiles", "60": "Knitted fabrics", "61": "Apparel, knitted",
  "62": "Apparel, not knitted", "63": "Other textile articles", "64": "Footwear", "65": "Headgear",
  "66": "Umbrellas", "67": "Feathers, artificial flowers", "68": "Stone/cement articles", "69": "Ceramics",
  "70": "Glass", "71": "Pearls, precious stones & metals (gold)", "72": "Iron & steel", "73": "Iron/steel articles",
  "74": "Copper", "75": "Nickel", "76": "Aluminium", "78": "Lead", "79": "Zinc", "80": "Tin",
  "81": "Other base metals", "82": "Tools & cutlery", "83": "Misc. base metal articles", "84": "Machinery & boilers",
  "85": "Electrical machinery & electronics", "86": "Railway", "87": "Vehicles", "88": "Aircraft", "89": "Ships",
  "90": "Optical/medical instruments", "91": "Clocks & watches", "92": "Musical instruments", "93": "Arms",
  "94": "Furniture, bedding, lamps", "95": "Toys & sports", "96": "Misc. manufactured articles", "97": "Works of art",
  "99": "Commodities n.e.s.",
};

function rowsToFlows(res: ComtradeResponse, descFor: (cmd: string) => string): TradeFlow[] {
  const flows: TradeFlow[] = [];
  for (const r of res.data || []) {
    if (!isAggregateRow(r)) continue;
    const value = r.primaryValue ?? r.fobvalue;
    if (value == null) continue;
    const flow = FLOW[r.flowCode];
    if (!flow) continue;
    flows.push({
      id: `comtrade_${r.flowCode}_${r.cmdCode}_${r.partnerCode}_${r.period}`,
      provider_id: "comtrade", reporter: "ET", partner: "World", partner_code: String(r.partnerCode),
      commodity_hs: r.cmdCode, commodity_desc: descFor(r.cmdCode), flow,
      period: r.period, period_type: "year", value_usd: value, qty: null, qty_unit: null,
    });
  }
  return flows;
}

// Full import/export basket: grand TOTAL (for trade balance) + every HS 2-digit chapter.
export async function fetchComtradeBasket(_task: ProviderTaskConfig, ctx: ExecCtx): Promise<number> {
  const db = getProviderDb("comtrade");
  seedProvider(db, COMTRADE_PROVIDER);

  const currentYear = new Date().getFullYear();
  const years = yearRange(ctx, currentYear - 16); // ~16y default for the deep dive
  let total = 0;

  for (const year of years) {
    if (shouldSkipYear(db, "comtrade", _task.id, year, currentYear)) { console.log(`  ${year}: skip (cached)`); continue; }
    const base = `${COMTRADE_PROVIDER.api_url}?reporterCode=231&period=${year}&flowCode=X,M&partnerCode=0`;
    try {
      const totals = await fetchWithRetry<ComtradeResponse>(`${base}&cmdCode=TOTAL`);
      const chapters = await fetchWithRetry<ComtradeResponse>(`${base}&cmdCode=AG2`);
      const flows = [
        ...rowsToFlows(totals, () => "All commodities (total trade)"),
        ...rowsToFlows(chapters, c => HS_CHAPTERS[c] || `HS chapter ${c}`),
      ];
      saveTradeFlows(db, flows);
      total += flows.length;
      recordFetch(db, "comtrade", _task.id, year, flows.length ? "ok" : "empty", flows.length);
      console.log(`  ${year}: ${flows.length} basket flows`);
    } catch (e) {
      console.log(`  ${year}: failed (${e instanceof Error ? e.message : e})`);
    }
  }

  return total;
}
