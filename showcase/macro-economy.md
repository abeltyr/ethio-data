# The Macro Economy

*The big picture: inflation, growth, and the long-run national indicators.*

Source database: **`macro.db`** — see [`../data/db/macro.md`](../data/db/macro.md) for the exact
indicator list and current coverage.

---

## What's in this data

- **Annual macroeconomic indicators** for Ethiopia from the World Bank, going back as far as
  1960 for some series — consumer price index (CPI/inflation), GDP and growth, and many more.
- **IMF World Economic Outlook** forecasts *when available* — **check first; this series can be
  empty** if the source blocked collection.
- **A latest-value view** (`v_latest_indicators`) — the most recent reading per indicator.
- Each row carries the indicator code, name, year, value, and unit.

This database is also the **inflation backbone** for the rest of the site: it's what turns
"nominal" prices into "real" (inflation-adjusted) ones in `prices.db` and `trade` comparisons.

---

## How to show it

| You want to show… | Use this chart |
|-------------------|----------------|
| Inflation now & history | YoY % line with a current "headline" tile |
| Growth over time | Bar or line of annual GDP growth |
| One indicator's long run | Simple line, decades on the x-axis |
| A few indicators together | Small multiples (a grid of mini-charts) |

## What to calculate (aggregations)

- **Year-over-year % change** — the standard way to express inflation and growth.
- **Indexing** — rebase a series to 100 at a chosen year to compare shapes.
- **Latest value** — pull the most recent reading per indicator (`v_latest_indicators`).
- **Deflator** — use CPI to convert other series (prices, wages, trade) into real terms.

## Showcase pages this powers

- **Y — Year-over-year inflation dashboard**
- The CPI here underpins **N** (real vs nominal prices), **R** (real exchange rate), and
  **X** (pass-through).

## Research it can support

- **Inflation vs. observed market prices** — does the official CPI match what people pay
  (cross-reference `prices.db`)?
- **Long-run growth and structural change** narratives.
- **Real (inflation-adjusted) comparisons** across the whole warehouse.

## Caveats to put on the page

- **Annual, not monthly** — fine for trends, not for short-term timing.
- **The IMF series may be empty** — verify before building a forecast page on it.
- Indicator definitions are the source's; **link the code/name** so readers can check.
