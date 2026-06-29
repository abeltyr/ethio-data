import { appendFileSync } from "fs";

export const RATE_LIMIT_MS = parseInt(process.env.RATE_LIMIT_MS || "500");
export const MAX_RETRIES = parseInt(process.env.MAX_RETRIES || "5");
export const RETRY_DELAY_MS = parseInt(process.env.RETRY_DELAY_MS || "2000");
// Hard ceiling per HTTP attempt. Without this, a host that accepts the connection
// but never responds (e.g. flaky bank servers like CBE) hangs fetch() forever — it
// never rejects, so the retry path never runs and the whole collector freezes.
export const FETCH_TIMEOUT_MS = parseInt(process.env.FETCH_TIMEOUT_MS || "30000");
// A host that's hanging now rarely recovers within one run, and each timeout retry
// costs a full FETCH_TIMEOUT_MS — so timeouts get a tighter retry budget than ordinary
// (transient) HTTP errors, which keep MAX_RETRIES. Keeps a down host from dominating
// the wall-clock of a long backfill.
export const TIMEOUT_MAX_RETRIES = parseInt(process.env.TIMEOUT_MAX_RETRIES || "1");
// Directory holding the per-domain SQLite files (currency.db, prices.db, …).
export const DB_DIR = process.env.DB_DIR || "data/db";
// Legacy single-file warehouse. Only used as the source for `bun run split` migration.
export const DB_PATH = process.env.DB_PATH || "exchange_rates.db";
export const LOG_FILE = process.env.LOG_FILE || "failed_dates.log";
export const PROVIDER_ID = process.env.PROVIDER_ID || "nbe";
export const PROVIDER_TASK = process.env.PROVIDER_TASK || "daily";

// Opt-in escape hatch for hosts that ship a broken/incomplete TLS chain (e.g. some
// Ethiopian bank sites). Default OFF: TLS is verified and such a provider simply
// fails gracefully. Only enable for public, read-only data you accept may be MITM'd.
export const ALLOW_INSECURE_TLS = process.env.ALLOW_INSECURE_TLS === "1" || process.env.ALLOW_INSECURE_TLS === "true";

export function getStartDate(): string {
  return process.env.START_DATE || "";
}

export function getEndDate(): string {
  if (process.env.END_DATE) return process.env.END_DATE;
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  return yesterday.toISOString().split('T')[0] ?? "";
}

export function logFailed(providerId: string, date: string, reason: string): void {
  const timestamp = new Date().toISOString();
  appendFileSync(LOG_FILE, `${timestamp} | ${providerId} | ${date} | ${reason}\n`);
}
