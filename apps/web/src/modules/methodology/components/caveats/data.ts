export type Faq = { q: string; a: string };

/** Honest caveats, in Q&A form — reused by the component and the page's FAQPage JSON-LD. */
export const FAQ: Faq[] = [
  {
    q: "How current is the data?",
    a: "It depends on the series. Exchange rates are daily from roughly 2021; food and commodity prices are weekly or monthly back to 2000; macro and trade are annual, and trade currently ends in 2023. Every figure updates with each collection run.",
  },
  {
    q: "Are the trade figures complete?",
    a: "They are annual UN Comtrade records for Ethiopia through 2023. Khat exports and a good deal of overland cross-border trade are under-reported in official statistics, so recorded values are a floor, not the true total.",
  },
  {
    q: "Is the parallel exchange rate official?",
    a: "No. The parallel (black-market) rate is gathered from informal sources and is indicative, not audited. The official rate comes from the banks. The gap between them — the premium — is the signal worth watching.",
  },
  {
    q: "How is inflation handled?",
    a: "Inflation comes from the World Bank consumer price index. To compare prices honestly across years, divide a nominal price by the CPI to get a real, inflation-adjusted figure.",
  },
  {
    q: "Are housing prices sale prices?",
    a: "No — they are asking prices from listings, cover Addis Ababa, and reflect what was collected rather than the entire market. Use medians for typical values.",
  },
  {
    q: "Can I reproduce these numbers?",
    a: "Yes. Every figure on this site is queried live from open per-domain SQLite databases, and the collector that fills them is open source. Nothing is hand-entered.",
  },
];
