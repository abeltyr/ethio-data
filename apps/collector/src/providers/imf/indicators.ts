import type { ProviderTaskConfig } from "@ethiodata/types";
import type { EconomicIndicator } from "@ethiodata/types";
import { fetchWithRetry } from "../../shared/http";
import { getDb } from "@ethiodata/database";
import { seedProvider } from "@ethiodata/database";
import { saveIndicators } from "@ethiodata/database";
import { IMF_PROVIDER } from "../registry";
import type { ExecCtx } from "../dispatch";

// IMF WEO indicators (annual, include forward forecasts). Names are descriptive
// since DataMapper keys are terse codes.
const INDICATORS: Array<{ code: string; name: string; unit?: string }> = [
  { code: "PCPIPCH", name: "Inflation, average consumer prices", unit: "%" },
  { code: "NGDP_RPCH", name: "Real GDP growth", unit: "%" },
  { code: "NGDPD", name: "GDP, current prices", unit: "USD bn" },
  { code: "NGDPDPC", name: "GDP per capita, current prices", unit: "USD" },
  { code: "LUR", name: "Unemployment rate", unit: "%" },
  { code: "GGXWDG_NGDP", name: "General government gross debt", unit: "% of GDP" },
  { code: "BCA_NGDPD", name: "Current account balance", unit: "% of GDP" },
  { code: "LP", name: "Population", unit: "millions" },
];

export async function fetchImf(_task: ProviderTaskConfig, _ctx: ExecCtx): Promise<number> {
  const db = getDb("macro");
  seedProvider(db, IMF_PROVIDER);

  let total = 0;
  for (const { code, name, unit } of INDICATORS) {
    let payload: any;
    try {
      payload = await fetchWithRetry<any>(`${IMF_PROVIDER.api_url}/${code}/ETH`);
    } catch {
      console.log(`  ${code}: failed (DataMapper may be CDN-blocked)`);
      continue;
    }

    // Shape: { values: { <code>: { ETH: { "<year>": value, ... } } } }
    const series: Record<string, number> | undefined = payload?.values?.[code]?.ETH;
    if (!series || typeof series !== "object") { console.log(`  ${code}: no data`); continue; }

    const indicators: EconomicIndicator[] = [];
    for (const [year, value] of Object.entries(series)) {
      if (value == null || typeof value !== "number") continue;
      indicators.push({
        id: `imf_${code}_ET_${year}`,
        provider_id: "imf", indicator_code: code, indicator_name: name,
        area: "ET", period: year, period_type: "year", value, unit: unit ?? null,
      });
    }
    saveIndicators(db, indicators);
    total += indicators.length;
    console.log(`  ${code}: ${indicators.length} points`);
  }

  return total;
}
