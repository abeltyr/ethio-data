import type { ProviderTaskConfig } from "../../shared/provider_types";
import type { TradeFlow } from "../../shared/types";
import { fetchWithRetry } from "../../shared/http";
import { getProviderDb } from "../../shared/database";
import { seedProvider } from "../../shared/database/seed";
import { shouldSkipYear, recordFetch } from "../../shared/database/ledger";
import { saveTradeFlows } from "../../shared/database/save";
import { COMTRADE_PROVIDER } from "../registry";
import type { ExecCtx } from "../dispatch";
import { FLOW, QTY_UNITS, isAggregateRow, yearRange, type ComtradeResponse } from "./common";

// Ethiopia = reporter 231. Comtrade preview gives ANNUAL data only for Ethiopia,
// partnerCode 0 = World (aggregate). Descriptions are null in the preview path, so
// we supply our own from this curated HS catalog (the goods that matter for ET).
const HS_CATALOG: Array<{ hs: string; desc: string }> = [
  { hs: "0901", desc: "Coffee" },
  { hs: "1211", desc: "Plants for perfumery/pharmacy (incl. khat/chat)" },
  { hs: "1207", desc: "Oil seeds (incl. sesame)" },
  { hs: "0713", desc: "Dried leguminous vegetables (pulses)" },
  { hs: "0603", desc: "Cut flowers" },
  { hs: "0102", desc: "Live cattle" },
  { hs: "0104", desc: "Live sheep and goats" },
  { hs: "0106", desc: "Other live animals" },
  { hs: "0201", desc: "Meat of bovine, fresh/chilled" },
  { hs: "0202", desc: "Meat of bovine, frozen" },
  { hs: "0204", desc: "Meat of sheep or goats" },
  { hs: "0207", desc: "Meat of poultry" },
  { hs: "4101", desc: "Raw hides and skins of bovine" },
  { hs: "4102", desc: "Raw skins of sheep or lambs" },
  { hs: "4103", desc: "Other raw hides and skins" },
  { hs: "4104", desc: "Tanned hides and skins of bovine" },
  { hs: "4107", desc: "Leather of bovine, prepared after tanning" },
  { hs: "4202", desc: "Leather goods (trunks, bags, cases)" },
  { hs: "6403", desc: "Footwear with leather uppers" },
  { hs: "0904", desc: "Pepper and spices" },
  { hs: "7108", desc: "Gold" },
  { hs: "1001", desc: "Wheat" },
  { hs: "1006", desc: "Rice" },
  { hs: "1511", desc: "Palm oil" },
  { hs: "3004", desc: "Medicaments (packaged)" },
  { hs: "8703", desc: "Motor cars" },
  { hs: "3105", desc: "Mineral or chemical fertilizers" },
  { hs: "2709", desc: "Petroleum oils, crude" },
  { hs: "2710", desc: "Petroleum oils, refined" },
  { hs: "2711", desc: "Petroleum gases (LPG)" },
];

const HS_DESC = new Map(HS_CATALOG.map(c => [c.hs, c.desc]));

export async function fetchComtrade(_task: ProviderTaskConfig, ctx: ExecCtx): Promise<number> {
  const db = getProviderDb("comtrade");
  seedProvider(db, COMTRADE_PROVIDER);

  const currentYear = new Date().getFullYear();
  const years = yearRange(ctx, currentYear - 12);
  const cmdCodes = HS_CATALOG.map(c => c.hs).join(",");
  let total = 0;

  // One request per year: years x commodities x 2 flows stays well under the 500-row preview cap.
  for (const year of years) {
    if (shouldSkipYear(db, "comtrade", _task.id, year, currentYear)) { console.log(`  ${year}: skip (cached)`); continue; }
    const url = `${COMTRADE_PROVIDER.api_url}?reporterCode=231&period=${year}&cmdCode=${cmdCodes}&flowCode=X,M&partnerCode=0`;
    const res = await fetchWithRetry<ComtradeResponse>(url);
    if (res.error || !res.data) continue;

    const flows: TradeFlow[] = [];
    for (const r of res.data) {
      if (!isAggregateRow(r)) continue;
      const value = r.primaryValue ?? r.fobvalue;
      if (value == null) continue;
      const flow = FLOW[r.flowCode];
      if (!flow) continue;
      flows.push({
        id: `comtrade_${r.flowCode}_${r.cmdCode}_${r.partnerCode}_${r.period}`,
        provider_id: "comtrade",
        reporter: "ET",
        partner: r.partnerDesc || "World",
        partner_code: String(r.partnerCode),
        commodity_hs: r.cmdCode,
        commodity_desc: HS_DESC.get(r.cmdCode) || r.cmdCode,
        flow,
        period: r.period,
        period_type: "year",
        value_usd: value,
        qty: r.qty ?? r.netWgt ?? null,
        qty_unit: r.qtyUnitCode != null ? (QTY_UNITS[r.qtyUnitCode] ?? null) : null,
      });
    }
    saveTradeFlows(db, flows);
    total += flows.length;
    recordFetch(db, "comtrade", _task.id, year, flows.length ? "ok" : "empty", flows.length);
    console.log(`  ${year}: ${flows.length} flows`);
  }

  return total;
}
