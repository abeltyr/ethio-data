# Ethiopia Economic Data Warehouse — Data Profile

_Auto-generated 2026-06-29 11:01 UTC by `src/report.ts`. Per-domain SQLite files under `data/db/`._

Data is split into domain databases. Each `data/db/<domain>.db` has a matching
`data/db/<domain>.md` describing its tables, sources, and breakdown. Regenerate with `bun run report`.

## Databases

| domain DB | tables | rows | span | doc |
| --- | --- | --- | --- | --- |
| `data/db/currency.db` | 7 | 61,902 | 2021-04-29 → 2026-06-29 | `data/db/currency.md` |
| `data/db/prices.db` | 6 | 197,436 | 1960-01-15 → 2026-05-15 | `data/db/prices.md` |
| `data/db/macro.db` | 3 | 973 | 1960 → 2025 | `data/db/macro.md` |
| `data/db/trade.db` | 3 | 5,555 | 2008 → 2023 | `data/db/trade.md` |
| `data/db/property.db` | 3 | 87,189 | 2017-01-14 → 2026-06-17 | `data/db/property.md` |

## Trade balance (USD)

| Year | Exports | Imports | Balance | Coverage % |
| --- | --- | --- | --- | --- |
| 2008 | $0.86B | $8.57B | $-7.71B | 10% |
| 2009 | $0.91B | $7.94B | $-7.03B | 11.4% |
| 2010 | $1.33B | $8.60B | $-7.27B | 15.5% |
| 2011 | $1.75B | $9.15B | $-7.40B | 19.1% |
| 2012 | $1.98B | $12.41B | $-10.43B | 16% |
| 2013 | $1.87B | $12.08B | $-10.21B | 15.5% |
| 2014 | $2.31B | $16.72B | $-14.41B | 13.8% |
| 2015 | $2.02B | $17.69B | $-15.66B | 11.4% |
| 2016 | $1.99B | $17.45B | $-15.46B | 11.4% |
| 2017 | $2.31B | $15.76B | $-13.45B | 14.6% |
| 2018 | $1.55B | $14.99B | $-13.44B | 10.3% |
| 2019 | $2.68B | $15.53B | $-12.85B | 17.3% |
| 2020 | $2.53B | $14.09B | $-11.56B | 18% |
| 2021 | $3.06B | $15.28B | $-12.23B | 20% |
| 2022 | $3.09B | $16.54B | $-13.45B | 18.7% |
| 2023 | $2.86B | $17.05B | $-14.19B | 16.8% |

## Signature exports — value trend (USD millions)

| Commodity | 2016 | 2017 | 2018 | 2019 | 2020 | 2021 | 2022 | 2023 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Coffee (0901) | 611.9 | 782.7 | 377 | 797.2 | 798 | 1189.2 | 1513.9 | 1225.6 |
| Khat (1211) | 2.2 | 2.1 | 2.9 | 5.5 | 4.8 | 3.6 | 4.4 | 4.3 |
| Hides/leather (ch.41) | 68.6 | 77 | 50.4 | 59.7 | 27.9 | 28.7 | 24.3 | 20.3 |

## Informal market — parallel FX premium

Parallel (black-market) vs official rate. A persistent positive premium signals FX scarcity.

| Currency | Avg premium % | Min % | Max % | Months |
| --- | --- | --- | --- | --- |
| SAR | 58.4 | -3.9 | 135.9 | 41 |
| AED | 57.5 | -3.7 | 116.5 | 41 |
| CHF | 52.7 | -3.6 | 106.7 | 41 |
| KWD | 52.6 | -4.5 | 106.9 | 41 |
| EUR | 52.6 | -4.9 | 106.9 | 41 |
| GBP | 52.3 | -3.5 | 106.9 | 41 |
| CAD | 52.2 | -3.5 | 107 | 41 |
| AUD | 52.2 | -3.8 | 106.9 | 41 |

## Cross-domain analysis

CPI-deflated real commodity prices span the `prices` and `macro` DBs — see the ATTACH
query in `data/db/prices.md`. Ready-made packs: `analysis/informal_market.sql` (currency.db),
`analysis/trade_deep_dive.sql` (trade.db).

## Collecting / refreshing

```bash
bun run collect:daily      # forex + ECX (daily cron); skips already-fetched units
bun run collect:all        # every provider once; ignores freshness window
bun run report             # regenerate these docs
bun run split              # one-time: split legacy exchange_rates.db into data/db/*.db
```

Provider/source detail, cadence, and known gaps: see `DATA_SOURCES.md`.
