import { existsSync, readFileSync } from "fs";
import { join } from "path";
import type { ProviderTaskConfig } from "../../shared/provider_types";
import type { PropertyPrice } from "../../shared/types";
import { fetchTextWithRetry } from "../../shared/http";
import { getProviderDb } from "../../shared/database";
import { seedProvider } from "../../shared/database/seed";
import { savePropertyPrices } from "../../shared/database/save";
import { parseCsv, toNumber, type CsvRow } from "../../shared/parse";
import { REALESTATE_HIST_PROVIDER } from "../registry";

// Georeferenced Addis Ababa real-estate dataset (2017–2024), Zenodo record 11205969,
// CC-BY-4.0. The 77 MB CSV is anti-bot protected, so prefer a locally-downloaded copy
// at data/addis_realestate.csv; fall back to a live download where the network allows.
const LOCAL = join(process.cwd(), "data", "addis_realestate.csv");
const URL = "https://zenodo.org/records/11205969/files/real-estate_dataset_addis-ababa_zenodo_v1.csv?download=1";

const pick = (r: CsvRow, keys: string[]): string | undefined => {
  for (const k of keys) for (const rk of Object.keys(r)) if (rk.toLowerCase() === k) return r[rk];
  return undefined;
};

export async function fetchZenodoRealEstate(_task: ProviderTaskConfig): Promise<number> {
  const db = getProviderDb("realestate_hist");
  seedProvider(db, REALESTATE_HIST_PROVIDER);

  let text: string;
  if (existsSync(LOCAL)) {
    text = readFileSync(LOCAL, "utf-8");
    console.log(`  loaded local ${LOCAL}`);
  } else {
    try {
      text = await fetchTextWithRetry(URL);
    } catch {
      console.log(`  Zenodo download blocked. Download the CSV from https://zenodo.org/records/11205969`);
      console.log(`  and save it to data/addis_realestate.csv, then re-run.`);
      return 0;
    }
  }

  const rows = parseCsv(text);
  const prices: PropertyPrice[] = [];
  rows.forEach((r, i) => {
    const price = toNumber(pick(r, ["price"]));
    if (price == null || price <= 0) return;
    const lt = (pick(r, ["listing_type", "type", "offer_type"]) || "").toLowerCase();
    const listing_type: "sale" | "rent" = /rent|lease/.test(lt) ? "rent" : "sale";
    const date = pick(r, ["date_published", "date", "published"]) || pick(r, ["year"]) || null;

    prices.push({
      id: `zenodo_${i}`,
      provider_id: "realestate_hist", source: "zenodo.11205969", listing_type,
      property_type: pick(r, ["property_type", "category"]) || null,
      region: "Addis Ababa", area: pick(r, ["address", "location", "neighborhood", "subcity"]) || null,
      bedrooms: toNumber(pick(r, ["num_bedrooms", "bedrooms", "beds"])),
      bathrooms: toNumber(pick(r, ["num_bathrooms", "bathrooms", "baths"])),
      size_sqm: toNumber(pick(r, ["size_sqm", "size", "area_sqm"])),
      price, currency: "ETB",
      price_sqm: toNumber(pick(r, ["price_sqm", "price_per_sqm"])),
      latitude: toNumber(pick(r, ["lat", "latitude"])),
      longitude: toNumber(pick(r, ["lng", "lon", "longitude"])),
      listed_date: date ? String(date).slice(0, 10) : null,
      collected_at: date ? String(date).slice(0, 10) : "2017-2024",
    });
  });

  savePropertyPrices(db, prices);
  console.log(`  ${prices.length} historical listings (2017–2024)`);
  return prices.length;
}
