# `property.db` — Ethiopia data warehouse

_Auto-generated 2026-06-29 14:20 UTC by `src/report.ts`. File: `data/db/property.db`._

Addis Ababa housing & rent listings (historical 2017–2024 + ongoing snapshots). Source/provenance detail: see `DATA_SOURCES.md`.

## Sources

| source | name | rows (primary table) | span | last fetched |
| --- | --- | --- | --- | --- |
| realethio | realethio.com Property Listings | 1,770 | 2020-12-27 → 2026-06-17 | 2026-06-29 11:31:27 |
| realestate_hist | Addis Ababa Real Estate (Zenodo 2017–2024) | 85,400 | 2017-01-14 → 2024-04-14 | 2026-06-29 11:31:27 |

## Tables

| table | rows | span | columns (type) |
| --- | --- | --- | --- |
| `fetch_log` | 2 | 2026-06-29 11:31:27 → 2026-06-29 11:31:27 | provider TEXT, task TEXT, unit TEXT, status TEXT, rows INTEGER, fetched_at TEXT |
| `property_prices` | 87,170 | 2017-01-14 → 2026-06-17 | id TEXT, provider_id TEXT, source TEXT, listing_type TEXT, property_type TEXT, region TEXT, area TEXT, bedrooms INTEGER, bathrooms INTEGER, size_sqm REAL, price REAL, currency TEXT, price_sqm REAL, latitude REAL, longitude REAL, listed_date TEXT, collected_at TEXT, created_at TEXT |
| `providers` | 17 | — | id TEXT, name TEXT, type TEXT, api_url TEXT |

## Breakdown

Regions: 1.

| Listing type | Listings |
| --- | --- |
| sale | 70,069 |
| rent | 17,101 |

## Querying

```bash
sqlite3 data/db/property.db "SELECT * FROM property_prices LIMIT 5;"
```
