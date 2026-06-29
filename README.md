# Ethiopia Economic Data Warehouse

Collects Ethiopia-related economic time-series — forex, commodity & food prices, macro
indicators, trade flows, housing — from public and private sources into **per-domain SQLite
databases** under `data/db/` (`currency.db`, `prices.db`, `macro.db`, `trade.db`,
`property.db`). A fetch ledger means re-runs only pull what's missing. Plain TypeScript on
[Bun](https://bun.com); no build step.

## Quick start

```bash
bun install
bun run collect:daily      # forex (incremental) + ECX — cheap, daily cron
bun run collect:weekly     # + food / commodity prices
bun run collect:monthly    # + macro & trade
bun run collect:all        # every provider; still skips anything already in the fetch ledger
bun run report             # regenerate per-domain data/db/*.md docs + DATA_PROFILE.md index
```

Re-runs never re-fetch data already recorded in the ledger — not even `collect:all`. To force
a full re-pull (e.g. suspected bad data), run `FORCE_REFETCH=1 bun run collect:all`.

Migrating from the old single `exchange_rates.db`? Run `bun run split` once to split it into
`data/db/*.db` and seed the fetch ledger (non-destructive — the old file is left in place).

Run a single source: `bun run src/cli.ts <provider> <task> [start] [end]`
(e.g. `bun run src/cli.ts cbe daily 2025-01-01 2025-01-31`). `bun start --help` lists all
providers and tasks.

`collect` shows live progress per step, isolates failures (one bad source never stops the
rest), bounds every request with a timeout so a hanging host can't freeze the run, and
logs failures to `failed_dates.log`.

## Documentation

| Doc | Read it for |
|-----|-------------|
| **[ARCHITECTURE.md](ARCHITECTURE.md)** | How the code is wired, how to run it, where to go to fix what, how to add a provider, env-var config, the DB schema. |
| **[DATA_SOURCES.md](DATA_SOURCES.md)** | What data exists, where each source comes from, how it's validated, and how far back it goes. |
| **[DATA_PROFILE.md](DATA_PROFILE.md)** | Auto-generated index across the domain DBs; each `data/db/<domain>.md` describes that DB's tables, sources, and breakdown. Regenerate with `bun run report`. |

## Configuration

Copy `.env.example` to `.env` to tune timeouts, retries, rate limits, and the DB path.
The most important knob: `FETCH_TIMEOUT_MS` (default 30s) caps every HTTP attempt so an
unresponsive host fails fast instead of hanging. See ARCHITECTURE.md §6 for the full list.
