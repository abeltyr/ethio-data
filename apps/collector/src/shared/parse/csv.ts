import Papa from "papaparse";

export type CsvRow = Record<string, string>;

// Parse a CSV string into objects keyed by header. Handles quoted fields/commas.
export function parseCsv(text: string): CsvRow[] {
  const result = Papa.parse<CsvRow>(text, {
    header: true,
    skipEmptyLines: true,
    transformHeader: h => h.trim(),
  });
  return result.data;
}

// Some humanitarian CSVs (WFP/HDX) carry an extra HXL "#tag" row directly after
// the header. Drop the first data row when its values look like HXL tags.
export function dropHxlRow(rows: CsvRow[]): CsvRow[] {
  if (rows.length === 0) return rows;
  const first = rows[0]!;
  const looksHxl = Object.values(first).some(v => typeof v === "string" && v.trim().startsWith("#"));
  return looksHxl ? rows.slice(1) : rows;
}

// Row-by-row parse for very large CSVs, to avoid building one giant array in memory.
export function parseCsvEach(text: string, onRow: (row: CsvRow) => void): void {
  Papa.parse<CsvRow>(text, {
    header: true,
    skipEmptyLines: true,
    transformHeader: h => h.trim(),
    step: result => onRow(result.data),
  });
}

export function toNumber(value: string | undefined | null): number | null {
  if (value === undefined || value === null || value === "") return null;
  const n = Number(String(value).replace(/,/g, "").trim());
  return Number.isFinite(n) ? n : null;
}
