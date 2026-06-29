import { Database } from "bun:sqlite";
import { mkdirSync } from "fs";
import { DB_DIR } from "../config";
import type { Domain } from "../provider_types";
import { getProviderConfig } from "../../providers/registry";
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

// One open handle per domain. Each domain is its own SQLite file under DB_DIR.
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

// Convenience for provider code: resolve the provider's domain DB from its id, so a
// provider file only needs to know its own id (not which file its data lands in).
export function getProviderDb(providerId: string): Database {
  const cfg = getProviderConfig(providerId);
  if (!cfg) throw new Error(`Unknown provider: ${providerId}`);
  return getDb(cfg.domain);
}

export function initDatabase(domain: Domain): Database {
  return getDb(domain);
}

export function closeDatabase(): void {
  for (const db of handles.values()) db.close();
  handles.clear();
}
