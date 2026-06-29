import type { ExecCtx } from "../dispatch";

export const FLOW: Record<string, "export" | "import"> = { X: "export", M: "import" };
export const QTY_UNITS: Record<number, string> = { 8: "kg", 5: "u", 1: "no qty" };

export interface ComtradeRow {
  period: string;
  flowCode: string;
  cmdCode: string;
  partnerCode: number;
  partner2Code?: number;
  motCode?: number;
  customsCode?: string | null;
  partnerDesc: string | null;
  qty: number | null;
  qtyUnitCode: number | null;
  netWgt: number | null;
  primaryValue: number | null;
  fobvalue: number | null;
}

export interface ComtradeResponse { count: number; data: ComtradeRow[]; error?: string }

// Older Comtrade years return several breakdown rows (by mode-of-transport / customs /
// second partner) for the same flow+commodity. Keep only the fully-aggregated row so
// totals aren't double-counted. Recent years already return just this row.
export function isAggregateRow(r: ComtradeRow): boolean {
  const motOk = r.motCode == null || r.motCode === 0;
  const p2Ok = r.partner2Code == null || r.partner2Code === 0;
  const custOk = r.customsCode == null || r.customsCode === "" || r.customsCode === "C00";
  return motOk && p2Ok && custOk;
}

export function yearRange(ctx: ExecCtx, defaultStart: number): string[] {
  const now = new Date().getFullYear();
  const start = parseInt(ctx.startDate || "") || defaultStart;
  const end = parseInt(ctx.endDate || "") || now - 1; // current year rarely complete
  const years: string[] = [];
  for (let y = start; y <= end; y++) years.push(String(y));
  return years;
}
