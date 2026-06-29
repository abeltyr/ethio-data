// The fetch ledger: a record of what each provider/task has already pulled, so re-runs and
// `collect all` only fetch what is missing. Backed by the `fetch_log` table (see
// schema/common.ts). `unit` is a date ('YYYY-MM-DD'), a year ('YYYY'), or 'snapshot'.

export type FetchStatus = "ok" | "empty" | "error";

// Escape hatch: FORCE_REFETCH=1 makes every skip check report "not skippable", so a run
// re-pulls everything regardless of the ledger (e.g. to repair suspected bad data).
export const forceRefetch = (): boolean =>
  process.env.FORCE_REFETCH === "1" || process.env.FORCE_REFETCH === "true";

export function recordFetch(
  db: any, provider: string, task: string, unit: string, status: FetchStatus, rows = 0,
): void {
  db.prepare(`INSERT INTO fetch_log (provider, task, unit, status, rows, fetched_at)
    VALUES ($p, $t, $u, $s, $r, datetime('now'))
    ON CONFLICT(provider, task, unit) DO UPDATE SET status=$s, rows=$r, fetched_at=datetime('now')`)
    .run({ $p: provider, $t: task, $u: unit, $s: status, $r: rows });
}

// True if this unit was already fetched with a non-error outcome (ok or empty) — no need
// to fetch it again. An 'empty' unit (e.g. a weekend with no forex) counts as fetched so
// we stop re-hitting it forever.
export function wasFetched(db: any, provider: string, task: string, unit: string): boolean {
  const row = db.prepare(`SELECT status FROM fetch_log WHERE provider=$p AND task=$t AND unit=$u`)
    .get({ $p: provider, $t: task, $u: unit }) as { status: string } | undefined;
  return !!row && row.status !== "error";
}

export function fetchStatus(db: any, provider: string, task: string, unit: string): FetchStatus | null {
  const row = db.prepare(`SELECT status FROM fetch_log WHERE provider=$p AND task=$t AND unit=$u`)
    .get({ $p: provider, $t: task, $u: unit }) as { status: FetchStatus } | undefined;
  return row?.status ?? null;
}

// For dated sources (forex/gold): skip a date we already have real data for ('ok'), or a
// confirmed-empty day ('empty', e.g. a weekend) that is old enough that a late upstream
// post is implausible. Recent empty days are re-checked so late-published rates aren't lost.
export function shouldSkipDate(
  db: any, provider: string, task: string, date: string, recentDays = 3, now: number = Date.now(),
): boolean {
  if (forceRefetch()) return false;
  const st = fetchStatus(db, provider, task, date);
  if (st === "ok") return true;
  if (st === "empty") {
    const cutoff = new Date(now - recentDays * 86_400_000).toISOString().slice(0, 10);
    return date < cutoff;
  }
  return false;
}

// For annual sources (comtrade): skip a year already fetched, EXCEPT the most recent
// `keepRecent` years which always refresh (upstream revises recent data).
export function shouldSkipYear(
  db: any, provider: string, task: string, year: string, currentYear: number, keepRecent = 2,
): boolean {
  if (forceRefetch()) return false;
  if (Number(year) > currentYear - keepRecent) return false;
  return wasFetched(db, provider, task, year);
}

// Most recent successful fetch timestamp (UTC 'YYYY-MM-DD HH:MM:SS') for a provider/task.
export function lastFetchedAt(db: any, provider: string, task: string): string | null {
  const row = db.prepare(`SELECT MAX(fetched_at) m FROM fetch_log
    WHERE provider=$p AND task=$t AND status='ok'`).get({ $p: provider, $t: task }) as { m: string | null } | undefined;
  return row?.m ?? null;
}

// True if a whole-file snapshot was last pulled successfully within maxAgeMs — used to skip
// re-downloading a large file that hasn't gone stale yet.
export function isFresh(db: any, provider: string, task: string, maxAgeMs: number, now: number = Date.now()): boolean {
  const last = lastFetchedAt(db, provider, task);
  if (!last) return false;
  const lastMs = new Date(last.replace(" ", "T") + "Z").getTime();
  return now - lastMs < maxAgeMs;
}
