import type { ProviderTaskConfig } from "../../shared/provider_types";
import type { PropertyPrice } from "../../shared/types";
import { fetchWithRetry } from "../../shared/http";
import { getProviderDb } from "../../shared/database";
import { seedProvider } from "../../shared/database/seed";
import { savePropertyPrices } from "../../shared/database/save";
import { REALETHIO_PROVIDER } from "../registry";

const MAX_PAGES = 40;
const BROWSER_UA = "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120 Safari/537.36";

interface WpProperty {
  id: number;
  date?: string;
  title?: { rendered?: string };
  property_meta?: Record<string, string[]>;
}

const meta1 = (m: Record<string, string[]> | undefined, k: string): string | undefined => m?.[k]?.[0];
const num = (s?: string): number | null => { if (!s) return null; const n = parseFloat(String(s).replace(/,/g, "")); return Number.isFinite(n) ? n : null; };

export async function fetchRealethio(_task: ProviderTaskConfig): Promise<number> {
  const db = getProviderDb("realethio");
  seedProvider(db, REALETHIO_PROVIDER);
  const collected = new Date().toISOString().slice(0, 10);

  const prices: PropertyPrice[] = [];
  for (let page = 1; page <= MAX_PAGES; page++) {
    let batch: WpProperty[];
    try {
      batch = await fetchWithRetry<WpProperty[]>(
        `${REALETHIO_PROVIDER.api_url}/wp-json/wp/v2/properties?per_page=100&page=${page}`,
        0, { headers: { "User-Agent": BROWSER_UA } });
    } catch { break; } // out-of-range page returns HTTP 400 -> stop
    if (!Array.isArray(batch) || batch.length === 0) break;

    for (const p of batch) {
      const m = p.property_meta;
      const price = num(meta1(m, "fave_property_price"));
      if (!price) continue;
      const postfix = (meta1(m, "fave_property_price_postfix") || "").toLowerCase();
      const listing_type: "sale" | "rent" = /mo|month|week|day|night|year|rent/.test(postfix) ? "rent" : "sale";
      const size = num(meta1(m, "fave_property_size"));
      const address = meta1(m, "fave_property_address") || meta1(m, "fave_property_map_address") || null;

      prices.push({
        id: `realethio_${p.id}_${collected}`,
        provider_id: "realethio", source: "realethio.com", listing_type,
        property_type: null,
        region: address && /addis ababa/i.test(address) ? "Addis Ababa" : null,
        area: address,
        bedrooms: num(meta1(m, "fave_property_bedrooms")),
        bathrooms: num(meta1(m, "fave_property_bathrooms")),
        size_sqm: size,
        price, currency: "ETB",
        price_sqm: size && size > 0 ? Math.round(price / size) : null,
        latitude: num(meta1(m, "fave_property_latitude")),
        longitude: num(meta1(m, "fave_property_longitude")),
        listed_date: p.date ? p.date.slice(0, 10) : null,
        collected_at: collected,
      });
    }
    if (batch.length < 100) break;
  }

  savePropertyPrices(db, prices);
  const sale = prices.filter(p => p.listing_type === "sale").length;
  console.log(`  ${prices.length} listings (${sale} sale, ${prices.length - sale} rent) @ ${collected}`);
  return prices.length;
}
