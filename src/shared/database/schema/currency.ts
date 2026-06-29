// currency.db — exchange rates, gold, and their roll-ups.
// Sources: nbe, cbe, zemen, hibret, blackmarket, parallel.
export function applyCurrency(db: any): void {
  db.run(`CREATE TABLE IF NOT EXISTS currencies (
    id TEXT PRIMARY KEY, code TEXT NOT NULL, name TEXT NOT NULL)`);
  db.run(`CREATE UNIQUE INDEX IF NOT EXISTS idx_currency_code ON currencies(code)`);

  db.run(`CREATE TABLE IF NOT EXISTS gold_types (
    id TEXT PRIMARY KEY, karat TEXT, level TEXT)`);

  db.run(`CREATE TABLE IF NOT EXISTS gold_rates (
    id TEXT PRIMARY KEY, gold_type_id TEXT NOT NULL, price_usd REAL NOT NULL,
    price_birr REAL NOT NULL, date TEXT NOT NULL, created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(gold_type_id, date))`);

  // Full column set up-front (older monolith added the bank-specific columns via ALTER;
  // a fresh domain DB just declares them).
  db.run(`CREATE TABLE IF NOT EXISTS exchange_rates (
    id TEXT PRIMARY KEY, provider_id TEXT NOT NULL, currency_id TEXT NOT NULL,
    date TEXT NOT NULL, buying REAL NOT NULL, selling REAL NOT NULL, weighted_average REAL,
    buying_rate REAL, selling_rate REAL, cash_buying REAL, cash_selling REAL,
    transaction_buying REAL, transaction_selling REAL, avg_buying_rate REAL, avg_selling_rate REAL,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (provider_id) REFERENCES providers(id),
    FOREIGN KEY (currency_id) REFERENCES currencies(id),
    UNIQUE(provider_id, currency_id, date))`);

  db.run(`CREATE TABLE IF NOT EXISTS rate_aggregates (
    id TEXT PRIMARY KEY, provider_id TEXT NOT NULL, currency_id TEXT NOT NULL,
    period_type TEXT NOT NULL, period_value TEXT NOT NULL,
    avg_buying REAL NOT NULL, avg_selling REAL NOT NULL, avg_weighted REAL NOT NULL,
    min_buying REAL NOT NULL, max_buying REAL NOT NULL,
    min_selling REAL NOT NULL, max_selling REAL NOT NULL,
    rate_count INTEGER NOT NULL, updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (provider_id) REFERENCES providers(id),
    FOREIGN KEY (currency_id) REFERENCES currencies(id),
    UNIQUE(provider_id, currency_id, period_type, period_value))`);

  db.run(`CREATE INDEX IF NOT EXISTS idx_rates_date ON exchange_rates(date)`);
  db.run(`CREATE INDEX IF NOT EXISTS idx_gold_date ON gold_rates(date)`);

  // Parallel (black-market) vs official FX rate, monthly, with the premium % — a proxy
  // for informal-market currency pressure. All contributing sources live in this DB.
  db.run(`DROP VIEW IF EXISTS v_informal_fx_premium`);
  db.run(`CREATE VIEW v_informal_fx_premium AS
    WITH bm AS (
      SELECT substr(e.date,1,7) AS period, UPPER(substr(e.currency_id,4)) AS currency,
             AVG(e.selling) AS parallel_rate
      FROM exchange_rates e
      WHERE e.provider_id='blackmarket' AND e.currency_id LIKE 'bm_%'
      GROUP BY period, currency),
    off AS (
      SELECT substr(e.date,1,7) AS period, c.code AS currency, AVG(e.selling) AS official_rate
      FROM exchange_rates e JOIN currencies c ON c.id=e.currency_id
      WHERE e.provider_id IN ('cbe','nbe','zemen') GROUP BY period, c.code)
    SELECT bm.period, bm.currency,
           ROUND(bm.parallel_rate,2) AS parallel_rate,
           ROUND(off.official_rate,2) AS official_rate,
           ROUND((bm.parallel_rate/off.official_rate - 1)*100, 1) AS premium_pct
    FROM bm JOIN off ON off.period=bm.period AND off.currency=bm.currency
    ORDER BY bm.period, bm.currency`);
}
