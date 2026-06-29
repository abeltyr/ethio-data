import { existsSync } from "fs";
import { dirname, join, resolve } from "path";

// Anchor the data directory to the monorepo root (the dir containing turbo.json), not the
// current working directory — so the collector, the web app, and ad-hoc scripts all read and
// write the same data/db/ regardless of which workspace they run from.
function findRepoRoot(start: string = process.cwd()): string {
  let dir = resolve(start);
  for (;;) {
    if (existsSync(join(dir, "turbo.json"))) return dir;
    const parent = dirname(dir);
    if (parent === dir) return resolve(start); // fallback: cwd
    dir = parent;
  }
}

export const REPO_ROOT = findRepoRoot();

// Directory holding the per-domain SQLite files (currency.db, prices.db, …).
export const DB_DIR = process.env.DB_DIR || join(REPO_ROOT, "data", "db");
// Legacy single-file warehouse. Only used as the source for `bun run split` migration.
export const DB_PATH = process.env.DB_PATH || join(REPO_ROOT, "exchange_rates.db");
