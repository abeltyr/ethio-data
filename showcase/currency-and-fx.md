# Currency & Foreign Exchange

*The price of money: official bank rates, the black-market (parallel) rate, and gold.*

Source database: **`currency.db`** — see [`../data/db/currency.md`](../data/db/currency.md) for
exact tables and current coverage.

---

## What's in this data

- **Official exchange rates** from banks — National Bank of Ethiopia (NBE), Commercial Bank
  of Ethiopia (CBE), Zemen, Hibret — buying/selling for ~30 currencies, mostly daily, from
  about 2021 onward (varies by bank).
- **Parallel ("black-market") rates** — what hard currency actually trades for outside banks.
- **Gold rates** — daily gold prices in both US dollars and birr (from 2023).
- **Pre-computed roll-ups** (`rate_aggregates`) — weekly/monthly/yearly averages, mins and maxes.
- **A ready-made premium view** (`v_informal_fx_premium`) — parallel vs official, by month, with
  the premium percentage already calculated.

---

## How to show it

| You want to show… | Use this chart |
|-------------------|----------------|
| The rate over time | Line chart (one line per currency or bank) |
| How jumpy the rate is | Candlestick or a line with a shaded min–max band |
| Black-market vs official | Two lines + a shaded gap, or a "premium %" line |
| Today's snapshot | Big-number tiles (rate, premium, daily change) |
| Gold in two currencies | Dual-axis line (USD left, ETB right) |

## What to calculate (aggregations)

- **Period averages** — daily → monthly/yearly mean (already in `rate_aggregates`).
- **The premium** — `parallel_rate / official_rate − 1`, shown as a percent (in `v_informal_fx_premium`).
- **Depreciation** — cumulative % change in the rate from a chosen base date.
- **Volatility** — monthly range (max − min), or the standard deviation of the daily rate.
- **Spread** — selling minus buying rate (the bank's margin).

## Showcase pages this powers

- **B — Black-market vs official birr** (the premium tracker)
- **D — Devaluation watch** (the birr's slide)
- **G — Gold as a store of value**
- **P — The premium as an early-warning signal**
- **R — The real exchange rate**
- **V — How volatile is the birr?**

(See [`A-Z-showcase-ideas.md`](A-Z-showcase-ideas.md) for full build specs.)

## Research it can support

- The **parallel-market premium as a leading indicator** of official devaluation and FX rationing.
- **Pass-through**: how exchange-rate moves feed into domestic (especially imported) prices —
  pair with `prices.db` (see showcase X).
- **Bank dispersion**: do different banks quote materially different rates, and when?

## Caveats to put on the page

- Coverage **starts around 2021–2023** depending on the bank — don't imply deeper history.
- Parallel rates are gathered from informal sources; treat them as indicative, not audited.
- Some bank sites are intermittently unreachable, so a few days may be missing — the gap is in
  the data, not the economy.
