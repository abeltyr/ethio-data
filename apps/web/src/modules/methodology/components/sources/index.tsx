import { SectionHeader } from "@/modules/common/components/sectionHeader";

const ROWS = [
  {
    domain: "Currency & FX",
    sources: "NBE, CBE, Zemen, Hibret, black-market, parallel",
    cadence: "Daily",
    note: "Official bank rates plus the street rate and gold.",
  },
  {
    domain: "Prices",
    sources: "WFP, FEWS NET, FAOSTAT, World Bank, ECX",
    cadence: "Weekly / monthly",
    note: "Market food and commodity prices, plus global benchmarks.",
  },
  {
    domain: "Macro",
    sources: "World Bank, IMF",
    cadence: "Annual",
    note: "Inflation, growth, and national indicators back to 1960.",
  },
  {
    domain: "Trade",
    sources: "UN Comtrade",
    cadence: "Annual",
    note: "Exports and imports by HS code and partner, through 2023.",
  },
  {
    domain: "Housing",
    sources: "realethio, Zenodo",
    cadence: "Snapshots",
    note: "Addis Ababa listings, historical and ongoing.",
  },
];

export function Sources() {
  return (
    <section className="sp-x py-14">
      <SectionHeader
        eyebrow="Where it comes from"
        amharic="ምንጮች"
        title="Five domains, named sources"
        note="Each subject database is filled by a small set of public and private sources, collected on a schedule and stored as-is. Nothing is hand-entered; every number traces back to a source."
      />
      <div className="mt-8 overflow-x-auto rounded-md border border-border bg-card">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-border border-b text-left">
              <th className="eyebrow px-4 py-3 text-muted-foreground">
                Domain
              </th>
              <th className="eyebrow px-4 py-3 text-muted-foreground">
                Sources
              </th>
              <th className="eyebrow px-4 py-3 text-muted-foreground">
                Cadence
              </th>
              <th className="eyebrow px-4 py-3 text-muted-foreground">Notes</th>
            </tr>
          </thead>
          <tbody>
            {ROWS.map((r) => (
              <tr
                key={r.domain}
                className="border-border border-b last:border-0"
              >
                <td className="whitespace-nowrap px-4 py-3 font-medium">
                  {r.domain}
                </td>
                <td className="px-4 py-3 text-muted-foreground">{r.sources}</td>
                <td className="tnum whitespace-nowrap px-4 py-3 tabular-nums">
                  {r.cadence}
                </td>
                <td className="px-4 py-3 text-muted-foreground">{r.note}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
