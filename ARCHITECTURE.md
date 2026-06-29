# Architecture & Developer Guide

How this project is wired, where to change things, and how to run it. For *what data
exists and where it comes from*, see **[DATA_SOURCES.md](DATA_SOURCES.md)**.

> **Monorepo note:** this repo is now a Turborepo (see **[MONOREPO.md](MONOREPO.md)**). Paths
> below written as `src/…` now live under `apps/collector/src/…`, and the database/schema/
> ledger modules under `packages/database/src/…`. The wiring and behaviour are unchanged.

---

## 1. What this is

A collection of **providers** that each fetch one public/private economic dataset about
Ethiopia, normalise it, and store it in a **per-domain SQLite database** under `data/db/`
(`currency.db`, `prices.db`, `macro.db`, `trade.db`, `property.db`). A provider writes only
to its domain's DB; which domain is set by the `domain` field in `registry.ts`. A **fetch
ledger** (`fetch_log` table in each DB) records what has already been pulled so re-runs only
fetch what's missing. Everything is plain TypeScript run by [Bun](https://bun.com) — no build
step, no server.

```
collect.ts (orchestrator)          cli.ts (one provider)
        │                                  │
        ▼                                  ▼
   PLAN of steps  ──────────────►  registry.ts  (provider configs: URLs, tasks)
        │                                  │
        ▼                                  ▼
   dispatch.ts  ───────────────►  executors[id]  ──►  providers/<id>/*.ts
                                                              │ fetch + parse + map
                                          shared/http.ts ◄────┤ (timeout + retry)
                                          shared/parse/* ◄────┤ (csv / html / xlsx)
                                                              ▼
                                          shared/database/save.ts  ──►  SQLite tables
```

The data flow for every provider is the same: **fetch → parse → map to a shared type →
upsert**. Only the fetch/parse details differ per source.

---

## 2. How to run it

Requires Bun. Install once: `bun install`.

| Command | What it does |
|---------|--------------|
| `bun run collect:daily` | Forex (incremental, ~last 7 days) + ECX. Cheap; for a daily cron. |
| `bun run collect:weekly` | Daily + food/commodity price snapshots (WFP, FEWS, RTP). |
| `bun run collect:monthly` | Weekly + macro & trade (World Bank, IMF, Comtrade, FAOSTAT, Pink Sheet). |
| `bun run collect:all` | Every provider once; snapshots pull full history. |
| `bun run collect:backfill` | Like `all`, but forex pulled from each source's earliest date. |
| `bun run src/cli.ts <provider> <task> [start] [end]` | Run **one** provider/task. Dates `YYYY-MM-DD`. |
| `bun start` (or `--help`) | Prints every provider and its tasks. |
| `bun run report` | Regenerates the per-domain `data/db/<domain>.md` docs + the `DATA_PROFILE.md` index. |
| `bun run split` | One-time: split a legacy `exchange_rates.db` into `data/db/*.db` and seed the ledger. |
| `bun run typecheck` | `tsc --noEmit`. Run before committing. |

Per-provider shortcuts also exist in `package.json` (e.g. `bun run fetch:cbe`,
`bun run fetch:macro`). `bun run start -h` lists providers/tasks.

**Progress & timeouts.** `collect` prints a live progress line per step:
`▶ [3/7] cbe daily` then `[i/N] <date> — <saved> saved, <failed> failed`. A `⏳ 8s`
marker appears when a single call runs long, so a stalled host is obvious instead of
silent. Snapshot steps show a `working… <elapsed>` heartbeat. Every step ends with a
record count and elapsed time. On a TTY the line updates in place; in CI logs it prints
a fresh line every ~15s.

Every HTTP attempt is capped at `FETCH_TIMEOUT_MS` (default 30s) — see §6. A failing
step never stops the others; failures are appended to `failed_dates.log` and summarised
at the end.

---

## 3. Directory map — what lives where

| Path | Responsibility |
|------|----------------|
| `src/collect.ts` | Orchestrator. The `PLAN` array decides which providers run in `daily/weekly/monthly/all/backfill`. Owns progress + per-step error isolation. |
| `src/cli.ts` | Run a single provider/task by name with an optional date range. |
| `src/report.ts` | Reads each domain DB and writes a concise `data/db/<domain>.md` plus the `DATA_PROFILE.md` index. Pure read; safe to run anytime. |
| `src/migrate_split.ts` | One-time `bun run split`: splits the legacy `exchange_rates.db` into the per-domain DBs and seeds the fetch ledger. Non-destructive. |
| `src/import_blackmarket.ts` | One-off importer for `data/blackmarket.json`. |
| `src/providers/registry.ts` | **Source of truth for every provider**: id, name, `api_url`, and its `tasks` (with endpoints). Add a provider's config here. |
| `src/providers/dispatch.ts` | Maps `provider id → executor function`. Add a provider's wiring here. |
| `src/providers/<id>/` | Per-provider code. `index.ts` exposes `execute<Id>Task(...)`; sibling files (`exchange.ts`, `prices.ts`, `trade.ts`…) do the fetch/parse/map. |
| `src/shared/http.ts` | `fetchWithRetry` / `fetchTextWithRetry` / `fetchBufferWithRetry`. Timeout + retry + default headers live here — the single network chokepoint. |
| `src/shared/progress.ts` | `startHeartbeat()` / `formatElapsed()` — the live progress line. |
| `src/shared/config.ts` | All env-var knobs and `logFailed()`. |
| `src/shared/database/schema/*.ts` | Per-domain schema modules: `common.ts` (`providers` + `fetch_log`, in every DB), `currency/prices/macro/trade/property.ts` (that domain's tables, indexes, and within-domain views). |
| `src/shared/database/save.ts` | `upsert*` / `save*` functions — every write goes through here (idempotent `ON CONFLICT` upserts). |
| `src/shared/database/ledger.ts` | The fetch ledger: `recordFetch` / `wasFetched` / `shouldSkipDate` / `shouldSkipYear` / `isFresh` over `fetch_log` — the dedup/skip checks. |
| `src/shared/database/seed.ts` | Seeds providers/currencies/commodities/markets and returns their ids. |
| `src/shared/database/index.ts` | `getDb(domain)` / `getProviderDb(id)` (open + apply schema, cached per domain), `closeDatabase()`, `dbPath()`. |
| `src/shared/parse/` | `csv.ts`, `html.ts` (cheerio), `xlsx.ts` parsers shared across providers. |
| `src/shared/aggregates.ts`, `commodity_aggregates.ts` | Week/month/year roll-ups computed on save. |
| `src/shared/types.ts`, `provider_types.ts` | The shared row types (`ExchangeRate`, `CommodityPrice`, `TradeFlow`, `ProviderConfig`…). |
| `analysis/*.sql` | Ready-made query packs: `sqlite3 exchange_rates.db < analysis/<file>.sql`. |
| `.github/workflows/{daily,weekly,monthly}.yml` | CI that runs the collectors on schedule and commits the updated DB. |

---

## 4. "Where do I go to fix…?"

| Symptom | Look at |
|---------|---------|
| A fetch hangs / the whole run freezes | `src/shared/http.ts` (timeout) + tune `FETCH_TIMEOUT_MS`. This was the CBE freeze. |
| One provider returns 403 / empty / wrong shape | `src/providers/<id>/*.ts` (the parse/map), then its entry in `registry.ts` (URL/endpoint). |
| "No progress, can't tell if it's working" | `src/collect.ts` (heartbeat wiring) + `src/shared/progress.ts`. |
| A new column / table is needed | the relevant `src/shared/database/schema/<domain>.ts` (add to `CREATE TABLE`), then `save.ts`. |
| Duplicate rows / re-fetching cached units | `src/shared/database/ledger.ts` (the `shouldSkip*` / `isFresh` checks) + the `ON CONFLICT` keys in `save.ts`. |
| A source's data lands in the wrong DB | the `domain` field of its `ProviderConfig` in `registry.ts`. |
| A snapshot re-downloads too often / not often enough | the `cadence` of its step in the `PLAN` in `src/collect.ts`. |
| Change what runs in daily/weekly/monthly | The `groups` field of each step in the `PLAN` in `src/collect.ts`. |
| Change earliest backfill date for a forex source | The `floor` field of that step in `PLAN`. |
| Add/adjust an analysis view | `src/shared/database/tables.ts` (the `CREATE VIEW` block). |
| Rate limited / throttled by a host | `RATE_LIMIT_MS`, `MAX_RETRIES`, `RETRY_DELAY_MS` in `config.ts` / env. |
| TLS / cert errors from a bank site | `ALLOW_INSECURE_TLS=1` (opt-in, public read-only only). See `config.ts`. |

---

## 5. Adding a new provider

1. **Config** — add a `ProviderConfig` to `src/providers/registry.ts` (id, `domain`,
   `api_url`, `tasks`) and register it in the `REGISTRY` map. `domain` decides which
   `data/db/<domain>.db` it writes to; if it's a new domain, add a `schema/<domain>.ts`
   module and wire it into the `SCHEMA` map in `shared/database/index.ts`.
2. **Implementation** — create `src/providers/<id>/<id>.ts` (or `prices.ts` etc.) that
   opens its DB with `getProviderDb("<id>")`, fetches via `shared/http.ts`, parses via
   `shared/parse/*`, maps rows to a shared type (`shared/types.ts`), seeds ids
   (`shared/database/seed.ts`), and saves (`shared/database/save.ts`). For dated/year
   loops, skip via `shouldSkipDate`/`shouldSkipYear` and `recordFetch` per unit
   (`shared/database/ledger.ts`); whole-file snapshots are stamped by `collect.ts`. Expose
   `execute<Id>Task(task, ctx)` from `src/providers/<id>/index.ts`.
3. **Dispatch** — add `<id>: (task, ctx) => execute<Id>Task(...)` to
   `src/providers/dispatch.ts`.
4. **Schedule (optional)** — add a step to the `PLAN` in `src/collect.ts` with the right
   `kind` (`forex` = one call per day; `fewsnet`/`trade` = dated snapshot;
   `snapshot` = pulls its own full dataset), `groups`, and (for snapshots) a `cadence`
   freshness window.
5. **Script (optional)** — add a `fetch:<id>` entry to `package.json`.

Return the **record count** from every executor — `collect`/`cli` print and sum it.

---

## 6. Configuration (env vars)

Set in `.env` (see `.env.example`) or inline: `FETCH_TIMEOUT_MS=10000 bun run collect:daily`.

| Var | Default | Effect |
|-----|---------|--------|
| `FETCH_TIMEOUT_MS` | `30000` | Hard cap per HTTP attempt. A host that connects but never replies is aborted after this (→ `TimeoutError`). **This is what keeps a hanging host — like CBE — from freezing the run.** |
| `TIMEOUT_MAX_RETRIES` | `1` | Retry budget for *timeouts* specifically (a hanging host rarely recovers mid-run, and each retry costs a full timeout). |
| `MAX_RETRIES` | `5` | Retry budget for ordinary (transient) HTTP/parse errors. |
| `RETRY_DELAY_MS` | `2000` | Sleep between retries. |
| `RATE_LIMIT_MS` | `500` | Sleep after each successful request (politeness). |
| `FETCH_TIMEOUT_MS` + `MAX_RETRIES` worst case | — | A fully-down host costs ≈ `(TIMEOUT_MAX_RETRIES+1) × FETCH_TIMEOUT_MS` per URL, then the run moves on. |
| `ALLOW_INSECURE_TLS` | off | Opt-in: collect from hosts with a broken TLS chain (e.g. Hibret). Public read-only data only. |
| `DB_DIR` | `data/db` | Directory holding the per-domain SQLite files. |
| `DB_PATH` | `exchange_rates.db` | Legacy single-file warehouse; only read by `bun run split`. |
| `LOG_FILE` | `failed_dates.log` | Where `logFailed()` appends `timestamp | provider | date | reason`. |
| `START_DATE` / `END_DATE` | — | Default date range for `cli.ts` when not passed as args. |
| `PROVIDER_ID` / `PROVIDER_TASK` | `nbe` / `daily` | Default provider/task for `cli.ts`. |

---

## 7. Database

Data is split into one SQLite file per **domain** under `data/db/`. `getDb(domain)`
(`shared/database/index.ts`) opens the file, applies `schema/common.ts` + the domain's
`schema/<domain>.ts` (tables, indexes, within-domain views), and caches one handle per
domain. Provider code uses `getProviderDb(id)`, which resolves the domain from `registry.ts`.

| Domain DB | Tables | Filled by |
|-----------|--------|-----------|
| `currency.db` | `exchange_rates`, `gold_rates`, `rate_aggregates`, `currencies`, `gold_types` | nbe, cbe, zemen, hibret, blackmarket, parallel |
| `prices.db` | `commodity_prices`, `commodity_aggregates`, `commodities`, `markets` | wfp, fewsnet, faostat, worldbank_pinksheet, worldbank_rtp, twomerkato |
| `macro.db` | `economic_indicators` | worldbank, imf |
| `trade.db` | `trade_flows` | comtrade |
| `property.db` | `property_prices` | realethio, realestate_hist |

Every DB also has `providers` and a `fetch_log` (the ledger). **Aggregates** are week/month/
year roll-ups computed on save.

**Analysis views** live in their domain's schema module and are queried via `sqlite3` or the
`analysis/*.sql` packs: within `prices.db` — `v_commodity_prices`,
`v_latest_commodity_prices`, `v_monthly_commodity_prices`; `macro.db` — `v_latest_indicators`;
`trade.db` — `v_trade_summary`, `v_trade_balance`, `v_top_exports`, `v_top_imports`,
`v_leather_trade`, `v_petroleum_trade`, `v_top_trade_partners`; `currency.db` —
`v_informal_fx_premium`; `property.db` — `v_housing_summary`, `v_housing_monthly`. The one
cross-domain analysis (CPI-deflated real prices = `prices` × `macro`) is done with `ATTACH`
— see `data/db/prices.md`.

Writes are **idempotent**: every `upsert*` uses `ON CONFLICT(...) DO UPDATE`, so re-running
a collector overwrites rather than duplicates. Re-runs are also cheap because the fetch
ledger (`ledger.ts`) skips dates/years already pulled and snapshots still inside their
`cadence` window.

---

## 8. Automation (CI)

`.github/workflows/{daily,weekly,monthly}.yml` run the matching `collect` group on a cron
and commit the updated `data/db/*.db`:

- **daily** — forex (today-only sources must run daily to build history),
- **weekly** — + food/commodity prices,
- **monthly** — + macro & trade.

Each job runs providers with `|| true` so one failure doesn't fail the commit.

---

## 9. Troubleshooting

- **A provider "hangs" / the run sits silent** — the host is accepting the connection but
  not responding. The per-attempt timeout (§6) now aborts it; lower `FETCH_TIMEOUT_MS`
  to fail faster. Check `failed_dates.log` for `timeout after Nms (url)`.
- **CBE returns only timeouts** — CBE's `/cbeapi/` endpoint is unresponsive server-side
  (verifiable: `curl -m 10 'https://combanketh.et/cbeapi/daily-exchange-rates/?_limit=1&Date=2025-01-01'`
  connects then hangs, while `https://combanketh.et/home` returns 200). Nothing to fix in
  code — collection resumes automatically when CBE's server recovers.
- **Fresh DB / `duplicate column name`** — migrations are additive and must match the
  `CREATE TABLE` columns; if you add a column, add it in **both** places in `tables.ts`.
- **Hibret / TLS errors** — run with `ALLOW_INSECURE_TLS=1` (opt-in).
- **IMF "Access Denied"** — Akamai blocks some IPs; overlaps World Bank. Often works from
  CI runners.
