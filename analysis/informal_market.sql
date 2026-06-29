-- ============================================================================
-- Ethiopia Informal / Parallel Market  (run: sqlite3 data/db/currency.db < analysis/informal_market.sql)
--
-- "Informal market" here is measured two ways:
--   (a) Parallel (black-market) FX premium over the official rate — the clearest
--       quantitative signal of informal-currency pressure and FX scarcity.
--   (b) Unrecorded trade proxy — khat exports are massively under-reported in
--       official trade stats because overland flows to Somalia/Djibouti go
--       uncaptured; the recorded figure is a floor, not the true total.
--
-- Sources: currency.db exchange_rates (provider_id='blackmarket' = parallel;
-- 'cbe'/'nbe'/'zemen' = official; view v_informal_fx_premium) and trade.db trade_flows
-- (Comtrade), attached below for the khat-export proxy.
-- ============================================================================

.mode box
.headers on

ATTACH 'data/db/trade.db' AS trade;

-- 1. Parallel vs official USD rate and the premium %, monthly.
SELECT period, parallel_rate, official_rate, premium_pct
FROM v_informal_fx_premium WHERE currency='USD' ORDER BY period;

-- 2. Average parallel premium by currency (how wide is the informal spread overall).
SELECT currency, ROUND(AVG(premium_pct),1) AS avg_premium_pct,
       ROUND(MIN(premium_pct),1) AS min_pct, ROUND(MAX(premium_pct),1) AS max_pct,
       COUNT(*) AS months
FROM v_informal_fx_premium GROUP BY currency ORDER BY avg_premium_pct DESC;

-- 3. Premium trend by year (is the informal market widening or converging?).
SELECT substr(period,1,4) AS year, currency, ROUND(AVG(premium_pct),1) AS avg_premium_pct
FROM v_informal_fx_premium WHERE currency IN ('USD','EUR','GBP','SAR','AED')
GROUP BY year, currency ORDER BY year, currency;

-- 4. Unrecorded-trade proxy: recorded khat export value & volume (treat as a floor).
SELECT period, ROUND(value_usd/1e6,2) AS recorded_value_musd, ROUND(qty/1e6,2) AS recorded_m_kg
FROM trade.trade_flows WHERE commodity_hs='1211' AND flow='export' ORDER BY period;
