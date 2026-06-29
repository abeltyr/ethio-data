import * as cheerio from "cheerio";

export function loadHtml(html: string): cheerio.CheerioAPI {
  return cheerio.load(html);
}

// Normalize cell text: collapse whitespace, trim.
export function cellText(s: string): string {
  return s.replace(/\s+/g, " ").trim();
}

// Parse a number from messy HTML cell text ("1,234.56", "ETB 58,000", "—").
export function parseHtmlNumber(s: string): number | null {
  const m = cellText(s).replace(/,/g, "").match(/-?\d+(\.\d+)?/);
  if (!m) return null;
  const n = Number(m[0]);
  return Number.isFinite(n) ? n : null;
}
