# Ethiopia Economic Data — Showcase Guide

This folder is the **editorial plan for a public website** built on top of the Ethiopia
economic data warehouse. It explains, in plain language, **what stories the data can tell,
how to show them, what to calculate, and what research it can support** — so a writer,
designer, or analyst can turn the raw numbers into pages people actually understand.

> You do **not** need to be an economist to use this. Each idea says what it is, where the
> numbers come from, what to add up, how to draw it, and why it matters.

---

## The data, in one paragraph

We continuously collect Ethiopian economic time-series from public and private sources and
store them in five subject databases:

| Database | In plain words | Roughly covers |
|----------|----------------|----------------|
| **currency** | The price of money — official bank exchange rates, the black-market ("parallel") rate, and gold. | 2021 → today, daily |
| **prices** | The price of things — food, grain, livestock, fuel benchmarks, in markets across the country. | 2000 → today, weekly/monthly |
| **macro** | The big picture — inflation, GDP, and other national indicators. | 1960 → 2025, yearly |
| **trade** | What Ethiopia buys and sells abroad — coffee, khat, leather, gold vs fuel, wheat, machinery. | 2008 → 2023, yearly |
| **property** | The cost of a roof — Addis Ababa house and rent listings. | 2017 → today |

The authoritative, always-current description of every table lives in
[`../DATA_PROFILE.md`](../DATA_PROFILE.md) and the per-database docs in `../data/db/*.md`.
**This folder is about ideas; those files are about the exact contents.**

---

## How to read each showcase idea

Every showcase in this folder is described with the same five fields, so a non-expert can
hand it to a designer and an analyst and both know what to do:

- **The story** — the question a normal person is asking, in one sentence.
- **Data used** — which database(s) and table(s) supply it.
- **What to calculate** — the aggregation (average, % change, ratio, ranking…).
- **Show it as** — the chart, map, or table that fits.
- **Why it matters** — who cares and what they learn.

---

## What's in this folder

| File | What it gives you |
|------|-------------------|
| [`A-Z-showcase-ideas.md`](A-Z-showcase-ideas.md) | **Start here.** 26 ready-to-build showcase ideas, A to Z — the menu for the website. |
| [`currency-and-fx.md`](currency-and-fx.md) | Deep dive: exchange rates, the black-market premium, gold. |
| [`food-and-commodity-prices.md`](food-and-commodity-prices.md) | Deep dive: food and market prices, inflation you can feel. |
| [`trade.md`](trade.md) | Deep dive: exports, imports, the trade deficit, key commodities. |
| [`macro-economy.md`](macro-economy.md) | Deep dive: inflation, growth, the national indicators. |
| [`housing-and-rent.md`](housing-and-rent.md) | Deep dive: Addis Ababa housing and rent. |
| [`visualization-and-aggregation-guide.md`](visualization-and-aggregation-guide.md) | Reference: which chart for which data, and the aggregations explained in plain words. |
| [`research-agenda.md`](research-agenda.md) | Publishable research questions the data can answer. |

---

## Plain-language glossary

You'll see these words throughout. Here's what they mean:

- **Nominal vs. real** — *Nominal* is the price on the tag. *Real* strips out inflation so
  you can compare across years honestly (a 100-birr loaf in 2015 vs 2024).
- **Official vs. parallel (black-market) rate** — the *official* rate banks publish vs. the
  *parallel* rate people actually pay on the street for hard currency.
- **Premium** — how much higher the black-market rate is than the official one, as a percent.
- **Year-over-year (YoY)** — change compared to the same month/year a year earlier; this is
  how inflation is usually quoted.
- **Trade balance** — exports minus imports. Negative means the country buys more than it
  sells (a *deficit*).
- **HS code** — an international product code (e.g. coffee = 0901) used in trade data.
- **Aggregation** — combining many rows into one number: an average, total, min/max, or count.

---

## Honesty notes (read before publishing)

Good showcases are honest about limits. Carry these caveats onto the relevant pages:

- **Trade data ends in 2023** (UN Comtrade annual) and is yearly, not monthly.
- **Khat exports are under-reported** — overland trade to Somalia/Djibouti goes uncounted, so
  recorded figures are a *floor*, not the truth.
- **One price source can be modelled** — the "real-time prices" series is machine-estimated,
  not direct observation; label it as an estimate.
- **The IMF forecast series may be empty** if the source blocked collection; check before
  building a page on it.
- **Exchange-rate history starts ~2021–2023** depending on the bank; don't imply older coverage.
- Numbers update with each collection run — **never hard-code a figure into a headline**;
  pull it live or date-stamp it.
