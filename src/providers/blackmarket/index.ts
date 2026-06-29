import type { ExchangeRate } from "../../shared/types";
import type { ProviderTaskConfig } from "../../shared/provider_types";
import { readFile } from "fs/promises";
import { join } from "path";
import { getProviderDb } from "../../shared/database";
import { seedProvider, upsertCurrency } from "../../shared/database/seed";
import { saveExchangeRates, saveAggregates } from "../../shared/database/save";
import { calculateAggregates } from "../../shared/aggregates";
import { BLACKMARKET_PROVIDER } from "../registry";

interface BlackmarketMonth { month: string; value: Record<string, number> }

const CURRENCY_NAMES: Record<string, string> = {
  USD: "US Dollar", EUR: "Euro", CHF: "Swiss Franc", CAD: "Canadian Dollar",
  AUD: "Australian Dollar", CNY: "Chinese Yuan", GBP: "British Pound", SEK: "Swedish Krona",
  KWD: "Kuwaiti Dinar", AED: "UAE Dirham", SAR: "Saudi Riyal", QAR: "Qatari Riyal",
  OMR: "Omani Rial", JOD: "Jordanian Dinar", BHD: "Bahraini Dinar", TRY: "Turkish Lira",
  EGP: "Egyptian Pound", YER: "Yemeni Rial", ILS: "Israeli Shekel", INR: "Indian Rupee",
  PKR: "Pakistani Rupee"
};

async function loadData(): Promise<BlackmarketMonth[]> {
  const file = join(process.cwd(), "data/blackmarket.json");
  return JSON.parse(await readFile(file, "utf-8"));
}

async function importBlackmarket(): Promise<{ imported: number }> {
  const db = getProviderDb("blackmarket");
  seedProvider(db, BLACKMARKET_PROVIDER);

  const data = await loadData();
  let imported = 0;

  for (const month of data) {
    const monthDate = `${month.month}-15`;
    const rates: ExchangeRate[] = [];

    for (const [code, value] of Object.entries(month.value)) {
      const currencyId = `bm_${code.toLowerCase()}`;
      upsertCurrency(db, { id: currencyId, code, name: CURRENCY_NAMES[code] || code });
      rates.push({
        id: `blackmarket_${currencyId}_${month.month}`,
        provider_id: "blackmarket", currency_id: currencyId,
        currency: { id: currencyId, code, name: CURRENCY_NAMES[code] || code },
        date: monthDate, buying: value, selling: value, weighted_average: value
      });
    }

    saveExchangeRates(db, rates);
    saveAggregates(db, [...calculateAggregates(rates, "week"), ...calculateAggregates(rates, "month"),
    ...calculateAggregates(rates, "year")]);
    imported += rates.length;
  }

  return { imported };
}

export async function executeBlackmarketTask(task: ProviderTaskConfig): Promise<ExchangeRate[] | null> {
  if (task.id !== "import") throw new Error(`Unknown task: ${task.id}`);
  const result = await importBlackmarket();
  console.log(`Imported ${result.imported} rates`);
  return null;
}
