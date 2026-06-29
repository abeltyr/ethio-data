import "server-only";
import { existsSync } from "node:fs";
import { dirname, join } from "node:path";
import type { Domain } from "@ethiodata/types";
import Database from "better-sqlite3";

// Anchor to the monorepo root (the folder with turbo.json) so the web app reads the same
// data/db/*.db the collector writes, regardless of the process working directory.
function repoRoot(): string {
  let dir = process.cwd();
  for (;;) {
    if (existsSync(join(dir, "turbo.json"))) return dir;
    const parent = dirname(dir);
    if (parent === dir) return process.cwd();
    dir = parent;
  }
}

const ROOT = repoRoot();
const handles = new Map<Domain, Database.Database>();

function db(domain: Domain): Database.Database {
  let handle = handles.get(domain);
  if (!handle) {
    handle = new Database(join(ROOT, "data", "db", `${domain}.db`), {
      readonly: true,
      fileMustExist: true,
    });
    handle.pragma("query_only = true");
    handles.set(domain, handle);
  }
  return handle;
}

export function rows<T>(
  domain: Domain,
  sql: string,
  ...params: unknown[]
): T[] {
  return db(domain)
    .prepare(sql)
    .all(...params) as T[];
}

export function row<T>(
  domain: Domain,
  sql: string,
  ...params: unknown[]
): T | undefined {
  return db(domain)
    .prepare(sql)
    .get(...params) as T | undefined;
}

export function count(domain: Domain, table: string): number {
  return (
    db(domain).prepare(`SELECT COUNT(*) AS c FROM ${table}`).get() as {
      c: number;
    }
  ).c;
}

export type { Point } from "@/types/warehouse";
