// Tables present in every domain DB: the provider registry (so fact-table FKs resolve)
// and the fetch ledger (so collection knows what has already been pulled).
export function applyCommon(db: any): void {
  db.run(`CREATE TABLE IF NOT EXISTS providers (
    id TEXT PRIMARY KEY, name TEXT NOT NULL, type TEXT NOT NULL, api_url TEXT)`);

  // One row per (provider, task, unit) fetch. `unit` is a date 'YYYY-MM-DD' for dated
  // sources, a year 'YYYY' for annual sources, or the literal 'snapshot' for whole-file
  // pulls. `status` distinguishes a real pull ('ok'), a confirmed-empty unit ('empty',
  // e.g. a weekend with no forex), and a failure ('error'). This is the single source of
  // truth for "have we already fetched this?".
  db.run(`CREATE TABLE IF NOT EXISTS fetch_log (
    provider   TEXT NOT NULL,
    task       TEXT NOT NULL,
    unit       TEXT NOT NULL,
    status     TEXT NOT NULL,
    rows       INTEGER NOT NULL DEFAULT 0,
    fetched_at TEXT NOT NULL DEFAULT (datetime('now')),
    UNIQUE(provider, task, unit))`);
  db.run(`CREATE INDEX IF NOT EXISTS idx_fetchlog_provider_task ON fetch_log(provider, task)`);
}
