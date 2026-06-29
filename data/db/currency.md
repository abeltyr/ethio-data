# `currency.db` — Ethiopia data warehouse

_Auto-generated 2026-06-29 11:01 UTC by `src/report.ts`. File: `data/db/currency.db`._

Daily official & parallel (black-market) FX rates and gold prices. Source/provenance detail: see `DATA_SOURCES.md`.

## Sources

| source | name | rows (primary table) | span | last fetched |
| --- | --- | --- | --- | --- |
| nbe | National Bank of Ethiopia | 11,608 | 2023-10-08 → 2026-06-29 | 2026-06-29 11:00:55 |
| cbe | Commercial Bank of Ethiopia | 26,685 | 2021-04-29 → 2026-06-19 | 2026-06-29 11:00:55 |
| blackmarket | Black Market | 861 | 2023-01-15 → 2026-05-15 | 2026-06-29 11:00:55 |
| zemen | Zemen Bank | 1,892 | 2025-09-22 → 2026-06-19 | 2026-06-29 11:00:55 |
| hibret | Hibret Bank | 3 | 2026-06-17 → 2026-06-17 | 2026-06-29 11:00:55 |
| parallel | Parallel (black-market) FX | 10 | 2026-06-17 → 2026-06-20 | 2026-06-29 11:00:55 |

## Tables

| table | rows | span | columns (type) |
| --- | --- | --- | --- |
| `currencies` | 30 | — | id TEXT, code TEXT, name TEXT |
| `exchange_rates` | 41,059 | 2021-04-29 → 2026-06-29 | id TEXT, provider_id TEXT, currency_id TEXT, date TEXT, buying REAL, selling REAL, weighted_average REAL, buying_rate REAL, selling_rate REAL, cash_buying REAL, cash_selling REAL, transaction_buying REAL, transaction_selling REAL, avg_buying_rate REAL, avg_selling_rate REAL, created_at TEXT |
| `fetch_log` | 2,820 | 2026-06-29 11:00:55 → 2026-06-29 11:00:55 | provider TEXT, task TEXT, unit TEXT, status TEXT, rows INTEGER, fetched_at TEXT |
| `gold_rates` | 6,017 | 2023-12-17 → 2026-06-29 | id TEXT, gold_type_id TEXT, price_usd REAL, price_birr REAL, date TEXT, created_at TEXT |
| `gold_types` | 11 | — | id TEXT, karat TEXT, level TEXT |
| `providers` | 17 | — | id TEXT, name TEXT, type TEXT, api_url TEXT |
| `rate_aggregates` | 11,948 | 2021 → 2026-W27 | id TEXT, provider_id TEXT, currency_id TEXT, period_type TEXT, period_value TEXT, avg_buying REAL, avg_selling REAL, avg_weighted REAL, min_buying REAL, max_buying REAL, min_selling REAL, max_selling REAL, rate_count INTEGER, updated_at TEXT |

## Breakdown

Currencies tracked (top by observations): USD (2,273), GBP (2,273), EUR (2,272), CAD (2,271), SEK (2,270), AED (2,188), NOK (2,186), CHF (2,186), SAR (2,002), KES (2,002), JPY (2,002), INR (2,002).

Gold observations: 6,017.

## Querying

```bash
sqlite3 data/db/currency.db "SELECT * FROM exchange_rates LIMIT 5;"
```
