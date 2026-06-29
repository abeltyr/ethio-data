import { getDb, closeDatabase, seedProvider, upsertCurrency, saveExchangeRates, saveAggregates } from "@ethiodata/database";
import { calculateAggregates } from "./shared/aggregates";
import { readFile } from "fs/promises";
import { join } from "path";

interface BlackmarketMonth { month: string; value: Record<string, number> }

const CURRENCY_NAMES: Record<string, string> = {
  USD: "US Dollar", EUR: "Euro", CHF: "Swiss Franc", GBP: "British Pound"
};

async function main(): Promise<void> {
  const db = getDb("currency");
  seedProvider(db, { id: "blackmarket", name: "Black Market", type: "black_market" });

  const file = join(process.cwd(), "data/blackmarket.json");
  const data: BlackmarketMonth[] = JSON.parse(await readFile(file, "utf-8"));

  let imported = 0;
  for (const [idx, month] of data.entries()) {
    process.stdout.write(`[${idx + 1}/${data.length}] ${month.month}... `);

    const rates = Object.entries(month.value).map(([code, value]) => {
      const currencyId = `bm_${code.toLowerCase()}`;
      upsertCurrency(db, { id: currencyId, code, name: CURRENCY_NAMES[code] || code });
      return {
        id: `blackmarket_${currencyId}_${month.month}`,
        provider_id: "blackmarket", currency_id: currencyId,
        currency: { id: currencyId, code, name: CURRENCY_NAMES[code] || code },
        date: `${month.month}-15`, buying: value, selling: value, weighted_average: value
      };
    });

    saveExchangeRates(db, rates);
    saveAggregates(db, calculateAggregates(rates, "month"));
    imported += rates.length;
    console.log(`✓ ${rates.length} rates`);
  }

  console.log(`\nComplete: ${imported} rates imported`);
  closeDatabase();
}

main().catch(console.error);
