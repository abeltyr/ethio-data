# `macro.db` — Ethiopia data warehouse

_Auto-generated 2026-06-29 14:20 UTC by `src/report.ts`. File: `data/db/macro.db`._

Annual macroeconomic indicator series for Ethiopia. Source/provenance detail: see `DATA_SOURCES.md`.

## Sources

| source | name | rows (primary table) | span | last fetched |
| --- | --- | --- | --- | --- |
| worldbank | World Bank Indicators | 955 | 1960 → 2025 | 2026-06-29 11:31:26 |
| imf | IMF DataMapper (WEO) | 0 | — | — |

## Tables

| table | rows | span | columns (type) |
| --- | --- | --- | --- |
| `economic_indicators` | 955 | 1960 → 2025 | id TEXT, provider_id TEXT, indicator_code TEXT, indicator_name TEXT, area TEXT, period TEXT, period_type TEXT, value REAL, unit TEXT, created_at TEXT |
| `fetch_log` | 2 | 2026-06-29 11:31:26 → 2026-06-29 12:14:50 | provider TEXT, task TEXT, unit TEXT, status TEXT, rows INTEGER, fetched_at TEXT |
| `providers` | 17 | — | id TEXT, name TEXT, type TEXT, api_url TEXT |

## Breakdown

Distinct indicators: 22. Codes: `AG.PRD.CROP.XD`, `AG.PRD.FOOD.XD`, `AG.PRD.LVSK.XD`, `BN.CAB.XOKA.CD`, `BX.KLT.DINV.CD.WD`, `DT.DOD.DECT.CD`, `EG.ELC.ACCS.ZS`, `FM.LBL.BMNY.GD.ZS`, `FP.CPI.TOTL`, `FP.CPI.TOTL.ZG`, `FR.INR.LEND`, `NE.EXP.GNFS.CD`, `NE.IMP.GNFS.CD`, `NV.AGR.TOTL.ZS`, `NY.GDP.MKTP.CD`, `NY.GDP.MKTP.KD.ZG`, `NY.GDP.PCAP.CD`, `NY.GNP.PCAP.CD`, `PA.NUS.FCRF`, `SI.POV.GINI`, `SL.UEM.TOTL.ZS`, `SP.POP.TOTL`.

## Querying

```bash
sqlite3 data/db/macro.db "SELECT * FROM economic_indicators LIMIT 5;"
```
