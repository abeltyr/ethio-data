import { writeFileSync } from "fs";
import { getDb, closeDatabase, dbPath } from "./shared/database";
import { DOMAINS, type Domain } from "./shared/provider_types";
import { listProviders } from "./providers/registry";

// Generates one concise descriptor per domain DB (data/db/<domain>.md) plus a compact
// DATA_PROFILE.md index. These DESCRIBE the data — tables, columns, sources, spans, a small
// breakdown — so a research/analysis agent knows what is where. They never dump rows.
// Run: bun run report

const n = (v: number) => (v ?? 0).toLocaleString("en-US");
const usd = (v: number) => (v == null ? "—" : `$${(v / 1e9).toFixed(2)}B`);
const now = new Date().toISOString().slice(0, 16).replace("T", " ");

function mdTable(headers: string[], rows: (string | number | undefined)[][]): string {
  const head = `| ${headers.join(" | ")} |`;
  const sep = `| ${headers.map(() => "---").join(" | ")} |`;
  const body = rows.length
    ? rows.map(r => `| ${r.map(c => (c ?? "—")).join(" | ")} |`).join("\n")
    : `| ${headers.map(() => "—").join(" | ")} |`;
  return [head, sep, body].join("\n");
}

// Per-domain metadata: the primary fact table, a one-line blurb, and the SQL expression for
// each table's time column (used to compute a date span). Tables not listed here show no span.
const DOMAIN_INFO: Record<Domain, { fact: string; factProvider: boolean; blurb: string; spanExpr: Record<string, string> }> = {
  currency: {
    fact: "exchange_rates", factProvider: true,
    blurb: "Daily official & parallel (black-market) FX rates and gold prices.",
    spanExpr: { exchange_rates: "date", gold_rates: "date", rate_aggregates: "period_value", fetch_log: "fetched_at" },
  },
  prices: {
    fact: "commodity_prices", factProvider: true,
    blurb: "Food / commodity / livestock prices in long format, plus week/month/year roll-ups.",
    spanExpr: { commodity_prices: "date", commodity_aggregates: "period_value", fetch_log: "fetched_at" },
  },
  macro: {
    fact: "economic_indicators", factProvider: true,
    blurb: "Annual macroeconomic indicator series for Ethiopia.",
    spanExpr: { economic_indicators: "period", fetch_log: "fetched_at" },
  },
  trade: {
    fact: "trade_flows", factProvider: true,
    blurb: "Annual export/import flows by HS code, chapter, and bilateral partner.",
    spanExpr: { trade_flows: "period", fetch_log: "fetched_at" },
  },
  property: {
    fact: "property_prices", factProvider: true,
    blurb: "Addis Ababa housing & rent listings (historical 2017–2024 + ongoing snapshots).",
    spanExpr: { property_prices: "COALESCE(listed_date, collected_at)", fetch_log: "fetched_at" },
  },
};

function userTables(db: any): string[] {
  return (db.prepare(`SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name`)
    .all() as Array<{ name: string }>).map(r => r.name);
}
function rowCount(db: any, table: string): number {
  return (db.prepare(`SELECT COUNT(*) c FROM ${table}`).get() as { c: number }).c;
}
function columns(db: any, table: string): string {
  return (db.prepare(`PRAGMA table_info(${table})`).all() as Array<{ name: string; type: string }>)
    .map(c => `${c.name} ${c.type || "TEXT"}`.trim()).join(", ");
}
function span(db: any, table: string, info: Domain): string {
  const expr = DOMAIN_INFO[info].spanExpr[table];
  if (!expr) return "—";
  const r = db.prepare(`SELECT MIN(${expr}) lo, MAX(${expr}) hi FROM ${table}`).get() as { lo: string; hi: string };
  return r?.lo ? `${r.lo} → ${r.hi}` : "—";
}

// A short, domain-specific "what's in here" breakdown.
function breakdown(db: any, domain: Domain): string {
  if (domain === "currency") {
    const codes = (db.prepare(`SELECT c.code, COUNT(*) n FROM exchange_rates e JOIN currencies c ON c.id=e.currency_id
      GROUP BY c.code ORDER BY n DESC LIMIT 12`).all() as Array<{ code: string; n: number }>);
    const gold = rowCount(db, "gold_rates");
    return `Currencies tracked (top by observations): ${codes.map(c => `${c.code} (${n(c.n)})`).join(", ") || "—"}.\n\n` +
      `Gold observations: ${n(gold)}.`;
  }
  if (domain === "prices") {
    const cats = (db.prepare(`SELECT c.category, COUNT(DISTINCT c.id) nc, COUNT(*) np FROM commodity_prices p
      JOIN commodities c ON c.id=p.commodity_id GROUP BY c.category ORDER BY np DESC`).all() as Array<any>);
    return `Markets: ${n(rowCount(db, "markets"))}, commodities: ${n(rowCount(db, "commodities"))}.\n\n` +
      mdTable(["Category", "Commodities", "Prices"], cats.map(c => [c.category, n(c.nc), n(c.np)]));
  }
  if (domain === "macro") {
    const codes = (db.prepare(`SELECT DISTINCT indicator_code FROM economic_indicators ORDER BY indicator_code`).all() as Array<{ indicator_code: string }>);
    return `Distinct indicators: ${n(codes.length)}. Codes: ${codes.slice(0, 24).map(c => `\`${c.indicator_code}\``).join(", ")}${codes.length > 24 ? ", …" : ""}.`;
  }
  if (domain === "trade") {
    const chapters = (db.prepare(`SELECT COUNT(DISTINCT commodity_hs) c FROM trade_flows WHERE length(commodity_hs)=2`).get() as { c: number }).c;
    const partners = (db.prepare(`SELECT COUNT(DISTINCT partner_code) c FROM trade_flows WHERE partner_code<>'0'`).get() as { c: number }).c;
    return `HS 2-digit chapters: ${n(chapters)}. Bilateral partners: ${n(partners)}. Flows: export & import. Aggregate rows use \`commodity_hs='TOTAL'\`, \`partner_code='0'\` = World.`;
  }
  if (domain === "property") {
    const types = (db.prepare(`SELECT listing_type, COUNT(*) c FROM property_prices GROUP BY listing_type ORDER BY c DESC`).all() as Array<any>);
    const regions = (db.prepare(`SELECT COUNT(DISTINCT region) c FROM property_prices`).get() as { c: number }).c;
    return `Regions: ${n(regions)}.\n\n` + mdTable(["Listing type", "Listings"], types.map(t => [t.listing_type, n(t.c)]));
  }
  return "";
}

function writeDomainDoc(domain: Domain): { tables: number; rows: number; span: string } {
  const db = getDb(domain);
  const info = DOMAIN_INFO[domain];
  const out: string[] = [];
  const w = (s = "") => out.push(s);

  w(`# \`${domain}.db\` — Ethiopia data warehouse`);
  w(`\n_Auto-generated ${now} UTC by \`src/report.ts\`. File: \`${dbPath(domain)}\`._`);
  w(`\n${info.blurb} Source/provenance detail: see \`DATA_SOURCES.md\`.`);

  // Sources contributing to this DB.
  w(`\n## Sources\n`);
  const provs = listProviders().filter(p => p.domain === domain);
  const sourceRows = provs.map(p => {
    const rows = info.factProvider
      ? (db.prepare(`SELECT COUNT(*) c FROM ${info.fact} WHERE provider_id=$p`).get({ $p: p.id }) as { c: number }).c
      : rowCount(db, info.fact);
    const sp = info.factProvider
      ? db.prepare(`SELECT MIN(${info.spanExpr[info.fact]}) lo, MAX(${info.spanExpr[info.fact]}) hi FROM ${info.fact} WHERE provider_id=$p`).get({ $p: p.id }) as any
      : { lo: null, hi: null };
    const last = (db.prepare(`SELECT MAX(fetched_at) m FROM fetch_log WHERE provider=$p AND status='ok'`).get({ $p: p.id }) as { m: string | null }).m;
    return [p.id, p.name, n(rows), sp?.lo ? `${sp.lo} → ${sp.hi}` : "—", last ?? "—"];
  });
  // nbe also fills gold_rates (no provider_id column) — note it.
  w(mdTable(["source", "name", "rows (primary table)", "span", "last fetched"], sourceRows));

  // Tables in this DB.
  w(`\n## Tables\n`);
  const tableRows = userTables(db).map(t => [`\`${t}\``, n(rowCount(db, t)), span(db, t, domain), columns(db, t)]);
  w(mdTable(["table", "rows", "span", "columns (type)"], tableRows));

  // Domain breakdown.
  w(`\n## Breakdown\n`);
  w(breakdown(db, domain));

  // Querying.
  w(`\n## Querying\n`);
  w("```bash");
  w(`sqlite3 ${dbPath(domain)} "SELECT * FROM ${info.fact} LIMIT 5;"`);
  w("```");
  if (domain === "prices") {
    w(`\nCPI-deflated (real) prices need the macro DB — attach it:`);
    w("```sql");
    w(`ATTACH '${dbPath("macro")}' AS macro;`);
    w(`SELECT p.date, c.name, p.price AS nominal_etb,`);
    w(`       ROUND(p.price / cpi.value * 100, 4) AS real_etb_2010`);
    w(`FROM commodity_prices p JOIN commodities c ON c.id=p.commodity_id`);
    w(`JOIN macro.economic_indicators cpi ON cpi.indicator_code='FP.CPI.TOTL'`);
    w(`  AND cpi.provider_id='worldbank' AND cpi.period=substr(p.date,1,4)`);
    w(`WHERE p.currency='ETB' LIMIT 20;`);
    w("```");
  }

  const path = dbPath(domain).replace(/\.db$/, ".md");
  writeFileSync(path, out.join("\n") + "\n");
  const totalRows = userTables(db).reduce((s, t) => s + rowCount(db, t), 0);
  const sp = db.prepare(`SELECT MIN(${info.spanExpr[info.fact]}) lo, MAX(${info.spanExpr[info.fact]}) hi FROM ${info.fact}`).get() as any;
  console.log(`  wrote ${path}`);
  return { tables: userTables(db).length, rows: totalRows, span: sp?.lo ? `${sp.lo} → ${sp.hi}` : "—" };
}

function writeIndex(summary: Record<Domain, { tables: number; rows: number; span: string }>): void {
  const out: string[] = [];
  const w = (s = "") => out.push(s);

  w(`# Ethiopia Economic Data Warehouse — Data Profile`);
  w(`\n_Auto-generated ${now} UTC by \`src/report.ts\`. Per-domain SQLite files under \`data/db/\`._`);
  w(`\nData is split into domain databases. Each \`data/db/<domain>.db\` has a matching`);
  w(`\`data/db/<domain>.md\` describing its tables, sources, and breakdown. Regenerate with \`bun run report\`.`);

  w(`\n## Databases\n`);
  w(mdTable(["domain DB", "tables", "rows", "span", "doc"],
    DOMAINS.map(d => [`\`${dbPath(d)}\``, summary[d].tables, n(summary[d].rows), summary[d].span, `\`data/db/${d}.md\``])));

  // Small cross-cutting summaries (all within a single domain DB).
  const trade = getDb("trade");
  w(`\n## Trade balance (USD)\n`);
  w(mdTable(["Year", "Exports", "Imports", "Balance", "Coverage %"],
    (trade.prepare(`SELECT * FROM v_trade_balance ORDER BY period`).all() as any[])
      .map(r => [r.period, usd(r.exports_usd), usd(r.imports_usd), usd(r.balance_usd), `${r.export_coverage_pct}%`])));

  const sigYears = (trade.prepare(`SELECT DISTINCT period FROM trade_flows WHERE flow='export' ORDER BY period`).all() as any[]).map(r => r.period).slice(-8);
  const sig = trade.prepare(`SELECT commodity_hs, period, ROUND(value_usd/1e6,1) v FROM trade_flows
    WHERE flow='export' AND commodity_hs IN ('0901','1211','41') ORDER BY period`).all() as any[];
  const byHs: Record<string, Record<string, number>> = { "0901": {}, "1211": {}, "41": {} };
  for (const r of sig) if (byHs[r.commodity_hs]) byHs[r.commodity_hs]![r.period] = r.v;
  w(`\n## Signature exports — value trend (USD millions)\n`);
  w(mdTable(["Commodity", ...sigYears],
    [["Coffee (0901)", "0901"], ["Khat (1211)", "1211"], ["Hides/leather (ch.41)", "41"]]
      .map(([label, hs]) => [label!, ...sigYears.map(y => byHs[hs!]?.[y] ?? "—")])));

  const cur = getDb("currency");
  w(`\n## Informal market — parallel FX premium\n`);
  w(`Parallel (black-market) vs official rate. A persistent positive premium signals FX scarcity.`);
  w(``);
  w(mdTable(["Currency", "Avg premium %", "Min %", "Max %", "Months"],
    (cur.prepare(`SELECT currency, ROUND(AVG(premium_pct),1) a, ROUND(MIN(premium_pct),1) lo, ROUND(MAX(premium_pct),1) hi, COUNT(*) m
       FROM v_informal_fx_premium GROUP BY currency ORDER BY a DESC LIMIT 8`).all() as any[])
      .map(r => [r.currency, r.a, r.lo, r.hi, r.m])));

  w(`\n## Cross-domain analysis\n`);
  w(`CPI-deflated real commodity prices span the \`prices\` and \`macro\` DBs — see the ATTACH`);
  w(`query in \`data/db/prices.md\`. Ready-made packs: \`analysis/informal_market.sql\` (currency.db),`);
  w(`\`analysis/trade_deep_dive.sql\` (trade.db).`);

  w(`\n## Collecting / refreshing\n`);
  w("```bash");
  w(`bun run collect:daily      # forex + ECX (daily cron); skips already-fetched units`);
  w(`bun run collect:all        # every provider; still skips already-fetched units (ledger)`);
  w(`FORCE_REFETCH=1 bun run collect:all   # ignore the ledger and re-pull everything`);
  w(`bun run report             # regenerate these docs`);
  w(`bun run split              # one-time: split legacy exchange_rates.db into data/db/*.db`);
  w("```");
  w(`\nProvider/source detail, cadence, and known gaps: see \`DATA_SOURCES.md\`.`);

  writeFileSync("DATA_PROFILE.md", out.join("\n") + "\n");
  console.log(`  wrote DATA_PROFILE.md`);
}

function main(): void {
  console.log(`Generating data docs…`);
  const summary = {} as Record<Domain, { tables: number; rows: number; span: string }>;
  for (const d of DOMAINS) summary[d] = writeDomainDoc(d);
  writeIndex(summary);
  closeDatabase();
}

main();
