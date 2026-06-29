import "server-only";
import { num, pct, usdB } from "@/lib/utils";
import type { Finding } from "@/types/warehouse";
import { officialUsdSeries, premiumSeries } from "./currency";
import { row } from "./db";
import { indicatorSeries, inflation } from "./macro";
import { monthlyTrend } from "./prices";
import { balanceSeries, latestYear, topImports } from "./trade";

export function currencyFindings(): Finding[] {
  const prem = premiumSeries();
  const off = officialUsdSeries();
  const latest = prem.at(-1);
  const peak = prem.length
    ? prem.reduce((a, b) => (b.premium > a.premium ? b : a))
    : undefined;
  const avg = prem.length
    ? prem.reduce((s, p) => s + p.premium, 0) / prem.length
    : 0;
  const over50 = prem.filter((p) => p.premium > 50).length;
  const startUsd = off[0]?.y;
  const nowUsd = off.at(-1)?.y;
  const deprec = startUsd && nowUsd ? (nowUsd / startUsd - 1) * 100 : null;
  return [
    {
      stat: latest ? pct(latest.premium) : "—",
      label: `Street premium · ${latest?.period ?? ""}`,
      tone: "negative",
      detail:
        "How much more a US dollar costs on the parallel market than at the official bank rate, right now — the clearest single sign of foreign-currency scarcity.",
    },
    {
      stat: peak ? pct(peak.premium) : "—",
      label: `Widest gap · ${peak?.period ?? ""}`,
      tone: "negative",
      detail: `The premium peaked in ${peak?.period ?? "—"}. Spikes like this mark moments of acute hard-currency shortage and usually precede policy moves on the rate.`,
    },
    {
      stat: pct(avg),
      label: "Average premium",
      tone: "gold",
      detail: `Across ${prem.length} months the parallel rate ran ${pct(avg)} above official on average — and above 50% in ${over50} of them. The gap is the norm, not the exception.`,
    },
    {
      stat: deprec !== null ? pct(deprec) : "—",
      label: `Birr vs USD · since ${off[0]?.x ?? ""}`,
      tone: "negative",
      detail: `The official birr has weakened ${deprec !== null ? pct(deprec) : "—"} against the dollar over the period. Because Ethiopia imports heavily, that feeds straight into local prices.`,
    },
  ];
}

export function tradeFindings(): Finding[] {
  const bal = balanceSeries();
  const latest = bal.at(-1);
  const first = bal[0];
  const year = latestYear();
  const imp = latest?.exports_usd
    ? latest.imports_usd / latest.exports_usd
    : null;
  const coffee = row<{ v: number }>(
    "trade",
    "SELECT value_usd v FROM trade_flows WHERE commodity_hs='0901' AND flow='export' AND period=? LIMIT 1",
    year,
  );
  const coffeeShare =
    coffee && latest?.exports_usd
      ? (coffee.v / latest.exports_usd) * 100
      : null;
  const topImp = topImports(year, 1)[0];
  return [
    {
      stat: imp !== null ? `${num(imp, 1)}×` : "—",
      label: `Imports per $1 of exports · ${year}`,
      tone: "negative",
      detail: `Ethiopia buys about $${num(imp ?? 0, 1)} from the world for every $1 it sells. The shortfall is paid in foreign currency the country must find elsewhere.`,
    },
    {
      stat: latest ? usdB(latest.balance_usd) : "—",
      label: `Trade deficit · ${year}`,
      tone: "negative",
      detail: `Exports of ${latest ? usdB(latest.exports_usd) : "—"} against imports of ${latest ? usdB(latest.imports_usd) : "—"}. The deficit has run between ${first ? usdB(first.balance_usd) : "—"} and here across the period.`,
    },
    {
      stat: coffeeShare !== null ? `${num(coffeeShare, 0)}%` : "—",
      label: `Coffee share of exports · ${year}`,
      tone: "gold",
      detail:
        "A single crop, coffee, accounts for this much of all merchandise exports — concentration that ties the country's foreign earnings to one world price.",
    },
    {
      stat: topImp ? usdB(topImp.value_usd) : "—",
      label: `Largest import · ${year}`,
      tone: "primary",
      detail: `The biggest single import category is ${topImp?.commodity_desc ?? "—"}. Exposure here means global price shocks land directly on the trade balance.`,
    },
  ];
}

function staple(): {
  name: string;
  first?: number;
  last?: number;
  firstX?: string;
  lastX?: string;
} {
  for (const name of [
    "Maize",
    "Wheat",
    "Teff",
    "Sorghum",
    "maize",
    "wheat",
    "teff",
  ]) {
    const s = monthlyTrend(name);
    if (s.length > 12)
      return {
        name,
        first: s[0]?.y,
        last: s.at(-1)?.y,
        firstX: s[0]?.x,
        lastX: s.at(-1)?.x,
      };
  }
  return { name: "—" };
}

export function pricesFindings(
  markets: number,
  commodities: number,
): Finding[] {
  const s = staple();
  const rise = s.first && s.last ? (s.last / s.first - 1) * 100 : null;
  return [
    {
      stat: rise !== null ? pct(rise) : "—",
      label: `${s.name} price · ${s.firstX ?? ""}→${s.lastX ?? ""}`,
      tone: "negative",
      detail: `The market price of ${s.name.toLowerCase()}, a daily staple, has risen ${rise !== null ? pct(rise) : "—"} over the record — the inflation households actually feel.`,
    },
    {
      stat: num(commodities),
      label: "Commodities tracked",
      tone: "primary",
      detail: `Prices for ${num(commodities)} distinct food, livestock, and commodity items, letting you compare the cost of a basket, not just one good.`,
    },
    {
      stat: num(markets),
      label: "Markets covered",
      tone: "gold",
      detail: `Observations span ${num(markets)} markets across the country, so regional price gaps — a sign of how well markets connect — become visible.`,
    },
  ];
}

export function macroFindings(): Finding[] {
  const inf = inflation();
  const cpi = inf.cpi;
  const mult = cpi.length && cpi[0]?.y ? (cpi.at(-1)?.y ?? 0) / cpi[0].y : null;
  const gdp = indicatorSeries("NY.GDP.MKTP.CD");
  const g0 = gdp.at(-2)?.y;
  const g1 = gdp.at(-1)?.y;
  const gGrowth = g0 && g1 ? (g1 / g0 - 1) * 100 : null;
  return [
    {
      stat: inf.latestYoY !== null ? pct(inf.latestYoY) : "—",
      label: `Inflation · CPI YoY · ${inf.latestPeriod ?? ""}`,
      tone: "negative",
      detail:
        "The year-on-year rise in consumer prices — the headline number for how fast money is losing value.",
    },
    {
      stat: mult !== null ? `${num(mult, 1)}×` : "—",
      label: `Prices since ${cpi[0]?.x ?? ""}`,
      tone: "gold",
      detail: `The consumer price index is now about ${num(mult ?? 0, 1)} times its level at the start of the record — what cost 100 birr then costs roughly ${num((mult ?? 0) * 100, 0)} now.`,
    },
    {
      stat: g1 ? usdB(g1) : "—",
      label: `GDP · ${gdp.at(-1)?.x ?? ""}`,
      tone: "primary",
      detail: `The economy is worth about ${g1 ? usdB(g1) : "—"} in current dollars${gGrowth !== null ? `, up ${pct(gGrowth)} on the year before` : ""}.`,
    },
  ];
}

export function propertyFindings(): Finding[] {
  const sqm = row<{ a: number }>(
    "property",
    "SELECT AVG(price_sqm) a FROM property_prices WHERE price_sqm > 0 AND region='Addis Ababa'",
  );
  const types = row<{ listing_type: string; a: number }>(
    "property",
    "SELECT listing_type, AVG(price) a FROM property_prices WHERE price > 0 GROUP BY listing_type ORDER BY COUNT(*) DESC LIMIT 1",
  );
  const beds3 = row<{ a: number }>(
    "property",
    "SELECT AVG(price) a FROM property_prices WHERE price > 0 AND bedrooms=3 AND region='Addis Ababa'",
  );
  return [
    {
      stat: sqm ? num(sqm.a) : "—",
      label: "Average price · ETB/m²",
      tone: "gold",
      detail:
        "The average asking price per square metre in Addis Ababa — the fair, size-adjusted way to compare locations rather than headline prices.",
    },
    {
      stat: beds3 ? num(beds3.a) : "—",
      label: "Typical 3-bed · ETB",
      tone: "primary",
      detail:
        "What a three-bedroom home in Addis Ababa typically asks — a concrete anchor for affordability against incomes.",
    },
    {
      stat: types ? num(types.a) : "—",
      label: `Average · ${types?.listing_type ?? ""}`,
      tone: "neutral",
      detail: `The mean asking price across the most common listing type (${types?.listing_type ?? "—"}). These are asking prices, not closed sales, so read them as the top of the market.`,
    },
  ];
}
