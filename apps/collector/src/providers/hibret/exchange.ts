import type { ProviderTaskConfig } from "@ethiodata/types";
import type { ExchangeRate } from "@ethiodata/types";
import { fetchTextWithRetry } from "../../shared/http";
import { getDb } from "@ethiodata/database";
import { seedProvider, upsertCurrencyByCode } from "@ethiodata/database";
import { saveExchangeRates, saveAggregates } from "@ethiodata/database";
import { calculateAggregates } from "../../shared/aggregates";
import { loadHtml, cellText, parseHtmlNumber } from "../../shared/parse";
import { ALLOW_INSECURE_TLS } from "../../shared/config";
import { HIBRET_PROVIDER } from "../registry";

// Hibret renders a static table: [flag(alt=CODE), name, cashBuying, cashSelling,
// transactionBuying, transactionSelling]. The page is "today only", so we store
// under today's date and rely on the daily schedule to accumulate history.
export async function fetchHibret(task: ProviderTaskConfig): Promise<number> {
  const db = getDb("currency");
  seedProvider(db, HIBRET_PROVIDER);

  // Default: verify TLS. Hibret ships an incomplete cert chain, so the secure fetch
  // may fail — in that case we only retry with lenient TLS if the operator explicitly
  // opted in (ALLOW_INSECURE_TLS=1). This is public, read-only data; the residual risk
  // is a MITM feeding wrong rate numbers, which the plausibility guard below limits.
  const pageUrl = `${HIBRET_PROVIDER.api_url}${task.endpoint}`;
  let html: string;
  try {
    html = await fetchTextWithRetry(pageUrl);
  } catch (err) {
    if (!ALLOW_INSECURE_TLS) {
      throw new Error(`Hibret fetch failed (TLS chain likely incomplete). Set ALLOW_INSECURE_TLS=1 to allow its public rates page. Cause: ${err instanceof Error ? err.message : err}`);
    }
    html = await fetchTextWithRetry(pageUrl, 0, { tls: { rejectUnauthorized: false } } as RequestInit);
  }
  const $ = loadHtml(html);
  const date = new Date().toISOString().slice(0, 10);

  const rates: ExchangeRate[] = [];
  $("table tr").each((_i, row) => {
    const alt = $(row).find("img[alt]").attr("alt")?.trim().toUpperCase() || "";
    const nameText = cellText($(row).find("td").eq(1).text());
    const code = /^[A-Z]{3}$/.test(alt) ? alt : (nameText.match(/^([A-Z]{3})/)?.[1] ?? "");
    if (!/^[A-Z]{3}$/.test(code)) return;

    const nums: number[] = [];
    $(row).find("td").each((_j, td) => {
      const n = parseHtmlNumber(cellText($(td).text()));
      if (n != null) nums.push(n);
    });
    if (nums.length < 4) return;

    const [cashBuy, cashSell, txnBuy, txnSell] = nums;
    const buying = Math.max(cashBuy!, txnBuy!);
    const selling = Math.max(cashSell!, txnSell!);
    // Plausibility bound for an ETB-per-unit forex rate; rejects garbage/MITM values.
    const plausible = (v: number) => v > 0 && v < 100000;
    if (!plausible(buying) || !plausible(selling)) return;

    const name = nameText.replace(/^[A-Z]{3}\s*\(?/, "").replace(/\)$/, "").trim() || code;
    const currencyId = upsertCurrencyByCode(db, { code, name });
    rates.push({
      id: `hibret_${currencyId}_${date}`,
      provider_id: "hibret", currency_id: currencyId,
      currency: { id: currencyId, code, name },
      date, buying, selling,
      buying_rate: txnBuy, selling_rate: txnSell,
      cash_buying: cashBuy, cash_selling: cashSell,
      transaction_buying: txnBuy, transaction_selling: txnSell,
    });
  });

  saveExchangeRates(db, rates);
  saveAggregates(db, [
    ...calculateAggregates(rates, "week"),
    ...calculateAggregates(rates, "month"),
    ...calculateAggregates(rates, "year"),
  ]);
  console.log(`  ${rates.length} rates for ${date}`);
  return rates.length;
}
