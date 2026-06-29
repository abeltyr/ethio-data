import type { ProviderTaskConfig } from "@ethiodata/types";
import type { EconomicIndicator } from "@ethiodata/types";
import { fetchWithRetry } from "../../shared/http";
import { getDb } from "@ethiodata/database";
import { seedProvider } from "@ethiodata/database";
import { saveIndicators } from "@ethiodata/database";
import { WORLDBANK_PROVIDER } from "../registry";
import type { ExecCtx } from "../dispatch";

// Curated macro catalog for Ethiopia. Extend freely — each code is one annual series.
const INDICATORS: Array<{ code: string; unit?: string }> = [
  { code: "NY.GDP.MKTP.CD", unit: "USD" },          // GDP (current US$)
  { code: "NY.GDP.MKTP.KD.ZG", unit: "%" },         // GDP growth (annual %)
  { code: "NY.GDP.PCAP.CD", unit: "USD" },          // GDP per capita
  { code: "NY.GNP.PCAP.CD", unit: "USD" },          // GNI per capita
  { code: "FP.CPI.TOTL", unit: "index" },           // CPI (2010=100)
  { code: "FP.CPI.TOTL.ZG", unit: "%" },            // Inflation, consumer prices
  { code: "NV.AGR.TOTL.ZS", unit: "% of GDP" },     // Agriculture value added
  { code: "AG.PRD.FOOD.XD", unit: "index" },        // Food production index
  { code: "AG.PRD.CROP.XD", unit: "index" },        // Crop production index
  { code: "AG.PRD.LVSK.XD", unit: "index" },        // Livestock production index
  { code: "NE.EXP.GNFS.CD", unit: "USD" },          // Exports of goods & services
  { code: "NE.IMP.GNFS.CD", unit: "USD" },          // Imports of goods & services
  { code: "PA.NUS.FCRF", unit: "ETB/USD" },         // Official exchange rate
  { code: "FM.LBL.BMNY.GD.ZS", unit: "% of GDP" },  // Broad money
  { code: "FR.INR.LEND", unit: "%" },               // Lending interest rate
  { code: "SP.POP.TOTL", unit: "people" },          // Population
  { code: "SL.UEM.TOTL.ZS", unit: "%" },            // Unemployment
  { code: "BX.KLT.DINV.CD.WD", unit: "USD" },       // Foreign direct investment
  { code: "BN.CAB.XOKA.CD", unit: "USD" },          // Current account balance
  { code: "DT.DOD.DECT.CD", unit: "USD" },          // External debt stocks
  { code: "SI.POV.GINI", unit: "index" },           // Gini index
  { code: "EG.ELC.ACCS.ZS", unit: "%" },            // Access to electricity
];

interface WbRow {
  indicator: { id: string; value: string };
  date: string;
  value: number | null;
}

export async function fetchWorldBank(_task: ProviderTaskConfig, _ctx: ExecCtx): Promise<number> {
  const db = getDb("macro");
  seedProvider(db, WORLDBANK_PROVIDER);

  let total = 0;
  for (const { code, unit } of INDICATORS) {
    const url = `${WORLDBANK_PROVIDER.api_url}/country/ETH/indicator/${code}?format=json&per_page=20000`;
    let payload: unknown;
    try {
      payload = await fetchWithRetry<unknown>(url);
    } catch {
      console.log(`  ${code}: failed`);
      continue;
    }

    // World Bank returns [meta, rows]; rows is null when there is no data.
    if (!Array.isArray(payload) || payload.length < 2) continue;
    const rows = payload[1] as WbRow[] | null;
    if (!rows) continue;

    const indicators: EconomicIndicator[] = [];
    for (const r of rows) {
      if (r.value == null) continue;
      indicators.push({
        id: `worldbank_${code}_ET_${r.date}`,
        provider_id: "worldbank",
        indicator_code: code,
        indicator_name: r.indicator.value,
        area: "ET",
        period: r.date,
        period_type: "year",
        value: r.value,
        unit: unit ?? null,
      });
    }
    saveIndicators(db, indicators);
    total += indicators.length;
    console.log(`  ${code}: ${indicators.length} points`);
  }

  return total;
}
