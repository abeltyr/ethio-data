// trade.db — annual export/import flows by HS code & partner. Source: comtrade.
export function applyTrade(db: any): void {
  db.run(`CREATE TABLE IF NOT EXISTS trade_flows (
    id TEXT PRIMARY KEY, provider_id TEXT NOT NULL, reporter TEXT NOT NULL DEFAULT 'ET',
    partner TEXT NOT NULL, partner_code TEXT NOT NULL, commodity_hs TEXT NOT NULL,
    commodity_desc TEXT NOT NULL, flow TEXT NOT NULL, period TEXT NOT NULL,
    period_type TEXT NOT NULL, value_usd REAL NOT NULL, qty REAL, qty_unit TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (provider_id) REFERENCES providers(id),
    UNIQUE(provider_id, reporter, partner_code, commodity_hs, flow, period))`);

  db.run(`CREATE INDEX IF NOT EXISTS idx_trade_hs ON trade_flows(commodity_hs, period)`);

  db.run(`DROP VIEW IF EXISTS v_trade_summary`);
  db.run(`CREATE VIEW v_trade_summary AS
    SELECT commodity_hs, commodity_desc, flow, period, value_usd, qty, qty_unit
    FROM trade_flows WHERE partner_code = '0' ORDER BY period DESC, value_usd DESC`);

  db.run(`DROP VIEW IF EXISTS v_trade_balance`);
  db.run(`CREATE VIEW v_trade_balance AS
    SELECT e.period,
           ROUND(e.value_usd) AS exports_usd,
           ROUND(i.value_usd) AS imports_usd,
           ROUND(e.value_usd - i.value_usd) AS balance_usd,
           ROUND(e.value_usd * 100.0 / i.value_usd, 1) AS export_coverage_pct
    FROM (SELECT period, value_usd FROM trade_flows WHERE commodity_hs='TOTAL' AND partner_code='0' AND flow='export') e
    JOIN (SELECT period, value_usd FROM trade_flows WHERE commodity_hs='TOTAL' AND partner_code='0' AND flow='import') i
      ON e.period = i.period
    ORDER BY e.period`);

  db.run(`DROP VIEW IF EXISTS v_top_exports`);
  db.run(`CREATE VIEW v_top_exports AS
    SELECT period, commodity_hs, commodity_desc, ROUND(value_usd) AS value_usd,
           RANK() OVER (PARTITION BY period ORDER BY value_usd DESC) AS rank
    FROM trade_flows
    WHERE flow='export' AND length(commodity_hs)=2`);

  db.run(`DROP VIEW IF EXISTS v_top_imports`);
  db.run(`CREATE VIEW v_top_imports AS
    SELECT period, commodity_hs, commodity_desc, ROUND(value_usd) AS value_usd,
           RANK() OVER (PARTITION BY period ORDER BY value_usd DESC) AS rank
    FROM trade_flows
    WHERE flow='import' AND length(commodity_hs)=2`);

  db.run(`DROP VIEW IF EXISTS v_leather_trade`);
  db.run(`CREATE VIEW v_leather_trade AS
    SELECT period, flow, commodity_hs, commodity_desc, ROUND(value_usd) AS value_usd, qty, qty_unit
    FROM trade_flows
    WHERE commodity_hs IN ('41','42','64','4101','4102','4103','4104','4107','4202','6403')
    ORDER BY period DESC, flow, value_usd DESC`);

  db.run(`DROP VIEW IF EXISTS v_petroleum_trade`);
  db.run(`CREATE VIEW v_petroleum_trade AS
    SELECT period, flow, commodity_hs, commodity_desc, ROUND(value_usd) AS value_usd, qty, qty_unit
    FROM trade_flows
    WHERE commodity_hs IN ('27','2709','2710','2711')
    ORDER BY period DESC, flow, value_usd DESC`);

  db.run(`DROP VIEW IF EXISTS v_top_trade_partners`);
  db.run(`CREATE VIEW v_top_trade_partners AS
    SELECT period, flow, partner, partner_code, ROUND(value_usd) AS value_usd,
           RANK() OVER (PARTITION BY period, flow ORDER BY value_usd DESC) AS rank
    FROM trade_flows
    WHERE commodity_hs='TOTAL' AND partner_code <> '0'`);
}
