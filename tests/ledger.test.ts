import { test, expect } from "bun:test";
import { Database } from "bun:sqlite";
import { applyCommon } from "../src/shared/database/schema/common";
import {
  recordFetch, wasFetched, fetchStatus, shouldSkipDate, shouldSkipYear, isFresh, lastFetchedAt,
} from "../src/shared/database/ledger";

function freshDb(): Database {
  const db = new Database(":memory:");
  applyCommon(db);
  return db;
}

test("recordFetch + wasFetched: ok/empty count as fetched, error/absent do not", () => {
  const db = freshDb();
  recordFetch(db, "nbe", "daily", "2024-01-01", "ok", 5);
  recordFetch(db, "nbe", "daily", "2024-01-02", "empty", 0);
  recordFetch(db, "nbe", "daily", "2024-01-03", "error", 0);

  expect(wasFetched(db, "nbe", "daily", "2024-01-01")).toBe(true);
  expect(wasFetched(db, "nbe", "daily", "2024-01-02")).toBe(true);
  expect(wasFetched(db, "nbe", "daily", "2024-01-03")).toBe(false); // error → retry
  expect(wasFetched(db, "nbe", "daily", "2024-01-09")).toBe(false); // absent → fetch
  expect(fetchStatus(db, "nbe", "daily", "2024-01-01")).toBe("ok");
});

test("recordFetch upserts (no duplicate rows on re-record)", () => {
  const db = freshDb();
  recordFetch(db, "cbe", "daily", "2024-05-01", "empty", 0);
  recordFetch(db, "cbe", "daily", "2024-05-01", "ok", 7);
  const rows = db.prepare(`SELECT COUNT(*) c FROM fetch_log`).get() as { c: number };
  expect(rows.c).toBe(1);
  expect(fetchStatus(db, "cbe", "daily", "2024-05-01")).toBe("ok");
});

test("shouldSkipDate: ok always skips; empty skips only when old; recent empty re-checked", () => {
  const db = freshDb();
  const now = new Date("2024-06-10T00:00:00Z").getTime();
  recordFetch(db, "nbe", "daily", "2024-06-01", "ok", 3);    // old, ok
  recordFetch(db, "nbe", "daily", "2024-06-02", "empty", 0); // old, empty
  recordFetch(db, "nbe", "daily", "2024-06-09", "empty", 0); // recent (1 day ago), empty

  expect(shouldSkipDate(db, "nbe", "daily", "2024-06-01", 3, now)).toBe(true);  // ok → skip
  expect(shouldSkipDate(db, "nbe", "daily", "2024-06-02", 3, now)).toBe(true);  // old empty → skip
  expect(shouldSkipDate(db, "nbe", "daily", "2024-06-09", 3, now)).toBe(false); // recent empty → re-check
  expect(shouldSkipDate(db, "nbe", "daily", "2024-06-08", 3, now)).toBe(false); // absent → fetch
});

test("shouldSkipYear: recent years always refresh; older fetched years skip", () => {
  const db = freshDb();
  recordFetch(db, "comtrade", "trade", "2020", "ok", 100);
  recordFetch(db, "comtrade", "trade", "2023", "ok", 100);
  const currentYear = 2024;

  expect(shouldSkipYear(db, "comtrade", "trade", "2020", currentYear)).toBe(true);  // old + fetched → skip
  expect(shouldSkipYear(db, "comtrade", "trade", "2021", currentYear)).toBe(false); // old + not fetched → fetch
  expect(shouldSkipYear(db, "comtrade", "trade", "2023", currentYear)).toBe(false); // currentYear-1 → always refresh
  expect(shouldSkipYear(db, "comtrade", "trade", "2024", currentYear)).toBe(false); // currentYear → always refresh
});

test("FORCE_REFETCH bypasses date and year skips", () => {
  const db = freshDb();
  recordFetch(db, "nbe", "daily", "2024-01-01", "ok", 3);
  recordFetch(db, "comtrade", "trade", "2020", "ok", 100);
  const prev = process.env.FORCE_REFETCH;
  process.env.FORCE_REFETCH = "1";
  try {
    expect(shouldSkipDate(db, "nbe", "daily", "2024-01-01")).toBe(false);
    expect(shouldSkipYear(db, "comtrade", "trade", "2020", 2024)).toBe(false);
  } finally {
    if (prev === undefined) delete process.env.FORCE_REFETCH; else process.env.FORCE_REFETCH = prev;
  }
  // ...and still skips once the override is cleared.
  expect(shouldSkipDate(db, "nbe", "daily", "2024-01-01")).toBe(true);
});

test("isFresh / lastFetchedAt: within window true, beyond window false", () => {
  const db = freshDb();
  // Insert with explicit fetched_at to control age deterministically.
  db.run(`INSERT INTO fetch_log (provider, task, unit, status, rows, fetched_at)
          VALUES ('wfp','prices','snapshot','ok',10,'2024-06-01 00:00:00')`);
  const now = new Date("2024-06-05T00:00:00Z").getTime(); // 4 days later

  expect(lastFetchedAt(db, "wfp", "prices")).toBe("2024-06-01 00:00:00");
  expect(isFresh(db, "wfp", "prices", 7 * 86_400_000, now)).toBe(true);  // 4d < 7d
  expect(isFresh(db, "wfp", "prices", 3 * 86_400_000, now)).toBe(false); // 4d > 3d
  expect(isFresh(db, "imf", "macro", 7 * 86_400_000, now)).toBe(false);  // never fetched
});
