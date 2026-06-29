import { existsSync } from "fs";
import { getDb, closeDatabase, dbPath } from "./shared/database";
import { recordFetch } from "./shared/database/ledger";
import { DB_PATH } from "./shared/config";
import { getProviderConfig, listProviders } from "./providers/registry";
import type { Domain } from "./shared/provider_types";

// One-time, non-destructive split of the legacy single-file warehouse (exchange_rates.db)
// into the per-domain DBs under DB_DIR, then seed the fetch ledger from the migrated rows
// so the next `collect` run skips data we already have. The old DB is never modified.
// Run: bun run split   (or: bun run src/migrate_split.ts)

const DOMAIN_TABLES: Record<Domain, string[]> = {
  currency: ["providers", "currencies", "gold_types", "exchange_rates", "gold_rates", "rate_aggregates"],
  prices: ["providers", "commodities", "markets", "commodity_prices", "commodity_aggregates"],
  macro: ["providers", "economic_indicators"],
  trade: ["providers", "trade_flows"],
  property: ["providers", "property_prices"],
};

function tableCols(db: any, schema: string, table: string): string[] {
  try {
    return (db.prepare(`PRAGMA ${schema}.table_info(${table})`).all() as Array<{ name: string }>).map(c => c.name);
  } catch { return []; }
}

// Copy a table from the attached 'old' DB into 'main', matching on shared column names
// (the legacy DB's column order differs — exchange_rates' bank columns were ALTER-added at
// the end — so an explicit column list is required, not SELECT *).
function copyTable(db: any, table: string): { old: number; copied: number } {
  const oldCols = new Set(tableCols(db, "old", table));
  if (!oldCols.size) return { old: 0, copied: 0 };
  const cols = tableCols(db, "main", table).filter(c => oldCols.has(c));
  if (!cols.length) return { old: 0, copied: 0 };
  const oldCount = (db.prepare(`SELECT COUNT(*) c FROM old.${table}`).get() as { c: number }).c;
  const list = cols.map(c => `"${c}"`).join(", ");
  db.run(`INSERT OR IGNORE INTO main.${table} (${list}) SELECT ${list} FROM old.${table}`);
  const copied = (db.prepare(`SELECT COUNT(*) c FROM main.${table}`).get() as { c: number }).c;
  return { old: oldCount, copied };
}

const primaryTask = (id: string) => Object.keys(getProviderConfig(id)!.tasks)[0]!;

function seedDates(db: any, provider: string, task: string, sql: string): number {
  const dates = (db.prepare(sql).all() as Array<{ date: string }>).map(r => r.date).filter(Boolean);
  db.transaction(() => dates.forEach(d => recordFetch(db, provider, task, d, "ok", 1)))();
  return dates.length;
}

function seedYears(db: any, provider: string, task: string, sql: string): number {
  const years = (db.prepare(sql).all() as Array<{ period: string }>).map(r => r.period).filter(Boolean);
  db.transaction(() => years.forEach(y => recordFetch(db, provider, task, String(y), "ok", 1)))();
  return years.length;
}

function hasRows(db: any, table: string, provider: string): number {
  return (db.prepare(`SELECT COUNT(*) c FROM ${table} WHERE provider_id=$p`).get({ $p: provider }) as { c: number }).c;
}

// Stamp a whole-file source as freshly pulled so the freshness window in collect.ts skips
// it on the next run instead of re-downloading everything immediately after migration.
function seedSnapshots(db: any, factTable: string): number {
  const provs = (db.prepare(`SELECT provider_id, COUNT(*) c FROM ${factTable} GROUP BY provider_id`).all() as Array<{ provider_id: string; c: number }>);
  for (const { provider_id, c } of provs) {
    if (!getProviderConfig(provider_id)) continue;
    recordFetch(db, provider_id, primaryTask(provider_id), "snapshot", "ok", c);
  }
  return provs.length;
}

function seedLedger(db: any, domain: Domain): void {
  if (domain === "currency") {
    for (const p of ["nbe", "cbe", "zemen"]) {
      if (hasRows(db, "exchange_rates", p)) seedDates(db, p, "daily", `SELECT DISTINCT date FROM exchange_rates WHERE provider_id='${p}'`);
    }
    seedDates(db, "nbe", "gold", `SELECT DISTINCT date FROM gold_rates`); // gold_rates has no provider_id (all NBE)
    for (const [p, task] of [["hibret", "daily"], ["blackmarket", "import"], ["parallel", "rates"]] as const) {
      const c = hasRows(db, "exchange_rates", p);
      if (c) recordFetch(db, p, task, "snapshot", "ok", c);
    }
  } else if (domain === "trade") {
    for (const task of ["trade", "basket", "partners"]) {
      seedYears(db, "comtrade", task, `SELECT DISTINCT period FROM trade_flows WHERE provider_id='comtrade'`);
    }
  } else {
    const factTable = ({ prices: "commodity_prices", macro: "economic_indicators", property: "property_prices" } as const)[domain];
    seedSnapshots(db, factTable);
  }
}

function main(): void {
  if (!existsSync(DB_PATH)) {
    console.error(`Legacy DB not found at ${DB_PATH}. Set DB_PATH to the old exchange_rates.db.`);
    process.exit(1);
  }
  console.log(`Splitting ${DB_PATH} → per-domain DBs\n`);

  const domains = Object.keys(DOMAIN_TABLES) as Domain[];
  let ok = true;
  for (const domain of domains) {
    const db = getDb(domain);
    db.run(`ATTACH '${DB_PATH}' AS old`);
    console.log(`▶ ${domain}.db`);
    for (const table of DOMAIN_TABLES[domain]) {
      const { old, copied } = copyTable(db, table);
      const flag = old > 0 && copied < old ? "  ⚠ fewer than source" : "";
      if (old > 0 && copied < old) ok = false;
      console.log(`    ${table.padEnd(22)} source=${old}  now=${copied}${flag}`);
    }
    seedLedger(db, domain);
    const ledgerRows = (db.prepare(`SELECT COUNT(*) c FROM fetch_log`).get() as { c: number }).c;
    console.log(`    fetch_log seeded: ${ledgerRows} units\n`);
    db.run(`DETACH old`);
  }

  closeDatabase();
  console.log(domains.map(d => `  ${dbPath(d)}`).join("\n"));
  console.log(`\n${ok ? "✓ row counts match source" : "⚠ some tables copied fewer rows than source — inspect above"}`);
  console.log(`The legacy ${DB_PATH} was left untouched; delete it once you've verified.`);
}

main();
