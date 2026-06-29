import * as XLSX from "xlsx";

// Read a worksheet as an array-of-arrays (row 0 = first row). `blankrows:false`
// drops fully-empty rows. Cells are strings/numbers as stored.
export function readSheetMatrix(buf: ArrayBuffer, sheetName: string): any[][] {
  const wb = XLSX.read(buf, { type: "array" });
  const ws = wb.Sheets[sheetName];
  if (!ws) throw new Error(`Sheet not found: ${sheetName} (have: ${wb.SheetNames.join(", ")})`);
  return XLSX.utils.sheet_to_json(ws, { header: 1, blankrows: false }) as any[][];
}
