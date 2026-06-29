# Food & Commodity Prices

*The price of things people buy: food, grain, livestock, and global commodity benchmarks,
across markets and over decades.*

Source database: **`prices.db`** — see [`../data/db/prices.md`](../data/db/prices.md) for exact
tables and current coverage.

---

## What's in this data

- **Local market prices** for ~200 commodities across ~300 markets — food staples (teff, maize,
  wheat, sorghum), pulses, oil, livestock — from WFP (2000→) and FEWS NET (2001→).
- **Global commodity benchmarks** (World Bank "Pink Sheet") — coffee, gold, oil, wheat, etc.,
  monthly, back to 1960 — useful as a world-price reference.
- **Producer (farmgate) prices** (FAOSTAT, 1994–2018) and **ECX** coffee/sesame averages.
- **A modelled real-time price series** (machine-estimated) — convenient but **label it an estimate**.
- **Pre-computed roll-ups** (`commodity_aggregates`) — weekly/monthly/yearly averages per series.
- **Each price row carries** its commodity, market (with region/coordinates), currency, unit,
  and price type — so you can compare like-for-like.

---

## How to show it

| You want to show… | Use this chart |
|-------------------|----------------|
| One commodity over time | Line chart (national or per-market) |
| Prices across the country | Choropleth map coloured by price (markets have region + coordinates) |
| Seasonality | Month-of-year curve, or a month × commodity heatmap |
| A "shopping basket" cost | A single index line, components on hover |
| Real vs nominal | Two lines (nominal steep, real flat-ish) |
| Regional gaps | Dumbbell/range chart (cheapest vs dearest region) |

## What to calculate (aggregations)

- **Monthly/area averages** — normalise daily and weekly sources to a common monthly figure.
- **A fixed basket** — sum selected staples with fixed weights, index to 100 at a base month.
- **Year-over-year %** — this month vs the same month last year (the inflation people feel).
- **Real prices** — divide by the consumer price index (from `macro.db`) to strip out inflation.
- **Seasonal index** — average by calendar month across years to expose harvest/lean cycles.
- **Regional spread** — highest minus lowest region price for the same commodity and month.

## Showcase pages this powers

- **F — Food price inflation you can feel**
- **M — The market price map**
- **N — Nominal vs. real prices**
- **Q — The seasonal food calendar**
- **S — The staple basket cost over time**
- **Z — Zonal price disparities**
- Also feeds **J** (coffee price transmission), **W** (wheat), **X** (pass-through).

## Research it can support

- Whether **observed food inflation diverges from official CPI**.
- **Market integration** — do regional prices move together, or are markets fragmented?
- **Seasonality and food-security early warning** — predictable lean-season spikes.
- **Farmgate-to-retail spread** — how much of the price reaches the farmer.

## Caveats to put on the page

- Sources differ in method and frequency — **state which source a chart uses**.
- The real-time series is **machine-estimated**, not directly observed.
- FAOSTAT producer prices **end in 2018**; don't extend them implicitly.
- Always show the **unit and currency** — a "price" is meaningless without "per kg, in birr".
