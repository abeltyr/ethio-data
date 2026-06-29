# Research Agenda — What Can Be Published

Beyond charts for a general audience, this data can support **publishable analysis** — blog
deep-dives, policy notes, data journalism, or academic working papers. Each question below is
framed so a non-specialist understands the stakes, with the data and method noted for an analyst.

Each entry: **the question** · **why it matters** · **data & method** · **honest limits**.

---

## 1. Does the black-market premium predict devaluation?
- **Why it matters:** If the street price of dollars consistently jumps before the official rate
  moves, the premium is an early-warning signal policymakers and businesses can watch.
- **Data & method:** `currency.db` `v_informal_fx_premium` vs the official-rate timeline; look
  for the premium widening ahead of official rate steps (lead-lag analysis).
- **Limits:** Parallel rates are indicative; coverage starts ~2021–2023.

## 2. Is official inflation telling the whole story?
- **Why it matters:** Households trust the prices they see at the market. If a real-world food
  basket rises faster than the official CPI, the headline number understates lived inflation.
- **Data & method:** Build a fixed staple basket from `prices.db`; compute its YoY change;
  compare to CPI YoY from `macro.db`.
- **Limits:** Basket choice matters — publish the weights; sources differ in method.

## 3. Who captures the value when world coffee prices rise?
- **Why it matters:** When global coffee prices climb, do Ethiopian farmers, exporters, or
  neither benefit? It's a fairness-and-policy question about the country's signature crop.
- **Data & method:** Index the Pink Sheet global coffee benchmark, FAOSTAT/ECX farmgate prices,
  and coffee export unit values to 100 at a base year; compare movement and timing.
- **Limits:** FAOSTAT producer prices end 2018; trade is annual to 2023.

## 4. How exposed is Ethiopia to global fuel and wheat prices?
- **Why it matters:** Fuel and wheat are major imports; world-price spikes hit the trade
  deficit, the currency, and bread prices directly.
- **Data & method:** `trade.db` import values/volumes for fuels (ch. 27) and wheat (1001),
  overlaid with `prices.db` global benchmarks.
- **Limits:** Trade is annual and ends 2023 — pair with monthly benchmarks for recency.

## 5. Exchange-rate pass-through to food prices
- **Why it matters:** Quantifies how fast and how fully a weaker birr shows up as higher food
  prices — central to understanding inflation.
- **Data & method:** Compare % changes in the official USD rate (`currency.db`) with % changes
  in import-linked food prices (`prices.db`), testing for a lag.
- **Limits:** Many factors move food prices; treat as correlation, control where possible.

## 6. Is Ethiopia's export base diversifying?
- **Why it matters:** Heavy reliance on a few primary commodities means fragility. Tracking the
  basket's concentration shows whether the economy is broadening.
- **Data & method:** `trade.db` chapter shares over 2008–2023; compute a concentration measure
  (e.g. top-3 share, or a Herfindahl index).
- **Limits:** Annual; ends 2023.

## 7. Is the leather industry moving up the value chain?
- **Why it matters:** Exporting finished leather goods instead of raw hides means more jobs and
  earnings retained domestically — a stated industrial-policy goal.
- **Data & method:** `v_leather_trade` — ratio of finished (4107/4202/6403) to raw (41) exports
  over time.
- **Limits:** HS categories are coarse; annual data.

## 8. The true scale of informal khat trade
- **Why it matters:** Recorded khat exports are known to undercount overland trade — estimating
  the gap informs both fiscal policy and our understanding of the informal economy.
- **Data & method:** `trade.db` recorded khat (1211) as a floor; triangulate with regional
  demand and price data; present as a range, not a point.
- **Limits:** By definition the unrecorded part isn't in the data — be explicit.

## 9. Are Ethiopia's food markets integrated?
- **Why it matters:** If a staple costs far more in one region than another for long periods,
  markets aren't integrated — a sign of transport, infrastructure, or policy frictions.
- **Data & method:** `prices.db` + `markets`; compare same-commodity prices across regions over
  time; measure the persistent spread (showcase Z).
- **Limits:** Market coverage varies; control for quality/variety differences.

## 10. Housing affordability in Addis Ababa
- **Why it matters:** Whether ordinary incomes can keep up with home prices and rents is a core
  urban-policy question.
- **Data & method:** `property.db` median price and rent by type/area (price-per-m²), set against
  income proxies from `macro.db`.
- **Limits:** Asking prices, Addis-only, collected sample — not the whole market.

---

## Cross-cutting strengths to lean on

- **Triangulation:** the same phenomenon often appears in two databases (e.g. a weak birr in
  `currency` and rising import prices in `prices`) — agreement across sources is a strong story.
- **Long horizons:** macro and global benchmarks reach back decades, enabling genuine
  historical context.
- **Informality:** the parallel FX rate and the khat gap let you study the *informal* economy,
  which most official statistics miss.

## Cross-cutting limits to disclose

- Different **frequencies** (daily FX, monthly prices, annual trade/macro) — align carefully.
- Different **methods** per source — never silently merge series; label them.
- **Recency** varies — trade ends 2023; FX starts ~2021; producer prices end 2018.
- Some series are **estimates or asking prices**, not direct observations.
