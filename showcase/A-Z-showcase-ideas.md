# A–Z of Showcase Ideas

Twenty-six ready-to-build stories from the Ethiopia economic data, one per letter. Each is a
self-contained page idea. Pick any; they don't depend on each other. Format for every entry:

> **The story** · **Data used** · **What to calculate** · **Show it as** · **Why it matters**

See [`visualization-and-aggregation-guide.md`](visualization-and-aggregation-guide.md) for the
chart and aggregation details, and the domain deep-dives for more depth.

---

### A — Addis Ababa rent & affordability
- **The story:** What does it cost to rent or buy a home in Addis, and how has that changed?
- **Data used:** `property.db` → `property_prices` (view `v_housing_summary`, `v_housing_monthly`).
- **What to calculate:** Average and median price by listing type (sale/rent), bedrooms, and
  region; average price-per-square-meter; monthly trend.
- **Show it as:** Bar chart by bedroom count; a monthly trend line; a price-per-m² table.
- **Why it matters:** Housing is most families' biggest cost — this makes "is rent rising?" concrete.

### B — Black-market vs. official birr (the premium tracker)
- **The story:** How much more do people pay on the street for a dollar than the bank rate?
- **Data used:** `currency.db` → `exchange_rates` (view `v_informal_fx_premium`).
- **What to calculate:** Monthly average parallel rate ÷ official rate − 1, as a percent.
- **Show it as:** A line chart of the premium % over time; a "today's premium" big-number tile.
- **Why it matters:** The premium is the clearest single signal of foreign-currency scarcity
  and pressure to devalue. (Recent premiums have run very high — pull the live figure.)

### C — Coffee: the country's signature export
- **The story:** How much does Ethiopia earn from coffee, and is it rising or falling?
- **Data used:** `trade.db` → `trade_flows` (HS `0901`, flow = export).
- **What to calculate:** Annual export value (USD); year-over-year change; share of total exports.
- **Show it as:** A value-over-time line, with a small "share of all exports" donut.
- **Why it matters:** Coffee is Ethiopia's economic icon and a top foreign-currency earner.

### D — Devaluation watch: the birr's slide
- **The story:** How fast has the birr lost value against the dollar?
- **Data used:** `currency.db` → `exchange_rates` (official USD; `rate_aggregates` for monthly).
- **What to calculate:** Monthly average USD/ETB; cumulative % depreciation from a base date.
- **Show it as:** A line chart with key policy dates annotated (e.g. float events).
- **Why it matters:** The exchange rate touches every imported good's price.

### E — The export basket: what we sell to the world
- **The story:** What makes up Ethiopia's exports, and how has the mix shifted?
- **Data used:** `trade.db` → `trade_flows` (HS 2-digit chapters, flow = export; `v_top_exports`).
- **What to calculate:** Annual value per chapter; share of total; top-10 ranking per year.
- **Show it as:** A stacked-area chart of composition over time; a ranked bar for the latest year.
- **Why it matters:** Shows whether the economy is diversifying beyond coffee and farm goods.

### F — Food price inflation you can feel
- **The story:** Is the cost of everyday food going up faster than official inflation says?
- **Data used:** `prices.db` → `commodity_prices` (a staple basket); compare to `macro.db` CPI.
- **What to calculate:** Monthly average price of a fixed basket; YoY % change; vs. CPI YoY.
- **Show it as:** Two lines on one chart — "your grocery basket" vs. "official CPI".
- **Why it matters:** People trust prices they can verify at the market more than headline stats.

### G — Gold: a store of value in birr and dollars
- **The story:** What's gold worth in Ethiopia, and how does the birr price compare to the USD price?
- **Data used:** `currency.db` → `gold_rates` (price_usd, price_birr).
- **What to calculate:** Daily/monthly average price in each currency; ratio over time.
- **Show it as:** Dual-axis line (USD vs ETB); the gap visualises birr depreciation.
- **Why it matters:** When currency is unstable, gold is a refuge — its birr price tells that story.

### H — House price per square meter, by neighborhood
- **The story:** Where in Addis is land most expensive, and by how much?
- **Data used:** `property.db` → `property_prices` (region/area, price_sqm).
- **What to calculate:** Average price-per-m² by region/area; rank; sale vs rent split.
- **Show it as:** A ranked bar chart (or map if coordinates are present) of price-per-m².
- **Why it matters:** Cuts through "expensive vs cheap" with a fair, size-adjusted comparison.

### I — Import dependency dashboard
- **The story:** What does Ethiopia rely on the world for — fuel, wheat, machinery, medicine?
- **Data used:** `trade.db` → `trade_flows` (flow = import; chapters 27, 84, 85, 87, 10, 31, 30).
- **What to calculate:** Annual import value per key chapter; share of total imports; trend.
- **Show it as:** A ranked bar of top imports; a stacked area of the import mix over time.
- **Why it matters:** Import reliance (especially fuel) explains vulnerability to global prices.

### J — The journey of a coffee dollar (price transmission)
- **The story:** When global coffee prices move, do Ethiopian farmers and exporters benefit?
- **Data used:** `prices.db` Pink Sheet global coffee benchmark + FAOSTAT/ECX producer prices;
  `trade.db` coffee export unit value.
- **What to calculate:** Index each series to 100 at a base year; compare movements.
- **Show it as:** Multiple indexed lines (global benchmark, farmgate, export) on one chart.
- **Why it matters:** Shows who captures the value when world prices rise.

### K — Khat and the informal economy
- **The story:** How much khat does Ethiopia officially export — and why is the real number bigger?
- **Data used:** `trade.db` → `trade_flows` (HS `1211`, flow = export).
- **What to calculate:** Annual recorded export value and volume; label as a *floor*.
- **Show it as:** A value line with a prominent caveat box on under-reporting.
- **Why it matters:** A window into informal cross-border trade that official stats miss.

### L — The leather value chain
- **The story:** Does Ethiopia export raw hides or finished leather goods — and is it moving up the chain?
- **Data used:** `trade.db` → `trade_flows` (HS 41 raw, 4107 tanned, 4202 goods, 6403 footwear;
  view `v_leather_trade`).
- **What to calculate:** Annual value per stage; ratio of finished-to-raw over time.
- **Show it as:** A stacked bar by processing stage, per year.
- **Why it matters:** Industrial policy aims to export finished goods, not raw materials —
  this measures progress.

### M — The market price map
- **The story:** What does a staple (teff, maize, wheat) cost in different parts of the country?
- **Data used:** `prices.db` → `commodity_prices` + `markets` (admin1/region, lat/long).
- **What to calculate:** Latest/monthly average price per market or region for one commodity.
- **Show it as:** A choropleth map of Ethiopia coloured by price; slider for the month.
- **Why it matters:** Reveals which regions face the highest food costs.

### N — Nominal vs. real prices (inflation-adjusted)
- **The story:** Has a staple actually gotten more expensive, or is it just inflation?
- **Data used:** `prices.db` → `commodity_prices` deflated by `macro.db` CPI (attach query).
- **What to calculate:** Price ÷ CPI × 100 (real price, fixed base year); compare to nominal.
- **Show it as:** Two lines — nominal (steep) vs real (the honest trend).
- **Why it matters:** Teaches the single most important idea in reading prices.

### O — Oilseeds & sesame on the world market
- **The story:** How important are sesame and oilseeds to Ethiopia's export earnings?
- **Data used:** `trade.db` → `trade_flows` (HS `1207`, flow = export).
- **What to calculate:** Annual value and volume; YoY change; destination partners.
- **Show it as:** A value line plus a "top buyers" bar from `v_top_trade_partners`.
- **Why it matters:** Sesame is a quiet heavyweight in Ethiopia's export earnings.

### P — The premium as an early-warning signal
- **The story:** Does a widening black-market premium predict an official devaluation?
- **Data used:** `currency.db` → `v_informal_fx_premium` + official rate timeline.
- **What to calculate:** Premium % monthly; overlay dates of official rate jumps.
- **Show it as:** A line with policy-event markers; annotate where the premium spiked first.
- **Why it matters:** Turns the data into a forward-looking indicator, not just a record.

### Q — The seasonal food calendar
- **The story:** Which months are staples cheapest (harvest) and most expensive (lean season)?
- **Data used:** `prices.db` → `commodity_prices` (multi-year, by month).
- **What to calculate:** Average price by calendar month across years (seasonal index).
- **Show it as:** A 12-month seasonality curve, or a month × commodity heatmap.
- **Why it matters:** Helps households and food-security planners time purchases and aid.

### R — The real exchange rate & competitiveness
- **The story:** After accounting for inflation, is the birr cheap or expensive?
- **Data used:** `currency.db` official rate + `macro.db` CPI (and a partner-price proxy).
- **What to calculate:** Real exchange rate index (nominal rate adjusted for relative inflation).
- **Show it as:** An indexed line vs. the nominal rate.
- **Why it matters:** A "real" view of whether exports are price-competitive.

### S — The staple basket cost over time
- **The story:** What does it cost to feed a family the basics — teff, maize, wheat, oil?
- **Data used:** `prices.db` → `commodity_prices` (selected staples, national/market average).
- **What to calculate:** Sum a fixed-weight basket monthly; index to 100 at a base date.
- **Show it as:** A single "cost of basics" index line, with the components on hover.
- **Why it matters:** The most relatable inflation measure there is.

### T — The trade balance & deficit explorer
- **The story:** Ethiopia buys far more than it sells — how big is the gap and is it growing?
- **Data used:** `trade.db` → `trade_flows` (view `v_trade_balance`).
- **What to calculate:** Annual exports, imports, balance, and export-coverage ratio (%).
- **Show it as:** Grouped bars (exports vs imports) with a balance line; coverage % tile.
- **Why it matters:** The deficit drives the demand for foreign currency behind story B/D.

### U — Urban housing supply (listings volume)
- **The story:** Are more or fewer homes coming onto the Addis market over time?
- **Data used:** `property.db` → `property_prices` (count by month, `v_housing_monthly`).
- **What to calculate:** Monthly listing counts by type; trend.
- **Show it as:** A volume bar/area chart over time, split sale vs rent.
- **Why it matters:** Supply context for the price story (A/H); a proxy for market activity.
  *(Caveat: listing counts reflect what was collected, not the whole market.)*

### V — How volatile is the birr?
- **The story:** Is the exchange rate steady or jumpy?
- **Data used:** `currency.db` → `exchange_rates` / `rate_aggregates` (min/max per period).
- **What to calculate:** Monthly range (max − min) and rolling variation of the daily rate.
- **Show it as:** A candlestick-style range chart, or a line with a shaded min–max band.
- **Why it matters:** Volatility, not just level, is what hurts businesses planning ahead.

### W — Wheat: the import-reliance story
- **The story:** How much wheat does Ethiopia import, and how exposed is it to world prices?
- **Data used:** `trade.db` wheat imports (HS `1001`) + `prices.db` Pink Sheet wheat benchmark.
- **What to calculate:** Annual import value/volume; overlay global wheat price.
- **Show it as:** Import bars with the global price line overlaid.
- **Why it matters:** Bread prices and food security ride on this exposure.

### X — Exchange-rate pass-through to food prices
- **The story:** When the birr falls, how fast do food prices rise?
- **Data used:** `currency.db` official USD rate + `prices.db` import-linked food prices.
- **What to calculate:** Compare % change in the rate to % change in prices, with a lag.
- **Show it as:** Two indexed lines (rate vs prices) with the lag highlighted.
- **Why it matters:** Connects the abstract "exchange rate" to the dinner table.

### Y — Year-over-year inflation dashboard
- **The story:** What is inflation, plainly, and where is it now vs. history?
- **Data used:** `macro.db` → `economic_indicators` (CPI; `v_latest_indicators`).
- **What to calculate:** YoY % change in CPI; long-run trend; latest value tile.
- **Show it as:** A YoY inflation line with a current "headline" number.
- **Why it matters:** The number everyone quotes — give it context and history.

### Z — Zonal price disparities (the geography of cost)
- **The story:** How big is the price gap between the cheapest and most expensive regions?
- **Data used:** `prices.db` → `commodity_prices` + `markets` (admin1).
- **What to calculate:** For one staple, the spread between highest- and lowest-price regions per month.
- **Show it as:** A range/dumbbell chart per region, or the gap as a line over time.
- **Why it matters:** Large gaps signal poor market integration, transport costs, or local shortages.

---

## Quick index by audience

- **General public / journalists:** A, B, C, D, F, G, K, S, T, Y
- **Households / consumers:** A, F, H, M, Q, S, Z
- **Business / investors:** D, E, I, P, R, T, V, W
- **Researchers / policy:** J, L, N, O, R, X, Z (+ see [`research-agenda.md`](research-agenda.md))
