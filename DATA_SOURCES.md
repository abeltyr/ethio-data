# Ethiopia Economic Data Warehouse — Data Sources

This project collects Ethiopia-related economic time-series from public and private
sources into per-domain SQLite databases under `data/db/` (`currency.db`, `prices.db`,
`macro.db`, `trade.db`, `property.db`). Run any collector with:

```bash
bun run src/cli.ts <provider> <task> [start] [end]
# or the named scripts, e.g.
bun run fetch:wfp        # food/livestock/commodity prices
bun run fetch:macro      # worldbank + imf + comtrade
bun run fetch:prices     # wfp + fewsnet + faostat + pinksheet + rtp
```

## One-command collection (CLI orchestrator)

`src/collect.ts` runs every provider in one go. Mirrors the CI schedule for local use:

```bash
bun run collect:daily      # forex (incremental, last 7d) + ECX — cheap, for a daily cron
bun run collect:weekly     # + food/commodity price snapshots (WFP, FEWS, RTP)
bun run collect:monthly    # + macro & trade (World Bank, IMF, Comtrade, FAOSTAT, Pink Sheet)
bun run collect:all        # every provider once (snapshots pull full history)
bun run collect:backfill   # like `all`, forex pulled from each source's earliest date
```

Run daily locally via cron, e.g.:

```cron
0 6 * * *  cd /path/to/currency && /usr/local/bin/bun run collect:daily >> collect.log 2>&1
```

Each task is isolated — one failing provider doesn't stop the rest; failures are logged
to `failed_dates.log` and a summary prints at the end.

## Historical depth (the "10-year profile")

| Domain | Depth available | Notes |
|--------|-----------------|-------|
| Commodity/food/livestock prices | **2000→** (WFP), 2001→ (FEWS), 1994→ (FAOSTAT), 1960→ (Pink Sheet) | well beyond 10 years; pulled in full by snapshots |
| Macro indicators | **1960→** (World Bank), incl. IMF forecasts to 2031 | full series each run |
| Trade flows | **2013→** (Comtrade; Ethiopia reports annually, ~1yr lag) | 12-year window by default |
| Forex — CBE | **2021→** (~5 yrs) | API floor; already collected |
| Forex — NBE | **2023-10→** | API returns empty before this; not available upstream |
| Forex — Zemen | **~2025-09→** | ajax errors on older dates; recent-only upstream |

> Forex history older than the floors above **does not exist** in these free public/bank
> sources — `collect:backfill` pulls each to its earliest available date. The 10-year+
> requirement is fully met for commodity, food, livestock, and macro data.

## Storage model

| Table | Holds | Filled by |
|-------|-------|-----------|
| `exchange_rates`, `gold_rates`, `rate_aggregates` | Forex & gold (original) | nbe, cbe, blackmarket, zemen, hibret |
| `commodity_prices` (+ `commodities`, `markets`) | Any price-per-unit, market or national | wfp, fewsnet, faostat, worldbank_pinksheet, worldbank_rtp, twomerkato |
| `economic_indicators` | Macro series (annual) | worldbank, imf |
| `trade_flows` | Annual export/import by HS code | comtrade |
| `commodity_aggregates` | Week/month/year roll-ups of commodity prices | computed on save |

Analysis views: `v_commodity_prices`, `v_latest_commodity_prices`,
`v_monthly_commodity_prices`, `v_latest_indicators`, `v_real_commodity_prices`
(CPI-deflated), `v_trade_summary`.

## Active providers

| Provider | Task | Source | Data | Auth | Cadence |
|----------|------|--------|------|------|---------|
| `wfp` | prices | HDX WFP Food Prices (CSV) | coffee, cereals, pulses, oil, fuel, **livestock/meat/milk/eggs/butter/honey**; 2000→, ETB+USD, 128 markets | none | weekly |
| `fewsnet` | prices | FEWS NET FDW API (JSON) | richest **livestock** incl. export-grade cattle/camel/sheep, grains; 2001→, weekly/monthly | none | weekly |
| `worldbank` | macro | World Bank Indicators API | CPI, inflation, GDP, FX, food/crop/livestock production, trade, debt… (22 series, annual) | none | monthly |
| `imf` | macro | IMF DataMapper | inflation + WEO forecasts to 2031 | none | monthly |
| `comtrade` | trade | UN Comtrade (preview) | detailed HS lines: **coffee (0901)**, **khat (1211)**, live animals/meat/**hides & leather (41/4104/4107)**/footwear (6403)/oilseeds/flowers/gold/**petroleum (2709/2710/2711)**; annual 2008→ | none | monthly |
| `comtrade` | basket | UN Comtrade (preview) | full import/export basket — all **HS 2-digit chapters** + grand **TOTAL** (for trade balance); annual 2008→ | none | monthly |
| `comtrade` | partners | UN Comtrade (preview) | **bilateral trade by partner country** (who ET trades with), TOTAL per partner; annual 2008→ | none | monthly |
| `realethio` | listings | realethio.com wp-json | current **housing & rent** listings (price, beds, size, area); accumulates forward | none | weekly |
| `realestate_hist` | historical | Zenodo 11205969 (CSV) | **2017–2024 housing & rent** (sale+rent, beds/size/geo); one-time historical seed | none¹ | once |
| `parallel` | rates | ethiopianforexrates.com | **parallel (black-market) FX** current rate per currency; accumulates forward | none | daily |
| `worldbank_pinksheet` | prices | WB Pink Sheet (xlsx) | global benchmark coffee arabica/robusta, gold, crude oil, tea, wheat…; 1960→ monthly | none | monthly |
| `faostat` | producer | HDX FAOSTAT (CSV) | national annual producer prices: meat/milk/eggs/honey + crops; 1994→ | none | monthly |
| `worldbank_rtp` | prices | HDX WB Real-Time Prices (CSV) | ML-imputed monthly market prices (6 commodities ET); 2007→ | none | weekly |
| `zemen` | daily | Zemen Bank (JSON ajax) | forex, **historical by date**, 8 currencies | none | daily |
| `hibret` | daily | Hibret Bank (HTML) | forex, today-only, 3 majors (USD/EUR/GBP) | env¹ | daily |
| `twomerkato` | ecx | 2merkato (HTML) | ECX **coffee & sesame** daily avg prices (ECX substitute) | none | weekly |

¹ `realestate_hist` downloads the 77 MB Zenodo CSV; if the host rate-limits, download it
once from https://zenodo.org/records/11205969 to `data/addis_realestate.csv` and re-run.

¹ Hibret ships an incomplete TLS chain. By default TLS is **verified** and the
provider fails gracefully if the chain can't be built. To collect its public rates
page anyway, run with `ALLOW_INSECURE_TLS=1` (opt-in; public read-only data only).
A plausibility bound rejects implausible rate values regardless.

## Validation & data quality

What guards the data between a remote source and the database. (Implementation lives in
`src/shared/`; see [ARCHITECTURE.md](ARCHITECTURE.md) for file locations.)

| Guard | Where | What it does |
|-------|-------|--------------|
| **Request timeout** | `shared/http.ts` (`FETCH_TIMEOUT_MS`, 30s) | Aborts any host that connects but never replies, so one stalled source (e.g. CBE) can't freeze the run. Surfaces as `timeout after Nms (url)` in `failed_dates.log`. |
| **Retry with backoff** | `shared/http.ts` | Transient HTTP/parse errors retry up to `MAX_RETRIES`; timeouts retry only `TIMEOUT_MAX_RETRIES` (a hanging host won't recover mid-run). |
| **HTTP / shape checks** | `shared/http.ts` | Non-2xx → error; JSON must be a non-null object; text/buffer responses must be non-empty — otherwise the row is rejected, not stored as garbage. |
| **Plausibility bounds** | `providers/hibret/exchange.ts` | A scraped forex rate must be `> 0` and `< 100000` ETB/unit, rejecting MITM/garbage values (relevant because Hibret is fetched over an unverified TLS chain). |
| **Finite-number filters** | `parallel`, `zemen`, `worldbank_pinksheet`, `realethio`, `shared/parse/*` | Non-numeric / `NaN` / `Infinity` / non-positive values are dropped at parse time rather than written. |
| **TLS verification** | `shared/config.ts` (`ALLOW_INSECURE_TLS`, default **off**) | Certificates are verified by default; a source with a broken chain fails gracefully unless you explicitly opt in (public read-only data only). |
| **Idempotent upserts** | `shared/database/save.ts` | Every write is `INSERT … ON CONFLICT(<natural key>) DO UPDATE`, so re-running a collector overwrites in place — no duplicate rows. |
| **Dedup / cache skip** | `shared/database/check.ts` | `hasExchangeData` / `hasTradeData` / counts let providers skip dates already collected, so re-runs are cheap and stable. |
| **Per-source isolation** | `collect.ts`, `cli.ts` | A failing provider/date is caught, logged to `failed_dates.log`, and the run continues — one bad source never corrupts or blocks the rest. |
| **Currency normalisation** | `providers/*/exchange.ts`, `seed.ts` | Rates are stored against seeded currency ids; USD-equivalent prices (`price_usd`) are derived where a source gives both local and USD. |

> Not yet enforced centrally: cross-source reconciliation (e.g. flagging when CBE and NBE
> disagree beyond a threshold) and per-series outlier detection. Plausibility bounds today
> are provider-local (Hibret); widening them is a known follow-up.

## Deferred / unavailable (documented, not silently skipped)

- **ECX (ecx.com.et)** — no public API/feed; site unreachable. Substituted by `twomerkato` (ECX data republished) + `wfp`.
- **Domestic khat prices** — do not exist in any structured source. Only khat **export** trade is collected (`comtrade`, HS 1211), which is known to undercount overland trade ~50×.
- **A full decade of black-market FX** — no free source has 2014→ parallel rates. `parallel` captures the current rate forward (daily), and the official-vs-parallel premium is available 2023→ via `v_informal_fx_premium`. Deeper history isn't available upstream.
- **Housing/rent price index** — no official ET house-price index exists (CSA/World Bank/BIS have none). We build our own series from `realestate_hist` (2017–2024) + ongoing `realethio` snapshots.
- **Hides & skins prices** — no market time-series; only FAOSTAT annual producer prices (via `faostat`).
- **ESS / CSA CPI** — PDF-only; replaced by `worldbank` + `imf`.
- **IMF DataMapper** — provider built, but the host is Akamai-blocked from some IPs (returns Access Denied). Overlaps `worldbank`; may work from CI runners.
- **Bank of Abyssinia, Coop Bank Oromia** — forex rendered client-side (JS); not in static HTML. Need a headless browser to scrape.
- **Dashen Bank** — blocks scrapers (HTTP 403). Needs a headless browser / different access.
- **Awash Bank** — WP-ajax endpoint is nonce-gated.
- **Trading Economics, WFP DataBridges, ICO** — paid / key-gated; free equivalents used instead.

## Analysis & reporting

- **Deep-dive views** (in the schema): `v_trade_balance`, `v_top_exports`, `v_top_imports`,
  `v_leather_trade`, `v_petroleum_trade`, `v_informal_fx_premium`, plus the price views
  `v_commodity_prices`, `v_latest_commodity_prices`, `v_monthly_commodity_prices`,
  `v_real_commodity_prices`, `v_latest_indicators`.
- **Ready-made query packs**: `sqlite3 data/db/trade.db < analysis/trade_deep_dive.sql` and
  `sqlite3 data/db/currency.db < analysis/informal_market.sql` (the latter attaches
  `trade.db` for the khat-export proxy).
- **Profile report**: `bun run report` regenerates a concise `data/db/<domain>.md` per
  database (tables, columns, sources, spans, breakdown) plus the `DATA_PROFILE.md` index —
  descriptors, not row dumps — for a downstream research/analysis agent to pick up.

## Automation

`.github/workflows/{daily,weekly,monthly}.yml` run the collectors on schedule and
commit the updated database. Daily = forex (today-only sources need daily runs);
weekly = food/commodity prices; monthly = macro & trade.
