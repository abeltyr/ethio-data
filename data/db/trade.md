# `trade.db` — Ethiopia data warehouse

_Auto-generated 2026-06-29 11:01 UTC by `src/report.ts`. File: `data/db/trade.db`._

Annual export/import flows by HS code, chapter, and bilateral partner. Source/provenance detail: see `DATA_SOURCES.md`.

## Sources

| source | name | rows (primary table) | span | last fetched |
| --- | --- | --- | --- | --- |
| comtrade | UN Comtrade (Ethiopia Trade) | 5,490 | 2008 → 2023 | 2026-06-29 11:00:57 |

## Tables

| table | rows | span | columns (type) |
| --- | --- | --- | --- |
| `fetch_log` | 48 | 2026-06-29 11:00:57 → 2026-06-29 11:00:57 | provider TEXT, task TEXT, unit TEXT, status TEXT, rows INTEGER, fetched_at TEXT |
| `providers` | 17 | — | id TEXT, name TEXT, type TEXT, api_url TEXT |
| `trade_flows` | 5,490 | 2008 → 2023 | id TEXT, provider_id TEXT, reporter TEXT, partner TEXT, partner_code TEXT, commodity_hs TEXT, commodity_desc TEXT, flow TEXT, period TEXT, period_type TEXT, value_usd REAL, qty REAL, qty_unit TEXT, created_at TEXT |

## Breakdown

HS 2-digit chapters: 96. Bilateral partners: 207. Flows: export & import. Aggregate rows use `commodity_hs='TOTAL'`, `partner_code='0'` = World.

## Querying

```bash
sqlite3 data/db/trade.db "SELECT * FROM trade_flows LIMIT 5;"
```
