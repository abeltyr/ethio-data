import type { ProviderTaskConfig } from "../../shared/provider_types";
import type { CommodityPrice, Commodity, CommodityCategory } from "../../shared/types";
import { fetchTextWithRetry } from "../../shared/http";
import { getProviderDb } from "../../shared/database";
import { seedProvider, upsertCommodity, upsertMarket } from "../../shared/database/seed";
import { saveCommodityPrices, saveCommodityAggregates } from "../../shared/database/save";
import { calculateCommodityAggregates } from "../../shared/commodity_aggregates";
import { loadHtml, cellText, parseHtmlNumber } from "../../shared/parse";
import { TWOMERKATO_PROVIDER } from "../registry";

const BASE = "https://www.2merkato.com";
const LIST = "/news/capital-market-and-commodity-exchange";
const MAX_ARTICLES = 40; // bounded per run; daily schedule keeps it current

const MONTHS: Record<string, string> = {
  january: "01", february: "02", march: "03", april: "04", may: "05", june: "06",
  july: "07", august: "08", september: "09", october: "10", november: "11", december: "12",
};

function dateFromSlug(href: string): string | null {
  const m = href.toLowerCase().match(/(\d{1,2})-([a-z]+)-(\d{4})\/?$/);
  if (!m) return null;
  const [, d, mon, y] = m;
  const mm = MONTHS[mon!];
  return mm ? `${y}-${mm}-${String(d).padStart(2, "0")}` : null;
}

function categorize(section: string): CommodityCategory {
  const s = section.toLowerCase();
  if (s.includes("coffee")) return "coffee";
  if (s.includes("sesame") || s.includes("niger") || s.includes("oil")) return "oilseed";
  if (/(bean|pea|chickpea|lentil|pulse)/.test(s)) return "pulse";
  if (/(maize|wheat|sorghum|teff|barley)/.test(s)) return "cereal";
  return "other";
}

export async function fetchTwoMerkato(_task: ProviderTaskConfig): Promise<number> {
  const db = getProviderDb("twomerkato");
  seedProvider(db, TWOMERKATO_PROVIDER);
  upsertMarket(db, { id: "ecx", name: "Ethiopia Commodity Exchange", country: "ET" });

  const listHtml = await fetchTextWithRetry(`${BASE}${LIST}`);
  const $list = loadHtml(listHtml);

  // Collect unique ECX-daily-trade-data article links with a parseable date.
  const articles = new Map<string, string>(); // date -> href
  $list("a[href*='ecx-daily-trade-data']").each((_i, a) => {
    let href = $list(a).attr("href") || "";
    if (!href.startsWith("http")) href = `${BASE}${href}`;
    const date = dateFromSlug(href);
    if (date && !articles.has(date)) articles.set(date, href);
  });

  const commodities = new Map<string, Commodity>();
  const prices: CommodityPrice[] = [];
  let processed = 0;

  for (const [date, href] of articles) {
    if (processed >= MAX_ARTICLES) break;
    processed++;
    let html: string;
    try { html = await fetchTextWithRetry(href); } catch { continue; }
    const $ = loadHtml(html);

    $("table").each((_t, table) => {
      let section = "";
      $(table).find("tr").each((_r, tr) => {
        const cells = $(tr).find("td").map((_c, td) => cellText($(td).text())).get();
        if (cells.length < 3) return;
        const [name, symbol, priceText] = cells;
        // Header row carries the section label in cell 0 and "Average Price" in cell 2.
        if (/average price/i.test(priceText || "")) { section = name || section; return; }
        const price = parseHtmlNumber(priceText || "");
        if (price == null || !name) return;

        const code = (symbol && symbol.length <= 12 ? symbol : name).replace(/[^A-Za-z0-9]+/g, "_").toLowerCase();
        const commodityId = `twomerkato_${code}`;
        const fullName = section ? `${section} - ${name}` : name;
        if (!commodities.has(commodityId)) {
          commodities.set(commodityId, { id: commodityId, code, name: fullName, category: categorize(section || name), unit: "unit" });
        }
        prices.push({
          id: `twomerkato_${commodityId}_ecx_${date}_wholesale`,
          provider_id: "twomerkato", commodity_id: commodityId, market_id: "ecx",
          date, price, currency: "ETB", price_usd: null, price_type: "wholesale", unit: "unit",
        });
      });
    });
  }

  db.transaction(() => { for (const c of commodities.values()) upsertCommodity(db, c); })();
  saveCommodityPrices(db, prices);
  saveCommodityAggregates(db, [
    ...calculateCommodityAggregates(prices, "month"),
    ...calculateCommodityAggregates(prices, "year"),
  ]);

  console.log(`  ${processed} articles, ${commodities.size} commodities, ${prices.length} prices`);
  return prices.length;
}
