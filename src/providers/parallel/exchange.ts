import type { ProviderTaskConfig } from "../../shared/provider_types";
import type { ExchangeRate } from "../../shared/types";
import { fetchTextWithRetry } from "../../shared/http";
import { getProviderDb } from "../../shared/database";
import { seedProvider, upsertCurrencyByCode } from "../../shared/database/seed";
import { saveExchangeRates } from "../../shared/database/save";
import { PARALLEL_FX_PROVIDER } from "../registry";

const BROWSER_UA = "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120 Safari/537.36";
const CURRENCIES: Record<string, string> = {
  usd: "US Dollar", eur: "Euro", gbp: "British Pound", aed: "UAE Dirham",
  sar: "Saudi Riyal", cny: "Chinese Yuan", cad: "Canadian Dollar", chf: "Swiss Franc",
};

// The site is client-rendered, but each currency page embeds a schema.org Offer with
// the current parallel rate: {"price":177.133,"priceCurrency":"ETB","priceValidUntil":"..."}.
export async function fetchParallel(_task: ProviderTaskConfig): Promise<number> {
  const db = getProviderDb("parallel");
  seedProvider(db, PARALLEL_FX_PROVIDER);
  const today = new Date().toISOString().slice(0, 10);

  const rates: ExchangeRate[] = [];
  for (const [code, name] of Object.entries(CURRENCIES)) {
    let html: string;
    try { html = await fetchTextWithRetry(`${PARALLEL_FX_PROVIDER.api_url}/${code}`, 0, { headers: { "User-Agent": BROWSER_UA } }); }
    catch { continue; }

    const priceM = html.match(/"price":\s*([\d.]+)\s*,\s*"priceCurrency":\s*"ETB"/);
    if (!priceM) continue;
    const rate = parseFloat(priceM[1]!);
    if (!Number.isFinite(rate) || rate <= 0) continue;
    const dateM = html.match(/"priceValidUntil":\s*"(\d{4}-\d{2}-\d{2})/);
    const date = dateM ? dateM[1]! : today;

    const upper = code.toUpperCase();
    const currencyId = upsertCurrencyByCode(db, { code: upper, name });
    rates.push({
      id: `parallel_${currencyId}_${date}`,
      provider_id: "parallel", currency_id: currencyId,
      currency: { id: currencyId, code: upper, name },
      date, buying: rate, selling: rate, weighted_average: rate,
    });
  }

  saveExchangeRates(db, rates);
  console.log(`  ${rates.length} parallel rates @ ${today}`);
  return rates.length;
}
