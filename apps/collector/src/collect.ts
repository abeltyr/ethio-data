import { getDb, closeDatabase, isFresh, recordFetch, forceRefetch } from "@ethiodata/database";
import { generateDateRange } from "./shared/date_utils";
import { logFailed } from "./shared/config";
import { startHeartbeat, formatElapsed } from "./shared/progress";
import { getProviderConfig } from "./providers/registry";
import { executors } from "./providers/dispatch";

// Single-command orchestrator over every provider. Mirrors the CI schedule but runs
// locally. Usage: bun run src/collect.ts <mode>
//   daily     forex (incremental, last 7d) + ECX                    (cheap, run on a daily cron)
//   weekly    + food/commodity price snapshots
//   monthly   + macro & trade
//   all       every provider, but with incremental ranges — cheap; skips anything in the ledger
//   backfill  the heavy one: forex walked from each source's earliest date to fill old gaps
//
// NOTHING re-fetches data already recorded in the fetch ledger — not even `all`/`backfill`.
// Forex skips dates it already has, comtrade skips years it already has (bar the current /
// previous year, which upstream still revises), and whole-file snapshots skip while still
// inside their cadence window. To force a full re-pull anyway (e.g. suspected bad data),
// run with FORCE_REFETCH=1.
type Mode = "daily" | "weekly" | "monthly" | "all" | "backfill";

// How often a whole-file source is worth re-pulling. The orchestrator skips a snapshot
// whose last successful pull (per the fetch ledger) is newer than this — so `collect`
// re-runs in the same window cost nothing, in EVERY mode. Forex (per-date) and comtrade
// (per-year) skip at the unit level instead, inside their executors, so no cadence here.
type Cadence = "daily" | "weekly" | "monthly";
const CADENCE_MS: Record<Cadence, number> = {
  daily: 20 * 3_600_000,        // skip same-day re-runs; pull again the next day
  weekly: 6 * 86_400_000,       // just under the weekly cron so a scheduled run isn't skipped
  monthly: 27 * 86_400_000,     // just under the monthly cron
};

// kind: how dates are supplied to the provider.
//   forex   -> dated loop (one call per day)
//   fewsnet -> snapshot that accepts a start date
//   trade   -> snapshot that accepts a start/end YEAR
//   snapshot-> snapshot that pulls its full dataset (no dates)
interface Step {
  id: string;
  task: string;
  kind: "forex" | "fewsnet" | "trade" | "snapshot";
  floor?: string;        // earliest date data exists upstream
  yearsBack?: number;    // for trade snapshots: how many years to request
  cadence?: Cadence;     // freshness window for whole-file snapshots (kind snapshot/fewsnet)
  insecureNote?: boolean;
  groups: Mode[];
}

const PLAN: Step[] = [
  { id: "nbe", task: "daily", kind: "forex", floor: "2023-09-01", groups: ["daily", "weekly", "monthly", "all", "backfill"] },
  { id: "nbe", task: "gold", kind: "forex", floor: "2023-09-01", groups: ["daily", "weekly", "monthly", "all", "backfill"] },
  { id: "cbe", task: "daily", kind: "forex", floor: "2021-01-01", groups: ["daily", "weekly", "monthly", "all", "backfill"] },
  { id: "zemen", task: "daily", kind: "forex", floor: "2025-09-01", groups: ["daily", "weekly", "monthly", "all", "backfill"] },
  { id: "hibret", task: "daily", kind: "snapshot", cadence: "daily", insecureNote: true, groups: ["daily", "weekly", "monthly", "all"] },
  { id: "twomerkato", task: "ecx", kind: "snapshot", cadence: "daily", groups: ["daily", "weekly", "monthly", "all", "backfill"] },
  { id: "parallel", task: "rates", kind: "snapshot", cadence: "daily", groups: ["daily", "weekly", "monthly", "all", "backfill"] },
  { id: "realethio", task: "listings", kind: "snapshot", cadence: "weekly", groups: ["weekly", "monthly", "all", "backfill"] },
  { id: "realestate_hist", task: "historical", kind: "snapshot", cadence: "monthly", groups: ["all", "backfill"] },

  { id: "wfp", task: "prices", kind: "snapshot", cadence: "weekly", groups: ["weekly", "monthly", "all", "backfill"] },
  { id: "fewsnet", task: "prices", kind: "fewsnet", floor: "2000-01-01", cadence: "weekly", groups: ["weekly", "monthly", "all", "backfill"] },
  { id: "worldbank_rtp", task: "prices", kind: "snapshot", cadence: "weekly", groups: ["weekly", "monthly", "all", "backfill"] },

  { id: "worldbank", task: "macro", kind: "snapshot", cadence: "monthly", groups: ["monthly", "all", "backfill"] },
  { id: "imf", task: "macro", kind: "snapshot", cadence: "monthly", groups: ["monthly", "all", "backfill"] },
  { id: "comtrade", task: "trade", kind: "trade", yearsBack: 12, groups: ["monthly", "all", "backfill"] },
  { id: "comtrade", task: "basket", kind: "trade", yearsBack: 16, groups: ["monthly", "all", "backfill"] },
  { id: "comtrade", task: "partners", kind: "trade", yearsBack: 16, groups: ["monthly", "all", "backfill"] },
  { id: "faostat", task: "producer", kind: "snapshot", cadence: "monthly", groups: ["monthly", "all", "backfill"] },
  { id: "worldbank_pinksheet", task: "prices", kind: "snapshot", cadence: "monthly", groups: ["monthly", "all", "backfill"] },
];

const today = () => new Date().toISOString().slice(0, 10);
const daysAgo = (n: number) => { const d = new Date(); d.setDate(d.getDate() - n); return d.toISOString().slice(0, 10); };
const maxDate = (a: string, b: string) => (a > b ? a : b);

// Whole-file snapshots (and the fewsnet windowed snapshot) carry a freshness window we can
// skip against. Forex/comtrade dedup per unit inside their executors instead.
const hasFreshnessWindow = (step: Step) => step.kind === "snapshot" || step.kind === "fewsnet";

// Circuit breaker for the dated forex loop: a single failed day is skipped and we move on,
// but this many failures IN A ROW means the host is down (e.g. CBE timing out ~1m/day) —
// so we abandon the rest of that step instead of grinding through every remaining date.
const MAX_CONSECUTIVE_FAILS = 3;

async function runForex(step: Step, mode: Mode): Promise<number> {
  const end = today();
  let start: string;
  // Only `backfill` walks full history (to fill old gaps). Every other mode — including
  // `all` — uses a short incremental window, so a routine run doesn't re-attempt every
  // non-trading weekend/holiday in the archive. Existing dates are skipped via the ledger
  // either way; this just bounds how far back we even look.
  if (mode === "backfill") start = step.floor ?? daysAgo(3650);
  else start = maxDate(step.floor ?? daysAgo(7), daysAgo(7)); // incremental window, never before floor
  const executor = executors[step.id]!;
  const task = getProviderConfig(step.id)!.tasks[step.task]!;

  const dates = generateDateRange(start, end);
  let total = 0, failed = 0, idx = 0, current = "", consecutive = 0, aborted = false;
  let callStart = Date.now();
  // Live line: which day we're on, how many records saved, and — once a single call
  // runs long — how long it's been waiting (so a stalled host is obvious, not silent).
  const hb = startHeartbeat(() => {
    const waited = Date.now() - callStart;
    const slow = waited > 3000 ? ` ⏳ ${formatElapsed(waited)}` : "";
    return `    [${idx}/${dates.length}] ${current} — ${total} saved${failed ? `, ${failed} failed` : ""}${slow}`;
  });
  try {
    for (const date of dates) {
      idx++; current = date; callStart = Date.now();
      try {
        total += await executor(task, { date });
        consecutive = 0; // a success (or a cached skip) clears the streak
      } catch (e) {
        failed++; consecutive++;
        logFailed(step.id, date, e instanceof Error ? e.message : "err");
        if (consecutive >= MAX_CONSECUTIVE_FAILS) { aborted = true; break; }
      }
    }
  } finally { hb.stop(); }
  if (aborted) console.log(`    ⚠ ${consecutive} failures in a row — host likely down; abandoning ${step.id} ${step.task} (${dates.length - idx} dates left, see failed_dates.log)`);
  else if (failed) console.log(`    (${failed} day(s) failed — see failed_dates.log)`);
  return total;
}

async function runSnapshot(step: Step, mode: Mode): Promise<number> {
  const executor = executors[step.id]!;
  const task = getProviderConfig(step.id)!.tasks[step.task]!;
  const ctx: { startDate?: string; endDate?: string } = {};
  if (step.kind === "fewsnet") ctx.startDate = (mode === "daily") ? daysAgo(30) : (mode === "weekly") ? daysAgo(120) : (step.floor ?? "2000-01-01");
  if (step.kind === "trade") { const y = new Date().getFullYear(); ctx.startDate = String(y - (step.yearsBack ?? 12)); ctx.endDate = String(y - 1); }
  // Snapshots are one long call that loops internally; show an elapsed-time heartbeat
  // so a slow pull (or one stuck on a hanging host) keeps showing it's alive.
  const t0 = Date.now();
  const hb = startHeartbeat(() => `    working… ${formatElapsed(Date.now() - t0)}`);
  try { return await executor(task, ctx); }
  finally { hb.stop(); }
}

async function main(): Promise<void> {
  const mode = (process.argv[2] as Mode) || "daily";
  if (!["daily", "weekly", "monthly", "all", "backfill"].includes(mode)) {
    console.error(`Usage: bun run src/collect.ts <daily|weekly|monthly|all|backfill>`);
    process.exit(1);
  }
  // Only an explicit FORCE_REFETCH overrides the ledger — `all`/`backfill` no longer do.
  const forced = forceRefetch();

  const steps = PLAN.filter(s => s.groups.includes(mode));
  console.log(`Collecting [${mode}]${forced ? " (FORCE_REFETCH)" : ""} — ${steps.length} provider tasks\n`);

  const runStart = Date.now();
  const summary: Array<{ label: string; count: number; ok: boolean; skipped?: boolean }> = [];
  for (let i = 0; i < steps.length; i++) {
    const step = steps[i]!;
    const label = `${step.id} ${step.task}`;
    const db = getDb(getProviderConfig(step.id)!.domain);

    // Whole-file freshness skip — applies in EVERY mode (including `all`/`backfill`): if a
    // snapshot was already pulled within its cadence window, don't re-download it. Forex and
    // comtrade dedup per date/year inside their executors, so they fall through to run but
    // still skip the units they already have.
    if (!forced && step.cadence && hasFreshnessWindow(step) && isFresh(db, step.id, step.task, CADENCE_MS[step.cadence])) {
      console.log(`▶ [${i + 1}/${steps.length}] ${label} — skip (already fetched within ${step.cadence})\n`);
      summary.push({ label, count: 0, ok: true, skipped: true });
      continue;
    }

    process.stdout.write(`▶ [${i + 1}/${steps.length}] ${label}${step.insecureNote ? " (needs ALLOW_INSECURE_TLS=1)" : ""}\n`);
    const stepStart = Date.now();
    try {
      const count = step.kind === "forex" ? await runForex(step, mode) : await runSnapshot(step, mode);
      // Forex/comtrade record per unit themselves; stamp the ledger for whole-file snapshots
      // so the freshness window above can skip them next time.
      if (hasFreshnessWindow(step)) recordFetch(db, step.id, step.task, "snapshot", count > 0 ? "ok" : "empty", count);
      summary.push({ label, count, ok: true });
      console.log(`  ✓ ${count} records (${formatElapsed(Date.now() - stepStart)})\n`);
    } catch (e) {
      summary.push({ label, count: 0, ok: false });
      logFailed(step.id, today(), e instanceof Error ? e.message : "err");
      console.log(`  ✗ ${e instanceof Error ? e.message : e} (${formatElapsed(Date.now() - stepStart)})\n`);
    }
  }

  closeDatabase();
  const okCount = summary.filter(s => s.ok).length;
  const skippedCount = summary.filter(s => s.skipped).length;
  const totalRecords = summary.reduce((s, x) => s + x.count, 0);
  console.log(`Done [${mode}] in ${formatElapsed(Date.now() - runStart)}: ${okCount}/${summary.length} tasks ok` +
    `${skippedCount ? ` (${skippedCount} skipped, fresh)` : ""}, ${totalRecords} records processed`);
  for (const s of summary) console.log(`  ${s.skipped ? "•" : s.ok ? "✓" : "✗"} ${s.label.padEnd(28)} ${s.skipped ? "skip" : s.count}`);
}

main();
