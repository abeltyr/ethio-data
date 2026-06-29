import type { Domain } from "@ethiodata/types";

export const site = {
  name: process.env.SITE_NAME || "Ethiopia Economic Data",
  short: "EthioData",
  amharic: "የኢትዮጵያ ኢኮኖሚ መረጃ",
  description:
    process.env.SITE_DESCRIPTION ||
    "An open research warehouse of Ethiopian economic data — exchange rates, food and commodity prices, macro indicators, trade flows, and housing — shown raw and analysed.",
  url: process.env.NEXT_PUBLIC_DOMAIN_URL || "https://ethiodata.example",
  ogImage: process.env.NEXT_PUBLIC_DOMAIN_IMAGE || "/og.png",
  publisher: "Ethiopia Economic Data",
};

export type DomainNav = {
  key: Domain;
  href: string;
  label: string;
  amharic: string;
  tagline: string;
  sources: string;
};

/** The five subject databases — reused by nav, home, and footer. */
export const DOMAINS: DomainNav[] = [
  {
    key: "currency",
    href: "/currency",
    label: "Currency & FX",
    amharic: "ብር",
    tagline: "Official and parallel exchange rates, and gold.",
    sources: "NBE · CBE · Zemen · Hibret · black-market · parallel",
  },
  {
    key: "prices",
    href: "/prices",
    label: "Prices",
    amharic: "ዋጋ",
    tagline: "Food, commodity, and livestock prices across markets.",
    sources: "WFP · FEWS NET · FAOSTAT · World Bank · ECX",
  },
  {
    key: "macro",
    href: "/macro",
    label: "Macro",
    amharic: "ማክሮ",
    tagline: "Inflation, growth, and national indicators.",
    sources: "World Bank · IMF",
  },
  {
    key: "trade",
    href: "/trade",
    label: "Trade",
    amharic: "ንግድ",
    tagline: "Exports, imports, the deficit, and partners.",
    sources: "UN Comtrade",
  },
  {
    key: "property",
    href: "/housing",
    label: "Housing",
    amharic: "ቤት",
    tagline: "Addis Ababa house and rent listings.",
    sources: "realethio · Zenodo",
  },
];

export const NAV = [
  { href: "/", label: "Overview" },
  ...DOMAINS.map((d) => ({ href: d.href, label: d.label })),
  { href: "/analysis", label: "Analysis" },
  { href: "/data", label: "Explore" },
  { href: "/methodology", label: "Methodology" },
];
