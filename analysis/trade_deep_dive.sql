-- ============================================================================
-- Ethiopia Trade Deep-Dive  (run: sqlite3 data/db/trade.db < analysis/trade_deep_dive.sql)
-- Source: trade_flows (UN Comtrade, reporter ETH=231, partner=World, annual).
-- Values are USD. Detailed lines use full HS codes; basket lines use HS 2-digit
-- chapters; grand totals use commodity_hs='TOTAL'. Helper views are defined in the
-- schema (v_trade_balance, v_top_exports, v_top_imports, v_leather_trade, v_petroleum_trade).
-- ============================================================================

.mode box
.headers on

-- 1. Trade balance over time: exports vs imports, deficit, and how much of imports
--    exports actually cover (%).
SELECT period, exports_usd, imports_usd, balance_usd, export_coverage_pct
FROM v_trade_balance ORDER BY period;

-- 2. What does Ethiopia EXPORT the most? (top 8 chapters, latest reported year)
SELECT period, rank, commodity_hs, commodity_desc, value_usd
FROM v_top_exports
WHERE period = (SELECT MAX(period) FROM v_top_exports) AND rank <= 8
ORDER BY rank;

-- 3. What does Ethiopia IMPORT the most? (top 8 chapters, latest reported year)
SELECT period, rank, commodity_hs, commodity_desc, value_usd
FROM v_top_imports
WHERE period = (SELECT MAX(period) FROM v_top_imports) AND rank <= 8
ORDER BY rank;

-- 4. Coffee, the dominant export: value & volume trend (HS 0901, detailed line).
SELECT period, ROUND(value_usd/1e6,1) AS value_musd, ROUND(qty/1e6,1) AS qty_m_kg
FROM trade_flows WHERE commodity_hs='0901' AND flow='export' ORDER BY period;

-- 5. Khat / chat exports (HS 1211; recorded trade only — undercounts overland trade).
SELECT period, ROUND(value_usd/1e6,2) AS value_musd, ROUND(qty/1e6,2) AS qty_m_kg
FROM trade_flows WHERE commodity_hs='1211' AND flow='export' ORDER BY period;

-- 6. Leather value chain: raw hides/skins -> finished leather -> goods -> footwear.
--    (Watch the shift from exporting raw hides to importing footwear.)
SELECT period, flow, commodity_desc, value_usd FROM v_leather_trade ORDER BY period, flow, value_usd DESC;

-- 7. Petroleum / mineral-fuel imports (the single largest import category).
SELECT period, flow, commodity_desc, value_usd FROM v_petroleum_trade WHERE flow='import' ORDER BY period;

-- 8. Export concentration: share of total exports from the top chapter, latest year.
SELECT t.period,
       ROUND(MAX(CASE WHEN t.rank=1 THEN t.value_usd END) * 100.0 /
             (SELECT value_usd FROM trade_flows WHERE commodity_hs='TOTAL' AND flow='export' AND period=t.period), 1)
         AS top_export_share_pct
FROM v_top_exports t
WHERE t.period = (SELECT MAX(period) FROM v_top_exports)
GROUP BY t.period;
