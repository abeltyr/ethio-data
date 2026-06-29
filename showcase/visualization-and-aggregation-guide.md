# Visualization & Aggregation Guide

A plain-language reference for **how to show** each kind of data and **what to calculate**
before you show it. Use it alongside the A–Z and domain files.

---

## Part 1 — Which chart for which data

| If the data is… | The reader's question is… | Best chart |
|-----------------|---------------------------|------------|
| One value over time | "Is it going up or down?" | **Line chart** |
| Two related series over time | "How do they compare/diverge?" | **Two lines** (index both to 100 if units differ) |
| A range/high-low over time | "How jumpy is it?" | **Candlestick** or line with a **shaded band** |
| Parts of a whole, over time | "How is the mix changing?" | **Stacked area** |
| Ranking at a point in time | "What's biggest?" | **Horizontal bar chart** (sorted) |
| A value across places | "Where is it highest?" | **Choropleth map** (needs region/coordinates) |
| Repeating yearly pattern | "When in the year?" | **Seasonality curve** or **month × item heatmap** |
| Spread between two extremes | "How big is the gap?" | **Dumbbell / range chart** |
| A single current number | "What is it right now?" | **Big-number tile** (with the date + change) |
| Distribution of many values | "What's typical, what's an outlier?" | **Box plot** or **histogram** |
| Two quantities related | "Does X go with Y?" | **Scatter plot** |

**Rules of thumb**
- Always label **units and currency** (per kg, in birr; USD; %).
- Always show the **date or date range** — these series update.
- Prefer **median** over **mean** for "typical" headlines when a few extreme values exist
  (housing prices especially).
- When comparing series in different units (e.g. global price vs local price), **index both to
  100** at a common base date so shapes are comparable.
- Annotate **events** (a policy change, a float, a drought) directly on time-series charts.

---

## Part 2 — The aggregations, explained simply

You almost never plot raw rows. You combine them first. Here are the operations you'll use,
in everyday language:

- **Average (mean)** — add up and divide. Good for a "normal" level. Sensitive to outliers.
- **Median** — the middle value. The honest "typical" when a few values are extreme.
- **Total (sum)** — add everything (e.g. total annual export value).
- **Min / Max / Range** — lowest, highest, and the gap between (volatility, regional spread).
- **Count** — how many (e.g. number of listings this month).
- **Period roll-up** — turn daily numbers into monthly/yearly ones (already pre-computed in
  `rate_aggregates` and `commodity_aggregates`).
- **Year-over-year (YoY) % change** — this period vs. the same period a year ago. The standard
  way to express **inflation** and **growth**. Formula: `(now − year_ago) / year_ago × 100`.
- **Cumulative change** — total % move from a chosen starting date (e.g. how much the birr has
  depreciated since 2021).
- **Ratio** — one number divided by another, made meaningful:
  - **Premium %** = `parallel ÷ official − 1` (black-market gap).
  - **Export coverage %** = `exports ÷ imports × 100` (how much of the import bill exports cover).
  - **Price per m²** = `price ÷ size` (fair housing comparison).
- **Share of total** — one part ÷ the whole, as a % (e.g. coffee as a share of all exports).
- **Indexing** — rebase a series to 100 at a base date so different series can be compared on
  one chart regardless of original units.
- **Real (inflation-adjusted)** — divide a nominal value by the CPI and multiply by 100, so you
  compare across years honestly. *Nominal = the tag price; real = the tag price with inflation
  removed.*
- **Seasonal index** — average by calendar month across several years to reveal the
  harvest/lean-season cycle.

---

## Part 3 — A few ready-made shortcuts

The databases already contain views that do common aggregations for you, so a page can read
them directly instead of recomputing:

| View (database) | Gives you |
|-----------------|-----------|
| `v_informal_fx_premium` (currency) | Parallel vs official rate and the premium %, monthly |
| `v_trade_balance` (trade) | Exports, imports, balance, coverage % per year |
| `v_top_exports` / `v_top_imports` (trade) | Ranked HS chapters per year |
| `v_top_trade_partners` (trade) | Ranked partner countries per year |
| `v_leather_trade` / `v_petroleum_trade` (trade) | Sector drill-downs |
| `v_latest_commodity_prices` / `v_monthly_commodity_prices` (prices) | Latest and monthly-average prices |
| `v_latest_indicators` (macro) | Most recent value per indicator |
| `v_housing_summary` / `v_housing_monthly` (property) | Housing by type/region and monthly trend |

For the one cross-database calculation — **real (CPI-deflated) prices** — attach the macro
database to the prices database; the exact query is in
[`../data/db/prices.md`](../data/db/prices.md).
