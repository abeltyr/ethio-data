# `prices.db` — Ethiopia data warehouse

_Auto-generated 2026-06-29 14:20 UTC by `src/report.ts`. File: `data/db/prices.db`._

Food / commodity / livestock prices in long format, plus week/month/year roll-ups. Source/provenance detail: see `DATA_SOURCES.md`.

## Sources

| source | name | rows (primary table) | span | last fetched |
| --- | --- | --- | --- | --- |
| wfp | WFP Food Prices (Ethiopia) | 60,289 | 2000-01-15 → 2026-03-15 | 2026-06-29 11:31:26 |
| fewsnet | FEWS NET Market Prices | 46,161 | 2001-07-31 → 2026-04-30 | 2026-06-29 11:31:26 |
| worldbank_pinksheet | World Bank Pink Sheet (Global Benchmarks) | 7,666 | 1960-01-15 → 2026-05-15 | 2026-06-29 11:31:26 |
| faostat | FAOSTAT Producer Prices (Ethiopia) | 984 | 1994-12-31 → 2018-12-31 | 2026-06-29 11:31:26 |
| worldbank_rtp | World Bank Real-Time Prices (Ethiopia, est.) | 19,874 | 2007-01-01 → 2026-04-01 | 2026-06-29 11:31:26 |
| twomerkato | 2merkato (ECX Daily Trade Data) | 27 | 2026-04-29 → 2026-05-08 | 2026-06-29 11:31:26 |

## Tables

| table | rows | span | columns (type) |
| --- | --- | --- | --- |
| `commodities` | 207 | — | id TEXT, code TEXT, name TEXT, category TEXT, unit TEXT |
| `commodity_aggregates` | 61,877 | 1960 → 2026-05 | id TEXT, provider_id TEXT, commodity_id TEXT, market_id TEXT, price_type TEXT, period_type TEXT, period_value TEXT, avg_price REAL, min_price REAL, max_price REAL, avg_price_usd REAL, price_count INTEGER, updated_at TEXT |
| `commodity_prices` | 135,001 | 1960-01-15 → 2026-05-15 | id TEXT, provider_id TEXT, commodity_id TEXT, market_id TEXT, date TEXT, price REAL, currency TEXT, price_usd REAL, price_type TEXT, unit TEXT, created_at TEXT |
| `fetch_log` | 6 | 2026-06-29 11:31:26 → 2026-06-29 11:31:26 | provider TEXT, task TEXT, unit TEXT, status TEXT, rows INTEGER, fetched_at TEXT |
| `markets` | 328 | — | id TEXT, name TEXT, admin1 TEXT, admin2 TEXT, latitude REAL, longitude REAL, country TEXT |
| `providers` | 17 | — | id TEXT, name TEXT, type TEXT, api_url TEXT |

## Breakdown

Markets: 328, commodities: 207.

| Category | Commodities | Prices |
| --- | --- | --- |
| cereal | 58 | 73,336 |
| livestock | 21 | 25,158 |
| other | 29 | 9,949 |
| pulse | 24 | 9,314 |
| vegetable | 28 | 4,877 |
| fuel | 6 | 3,880 |
| oilseed | 15 | 3,224 |
| coffee | 6 | 2,597 |
| dairy | 2 | 1,110 |
| metal | 1 | 797 |
| meat | 10 | 647 |
| fruit | 7 | 112 |

## Querying

```bash
sqlite3 data/db/prices.db "SELECT * FROM commodity_prices LIMIT 5;"
```

CPI-deflated (real) prices need the macro DB — attach it:
```sql
ATTACH 'data/db/macro.db' AS macro;
SELECT p.date, c.name, p.price AS nominal_etb,
       ROUND(p.price / cpi.value * 100, 4) AS real_etb_2010
FROM commodity_prices p JOIN commodities c ON c.id=p.commodity_id
JOIN macro.economic_indicators cpi ON cpi.indicator_code='FP.CPI.TOTL'
  AND cpi.provider_id='worldbank' AND cpi.period=substr(p.date,1,4)
WHERE p.currency='ETB' LIMIT 20;
```
