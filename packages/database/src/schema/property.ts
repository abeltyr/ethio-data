// property.db — housing / rent listings. Sources: realethio, realestate_hist.
export function applyProperty(db: any): void {
  db.run(`CREATE TABLE IF NOT EXISTS property_prices (
    id TEXT PRIMARY KEY, provider_id TEXT NOT NULL, source TEXT,
    listing_type TEXT NOT NULL, property_type TEXT, region TEXT, area TEXT,
    bedrooms INTEGER, bathrooms INTEGER, size_sqm REAL,
    price REAL NOT NULL, currency TEXT NOT NULL, price_sqm REAL,
    latitude REAL, longitude REAL, listed_date TEXT, collected_at TEXT NOT NULL,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (provider_id) REFERENCES providers(id))`);

  db.run(`CREATE INDEX IF NOT EXISTS idx_property_type ON property_prices(listing_type, region)`);
  db.run(`CREATE INDEX IF NOT EXISTS idx_property_date ON property_prices(collected_at)`);

  db.run(`DROP VIEW IF EXISTS v_housing_summary`);
  db.run(`CREATE VIEW v_housing_summary AS
    SELECT listing_type, region, bedrooms, currency,
           COUNT(*) AS listings,
           ROUND(AVG(price)) AS avg_price,
           ROUND(MIN(price)) AS min_price,
           ROUND(MAX(price)) AS max_price,
           ROUND(AVG(price_sqm)) AS avg_price_per_sqm,
           ROUND(AVG(size_sqm)) AS avg_size_sqm
    FROM property_prices
    GROUP BY listing_type, region, bedrooms, currency`);

  db.run(`DROP VIEW IF EXISTS v_housing_monthly`);
  db.run(`CREATE VIEW v_housing_monthly AS
    SELECT substr(COALESCE(listed_date, collected_at),1,7) AS month, listing_type,
           COUNT(*) AS listings, ROUND(AVG(price)) AS avg_price, ROUND(AVG(price_sqm)) AS avg_price_per_sqm
    FROM property_prices
    GROUP BY month, listing_type
    ORDER BY month`);
}
