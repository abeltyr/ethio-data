// macro.db — annual macro indicator series. Sources: worldbank, imf.
export function applyMacro(db: any): void {
  db.run(`CREATE TABLE IF NOT EXISTS economic_indicators (
    id TEXT PRIMARY KEY, provider_id TEXT NOT NULL, indicator_code TEXT NOT NULL,
    indicator_name TEXT NOT NULL, area TEXT NOT NULL DEFAULT 'ET',
    period TEXT NOT NULL, period_type TEXT NOT NULL, value REAL NOT NULL, unit TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (provider_id) REFERENCES providers(id),
    UNIQUE(provider_id, indicator_code, area, period))`);

  db.run(`CREATE INDEX IF NOT EXISTS idx_indicators_code ON economic_indicators(indicator_code, period)`);

  db.run(`DROP VIEW IF EXISTS v_latest_indicators`);
  db.run(`CREATE VIEW v_latest_indicators AS
    SELECT i.provider_id, i.indicator_code, i.indicator_name, i.period, i.value, i.unit
    FROM economic_indicators i
    JOIN (SELECT provider_id, indicator_code, MAX(period) mp FROM economic_indicators
          GROUP BY provider_id, indicator_code) x
      ON x.provider_id = i.provider_id AND x.indicator_code = i.indicator_code AND x.mp = i.period`);
}
