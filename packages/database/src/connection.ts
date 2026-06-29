import { Database } from "bun:sqlite";
import { mkdirSync } from "fs";
import type { Domain } from "@ethiodata/types";
import { DB_DIR } from "./config";
import { applyCommon } from "./schema/common";
import { applyCurrency } from "./schema/currency";
import { applyPrices } from "./schema/prices";
import { applyMacro } from "./schema/macro";
import { applyTrade } from "./schema/trade";
import { applyProperty } from "./schema/property";

const SCHEMA: Record<Domain, (db: Database) => void> = {
  currency: applyCurrency,
  prices: applyPrices,
  macro: applyMacro,
  trade: applyTrade,
  property: applyProperty,
};

// One open handle per domain. Each domain is its own SQLite file under DB_DIR. This package
// is provider-agnostic: it knows domains, not sources. The collector maps a provider id to
// its domain (via the registry) and calls getDb(domain) — keeping the data layer reusable by
// any app (e.g. the web app) without dragging in provider config.
const handles = new Map<Domain, Database>();

export function dbPath(domain: Domain): string {
  return `${DB_DIR}/${domain}.db`;
}

export function getDb(domain: Domain): Database {
  let db = handles.get(domain);
  if (!db) {
    mkdirSync(DB_DIR, { recursive: true });
    db = new Database(dbPath(domain));
    applyCommon(db);
    SCHEMA[domain](db);
    handles.set(domain, db);
  }
  return db;
}

export function initDatabase(domain: Domain): Database {
  return getDb(domain);
}

export function closeDatabase(): void {
  for (const db of handles.values()) db.close();
  handles.clear();
}
