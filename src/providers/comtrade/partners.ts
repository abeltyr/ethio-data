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

// UN M49 partner codes -> country name (preview omits partnerDesc). Covers Ethiopia's
// realistic trade partners + major economies; unknown codes fall back to "Partner <code>".
const M49: Record<string, string> = {
  "4": "Afghanistan", "12": "Algeria", "24": "Angola", "32": "Argentina", "36": "Australia",
  "40": "Austria", "48": "Bahrain", "50": "Bangladesh", "56": "Belgium", "76": "Brazil",
  "100": "Bulgaria", "104": "Myanmar", "112": "Belarus", "120": "Cameroon", "124": "Canada",
  "144": "Sri Lanka", "152": "Chile", "156": "China", "170": "Colombia", "178": "Congo",
  "180": "DR Congo", "191": "Croatia", "196": "Cyprus", "203": "Czechia", "208": "Denmark",
  "214": "Dominican Rep.", "218": "Ecuador", "818": "Egypt", "222": "El Salvador", "232": "Eritrea",
  "233": "Estonia", "231": "Ethiopia", "246": "Finland", "251": "France", "266": "Gabon",
  "268": "Georgia", "276": "Germany", "288": "Ghana", "300": "Greece", "320": "Guatemala",
  "344": "Hong Kong", "348": "Hungary", "356": "India", "360": "Indonesia", "364": "Iran",
  "368": "Iraq", "372": "Ireland", "376": "Israel", "380": "Italy", "388": "Jamaica",
  "392": "Japan", "400": "Jordan", "398": "Kazakhstan", "404": "Kenya", "410": "South Korea",
  "414": "Kuwait", "417": "Kyrgyzstan", "428": "Latvia", "422": "Lebanon", "434": "Libya",
  "440": "Lithuania", "442": "Luxembourg", "450": "Madagascar", "454": "Malawi", "458": "Malaysia",
  "466": "Mali", "470": "Malta", "478": "Mauritania", "480": "Mauritius", "484": "Mexico",
  "498": "Moldova", "504": "Morocco", "508": "Mozambique", "516": "Namibia", "524": "Nepal",
  "528": "Netherlands", "554": "New Zealand", "566": "Nigeria", "578": "Norway", "512": "Oman",
  "586": "Pakistan", "591": "Panama", "604": "Peru", "608": "Philippines", "616": "Poland",
  "620": "Portugal", "634": "Qatar", "642": "Romania", "643": "Russia", "646": "Rwanda",
  "682": "Saudi Arabia", "686": "Senegal", "688": "Serbia", "702": "Singapore", "703": "Slovakia",
  "705": "Slovenia", "706": "Somalia", "710": "South Africa", "728": "South Sudan", "724": "Spain",
  "729": "Sudan", "752": "Sweden", "757": "Switzerland", "760": "Syria", "158": "Taiwan",
  "834": "Tanzania", "764": "Thailand", "768": "Togo", "788": "Tunisia", "792": "Turkey",
  "795": "Turkmenistan", "800": "Uganda", "804": "Ukraine", "784": "UAE", "826": "United Kingdom",
  "840": "USA", "858": "Uruguay", "860": "Uzbekistan", "862": "Venezuela",
  "704": "Vietnam", "887": "Yemen", "894": "Zambia", "716": "Zimbabwe", "0": "World",
  "490": "Other Asia, nes", "899": "Areas, nes",
  // Comtrade-specific area codes that differ from plain M49:
  "842": "USA", "699": "India", "837": "Bunkers", "838": "Free Zones", "839": "Special Categories",
};

export async function fetchComtradePartners(_task: ProviderTaskConfig, ctx: ExecCtx): Promise<number> {
  const db = getProviderDb("comtrade");
  seedProvider(db, COMTRADE_PROVIDER);

  const currentYear = new Date().getFullYear();
  const years = yearRange(ctx, currentYear - 12);
  let total = 0;

  for (const year of years) {
    if (shouldSkipYear(db, "comtrade", _task.id, year, currentYear)) { console.log(`  ${year}: skip (cached)`); continue; }
    // partnerCode omitted -> all partners; cmdCode=TOTAL -> who ET trades with overall.
    const url = `${COMTRADE_PROVIDER.api_url}?reporterCode=231&period=${year}&cmdCode=TOTAL&flowCode=X,M`;
    let res: ComtradeResponse;
    try { res = await fetchWithRetry<ComtradeResponse>(url); } catch { console.log(`  ${year}: failed`); continue; }
    if (res.error || !res.data) continue;

    const flows: TradeFlow[] = [];
    for (const r of res.data) {
      if (!isAggregateRow(r)) continue;
      if (r.partnerCode === 0) continue; // skip World aggregate (kept by the basket task)
      const value = r.primaryValue ?? r.fobvalue;
      if (value == null) continue;
      const flow = FLOW[r.flowCode];
      if (!flow) continue;
      const pc = String(r.partnerCode);
      flows.push({
        id: `comtrade_partner_${r.flowCode}_${pc}_${r.period}`,
        provider_id: "comtrade", reporter: "ET", partner: M49[pc] || `Partner ${pc}`, partner_code: pc,
        commodity_hs: "TOTAL", commodity_desc: "All commodities (bilateral total)", flow,
        period: r.period, period_type: "year", value_usd: value, qty: null, qty_unit: null,
      });
    }
    saveTradeFlows(db, flows);
    total += flows.length;
    recordFetch(db, "comtrade", _task.id, year, flows.length ? "ok" : "empty", flows.length);
    console.log(`  ${year}: ${flows.length} partner flows`);
  }

  return total;
}
