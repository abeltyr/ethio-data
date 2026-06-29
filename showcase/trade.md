# Trade — Exports, Imports & the Deficit

*What Ethiopia sells to and buys from the world: coffee, khat, leather, gold vs. fuel, wheat,
machinery — and the gap between the two.*

Source database: **`trade.db`** — see [`../data/db/trade.md`](../data/db/trade.md) for exact
tables and current coverage.

---

## What's in this data

- **Annual export and import flows** (UN Comtrade), 2008–2023, in US dollars, with quantities
  where available.
- Three levels of detail:
  - **Grand totals** (`commodity_hs = 'TOTAL'`) — used for the trade balance.
  - **HS 2-digit chapters** — the export/import *basket* (e.g. 09 coffee/tea/spices, 27 fuels).
  - **Detailed products** — coffee (0901), khat (1211), sesame (1207), gold (7108), leather
    (41/4107/4202/6403), wheat (1001), and more.
- **Bilateral partners** — who Ethiopia trades with, per year (`partner_code`, `v_top_trade_partners`).
- **Ready-made views**: `v_trade_balance`, `v_top_exports`, `v_top_imports`, `v_leather_trade`,
  `v_petroleum_trade`, `v_top_trade_partners`, `v_trade_summary`.

---

## How to show it

| You want to show… | Use this chart |
|-------------------|----------------|
| Exports vs imports over time | Grouped bars + a balance line |
| What we export/import | Stacked-area composition, or ranked bars for one year |
| Top trading partners | Ranked horizontal bars (per year, per flow) |
| A value chain (leather) | Stacked bars by processing stage |
| One commodity's earnings | A value-over-time line |

## What to calculate (aggregations)

- **Trade balance** — exports − imports per year (`v_trade_balance`).
- **Export coverage ratio** — exports ÷ imports × 100 (how much of the import bill exports pay for).
- **Composition shares** — each chapter as a % of total exports/imports.
- **Top-N rankings** — biggest exports, imports, and partners per year.
- **Year-over-year change** — growth or decline of a commodity's value.
- **Finished-to-raw ratio** — e.g. processed leather vs raw hides (industrial upgrading).

## Showcase pages this powers

- **C — Coffee** · **E — The export basket** · **I — Import dependency** · **K — Khat & the
  informal economy** · **L — The leather value chain** · **O — Oilseeds & sesame** ·
  **T — Trade balance & deficit explorer** · feeds **W** (wheat).

## Research it can support

- The **structure of the trade deficit** and import dependency (especially fuel and wheat).
- **Export concentration vs. diversification** over 15 years.
- **Industrial upgrading** — is Ethiopia moving from raw to finished exports (leather)?
- **Informal trade** — the gap between recorded and likely-true khat exports.
- **Partner shifts** — changing reliance on particular trading partners.

## Caveats to put on the page

- **Yearly and ends in 2023** — not real-time; say so on every chart.
- **Khat (and some cross-border trade) is under-reported** — recorded values are a floor.
- The most recent one or two years may be **revised** by the source after first publication.
- "World" totals use `partner_code = '0'`; bilateral rows exclude it — don't double-count.
