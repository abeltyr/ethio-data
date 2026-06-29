import "server-only";
import { row, rows } from "../warehouse/db";
import { colExpr, type Dataset, type Summary } from "./datasets";

export type ExploreParams = {
  page: number;
  pageSize: number;
  sort?: string;
  dir?: "asc" | "desc";
  search?: string;
  from?: string;
  to?: string;
  facets: Record<string, string>;
};

export function runExplore(d: Dataset, p: ExploreParams) {
  const where: string[] = [];
  const args: unknown[] = [];

  for (const [key, value] of Object.entries(p.facets)) {
    const col = d.columns.find((c) => c.key === key && c.facet);
    if (col && value) {
      where.push(`${colExpr(col)} = ?`);
      args.push(value);
    }
  }

  if (d.dateKey && (p.from || p.to)) {
    const dk = d.columns.find((c) => c.key === d.dateKey);
    if (dk) {
      if (p.from) {
        where.push(`${colExpr(dk)} >= ?`);
        args.push(p.from);
      }
      if (p.to) {
        where.push(`${colExpr(dk)} <= ?`);
        args.push(p.to);
      }
    }
  }

  if (p.search) {
    const sc = d.columns.filter((c) => c.search);
    if (sc.length) {
      where.push(`(${sc.map((c) => `${colExpr(c)} LIKE ?`).join(" OR ")})`);
      for (const _ of sc) args.push(`%${p.search}%`);
    }
  }

  const whereSql = where.length ? `WHERE ${where.join(" AND ")}` : "";
  const sortCol =
    d.columns.find((c) => c.key === p.sort && c.sortable) ??
    d.columns.find((c) => c.key === d.defaultSort.key);
  const dir = (p.dir ?? d.defaultSort.dir) === "asc" ? "ASC" : "DESC";
  const orderSql = sortCol ? `ORDER BY ${colExpr(sortCol)} ${dir}` : "";
  const selectSql = d.columns
    .map((c) => `${colExpr(c)} AS "${c.key}"`)
    .join(", ");

  const pageSize = Math.min(Math.max(Math.trunc(p.pageSize) || 25, 1), 100);
  const page = Math.max(Math.trunc(p.page) || 1, 1);
  const offset = (page - 1) * pageSize;

  const data = rows<Record<string, unknown>>(
    d.domain,
    `SELECT ${selectSql} FROM ${d.from} ${whereSql} ${orderSql} LIMIT ? OFFSET ?`,
    ...args,
    pageSize,
    offset,
  );
  const total =
    row<{ n: number }>(
      d.domain,
      `SELECT COUNT(*) n FROM ${d.from} ${whereSql}`,
      ...args,
    )?.n ?? 0;

  let summary: Summary | null = null;
  const measureCol = d.measure
    ? d.columns.find((c) => c.key === d.measure)
    : undefined;
  if (measureCol) {
    const m = colExpr(measureCol);
    summary =
      row<Summary>(
        d.domain,
        `SELECT COUNT(${m}) n, MIN(${m}) min, MAX(${m}) max, AVG(${m}) avg, SUM(${m}) sum FROM ${d.from} ${whereSql}`,
        ...args,
      ) ?? null;
  }

  const facets: Record<string, (string | number)[]> = {};
  for (const c of d.columns.filter((col) => col.facet)) {
    const vals = rows<{ v: string | number }>(
      d.domain,
      `SELECT DISTINCT ${colExpr(c)} v FROM ${d.from} WHERE ${colExpr(c)} IS NOT NULL ORDER BY v LIMIT 80`,
    );
    facets[c.key] = vals.map((x) => x.v);
  }

  return { rows: data, total, page, pageSize, summary, facets };
}
