// prices.db — long-format commodity/food/livestock prices and their roll-ups.
// Sources: wfp, fewsnet, faostat, worldbank_pinksheet, worldbank_rtp, twomerkato.
export function applyPrices(db: any): void {
  db.run(`CREATE TABLE IF NOT EXISTS commodities (
    id TEXT PRIMARY KEY, code TEXT NOT NULL, name TEXT NOT NULL,
    category TEXT NOT NULL, unit TEXT NOT NULL)`);
  // Non-unique: the same code (e.g. "maize") can come from multiple providers.
  db.run(`CREATE INDEX IF NOT EXISTS idx_commodity_code ON commodities(code)`);

  db.run(`CREATE TABLE IF NOT EXISTS markets (
    id TEXT PRIMARY KEY, name TEXT NOT NULL, admin1 TEXT, admin2 TEXT,
    latitude REAL, longitude REAL, country TEXT DEFAULT 'ET')`);

  db.run(`CREATE TABLE IF NOT EXISTS commodity_prices (
    id TEXT PRIMARY KEY, provider_id TEXT NOT NULL, commodity_id TEXT NOT NULL,
    market_id TEXT, date TEXT NOT NULL, price REAL NOT NULL, currency TEXT NOT NULL,
    price_usd REAL, price_type TEXT NOT NULL, unit TEXT NOT NULL,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (provider_id) REFERENCES providers(id),
    FOREIGN KEY (commodity_id) REFERENCES commodities(id),
    FOREIGN KEY (market_id) REFERENCES markets(id),
    UNIQUE(provider_id, commodity_id, market_id, date, price_type))`);

  db.run(`CREATE TABLE IF NOT EXISTS commodity_aggregates (
    id TEXT PRIMARY KEY, provider_id TEXT NOT NULL, commodity_id TEXT NOT NULL,
    market_id TEXT, price_type TEXT NOT NULL, period_type TEXT NOT NULL, period_value TEXT NOT NULL,
    avg_price REAL NOT NULL, min_price REAL NOT NULL, max_price REAL NOT NULL,
    avg_price_usd REAL NOT NULL, price_count INTEGER NOT NULL,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (provider_id) REFERENCES providers(id),
    FOREIGN KEY (commodity_id) REFERENCES commodities(id),
    UNIQUE(provider_id, commodity_id, market_id, price_type, period_type, period_value))`);

  db.run(`CREATE INDEX IF NOT EXISTS idx_cprices_date ON commodity_prices(date)`);
  db.run(`CREATE INDEX IF NOT EXISTS idx_cprices_commodity ON commodity_prices(commodity_id)`);
  db.run(`CREATE INDEX IF NOT EXISTS idx_cprices_provider ON commodity_prices(provider_id)`);

  // SQLite treats NULLs as DISTINCT in UNIQUE indexes, which breaks idempotent upserts for
  // national-level rows. Use a 'national'/'global' sentinel market instead of NULL.
  db.run(`INSERT OR IGNORE INTO markets (id, name, country) VALUES ('national', 'Ethiopia (national)', 'ET')`);
  db.run(`INSERT OR IGNORE INTO markets (id, name, country) VALUES ('global', 'Global benchmark', 'WLD')`);
  db.run(`UPDATE commodity_prices SET market_id = 'national' WHERE market_id IS NULL`);
  db.run(`UPDATE commodity_aggregates SET market_id = 'national' WHERE market_id IS NULL`);

  db.run(`DROP VIEW IF EXISTS v_commodity_prices`);
  db.run(`CREATE VIEW v_commodity_prices AS
    SELECT p.provider_id, pr.name AS provider, c.category, c.name AS commodity, c.unit,
           m.name AS market, m.admin1, p.date, p.price, p.currency, p.price_usd, p.price_type
    FROM commodity_prices p
    JOIN commodities c ON c.id = p.commodity_id
    JOIN providers pr ON pr.id = p.provider_id
    LEFT JOIN markets m ON m.id = p.market_id`);

  db.run(`DROP VIEW IF EXISTS v_latest_commodity_prices`);
  db.run(`CREATE VIEW v_latest_commodity_prices AS
    SELECT p.provider_id, c.category, c.name AS commodity, m.name AS market,
           p.date, p.price, p.currency, p.price_usd, p.price_type
    FROM commodity_prices p
    JOIN commodities c ON c.id = p.commodity_id
    LEFT JOIN markets m ON m.id = p.market_id
    JOIN (SELECT provider_id, commodity_id, IFNULL(market_id,'') mk, price_type, MAX(date) md
          FROM commodity_prices GROUP BY provider_id, commodity_id, mk, price_type) x
      ON x.provider_id = p.provider_id AND x.commodity_id = p.commodity_id
         AND IFNULL(p.market_id,'') = x.mk AND x.price_type = p.price_type AND x.md = p.date`);

  db.run(`DROP VIEW IF EXISTS v_monthly_commodity_prices`);
  db.run(`CREATE VIEW v_monthly_commodity_prices AS
    SELECT p.provider_id, c.category, c.name AS commodity, m.name AS market,
           substr(p.date,1,7) AS month, p.price_type,
           AVG(p.price) AS avg_price, AVG(p.price_usd) AS avg_price_usd, COUNT(*) AS n
    FROM commodity_prices p
    JOIN commodities c ON c.id = p.commodity_id
    LEFT JOIN markets m ON m.id = p.market_id
    GROUP BY p.provider_id, p.commodity_id, p.market_id, month, p.price_type`);
}
