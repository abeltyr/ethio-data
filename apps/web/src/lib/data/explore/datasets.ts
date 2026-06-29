import type { Domain } from "@ethiodata/types";

export type ColType = "text" | "number" | "date";

export type ExploreColumn = {
  key: string;
  label: string;
  type: ColType;
  /** SQL expression (trusted, author-written) — defaults to the key. */
  expr?: string;
  sortable?: boolean;
  search?: boolean; // included in the free-text search
  facet?: boolean; // low-cardinality → dropdown filter
  mono?: boolean;
  help?: string;
};

export type Dataset = {
  id: string;
  domain: Domain;
  label: string;
  description: string;
  /** Trusted FROM clause (table/view/join). Never built from user input. */
  from: string;
  columns: ExploreColumn[];
  defaultSort: { key: string; dir: "asc" | "desc" };
  /** Numeric column summarised in the stats bar. */
  measure?: string;
  /** Date/period column used for the range filter. */
  dateKey?: string;
};

export const DATASETS: Dataset[] = [
  {
    id: "fx",
    domain: "currency",
    label: "Exchange rates",
    description:
      "Daily official and parallel buying/selling rates, by source and currency.",
    from: "exchange_rates e JOIN currencies c ON c.id = e.currency_id",
    dateKey: "date",
    measure: "selling",
    defaultSort: { key: "date", dir: "desc" },
    columns: [
      {
        key: "date",
        label: "Date",
        type: "date",
        expr: "e.date",
        sortable: true,
        mono: true,
        help: "Trading day.",
      },
      {
        key: "provider_id",
        label: "Source",
        type: "text",
        expr: "e.provider_id",
        facet: true,
        sortable: true,
        help: "Bank or market.",
      },
      {
        key: "code",
        label: "Currency",
        type: "text",
        expr: "c.code",
        facet: true,
        search: true,
        sortable: true,
        help: "ISO currency code.",
      },
      {
        key: "buying",
        label: "Buying",
        type: "number",
        expr: "e.buying",
        sortable: true,
        mono: true,
        help: "Birr to buy one unit.",
      },
      {
        key: "selling",
        label: "Selling",
        type: "number",
        expr: "e.selling",
        sortable: true,
        mono: true,
        help: "Birr to sell one unit.",
      },
    ],
  },
  {
    id: "prices",
    domain: "prices",
    label: "Commodity prices",
    description:
      "Market food, livestock, and commodity prices, by category, commodity, and place.",
    from: "v_commodity_prices",
    dateKey: "date",
    measure: "price",
    defaultSort: { key: "date", dir: "desc" },
    columns: [
      {
        key: "date",
        label: "Date",
        type: "date",
        sortable: true,
        mono: true,
        help: "Observation date.",
      },
      {
        key: "category",
        label: "Category",
        type: "text",
        facet: true,
        sortable: true,
        help: "Broad group.",
      },
      {
        key: "commodity",
        label: "Commodity",
        type: "text",
        search: true,
        sortable: true,
        help: "Specific good.",
      },
      {
        key: "market",
        label: "Market",
        type: "text",
        search: true,
        sortable: true,
        help: "Town or 'national'.",
      },
      {
        key: "price",
        label: "Price",
        type: "number",
        sortable: true,
        mono: true,
        help: "Price per unit.",
      },
      {
        key: "currency",
        label: "Ccy",
        type: "text",
        facet: true,
        help: "Currency (usually ETB).",
      },
      {
        key: "price_type",
        label: "Type",
        type: "text",
        facet: true,
        help: "Retail/wholesale/farmgate.",
      },
      {
        key: "provider_id",
        label: "Source",
        type: "text",
        facet: true,
        help: "Collecting agency.",
      },
    ],
  },
  {
    id: "macro",
    domain: "macro",
    label: "Macro indicators",
    description:
      "Annual macroeconomic indicator readings from the World Bank and IMF.",
    from: "economic_indicators",
    dateKey: "period",
    measure: "value",
    defaultSort: { key: "period", dir: "desc" },
    columns: [
      {
        key: "indicator_code",
        label: "Code",
        type: "text",
        facet: true,
        search: true,
        sortable: true,
        mono: true,
        help: "Series code.",
      },
      {
        key: "indicator_name",
        label: "Indicator",
        type: "text",
        search: true,
        sortable: true,
        help: "What it measures.",
      },
      {
        key: "period",
        label: "Year",
        type: "date",
        sortable: true,
        mono: true,
        help: "Year.",
      },
      {
        key: "value",
        label: "Value",
        type: "number",
        sortable: true,
        mono: true,
        help: "Reading.",
      },
      {
        key: "unit",
        label: "Unit",
        type: "text",
        facet: true,
        help: "Unit where given.",
      },
      {
        key: "provider_id",
        label: "Source",
        type: "text",
        facet: true,
        help: "World Bank or IMF.",
      },
    ],
  },
  {
    id: "trade",
    domain: "trade",
    label: "Trade flows",
    description:
      "Annual export and import flows by product and partner country.",
    from: "trade_flows",
    dateKey: "period",
    measure: "value_usd",
    defaultSort: { key: "value_usd", dir: "desc" },
    columns: [
      {
        key: "period",
        label: "Year",
        type: "date",
        facet: true,
        sortable: true,
        mono: true,
        help: "Year.",
      },
      {
        key: "flow",
        label: "Flow",
        type: "text",
        facet: true,
        sortable: true,
        help: "export or import.",
      },
      {
        key: "commodity_hs",
        label: "HS",
        type: "text",
        search: true,
        sortable: true,
        mono: true,
        help: "Product code.",
      },
      {
        key: "commodity_desc",
        label: "Commodity",
        type: "text",
        search: true,
        sortable: true,
        help: "Product name.",
      },
      {
        key: "partner",
        label: "Partner",
        type: "text",
        facet: true,
        search: true,
        sortable: true,
        help: "Partner country.",
      },
      {
        key: "value_usd",
        label: "Value (USD)",
        type: "number",
        sortable: true,
        mono: true,
        help: "Trade value, USD.",
      },
    ],
  },
  {
    id: "property",
    domain: "property",
    label: "Housing listings",
    description:
      "Addis Ababa house and rent listings by type, size, and price.",
    from: "property_prices",
    measure: "price",
    defaultSort: { key: "collected_at", dir: "desc" },
    columns: [
      {
        key: "collected_at",
        label: "Collected",
        type: "date",
        sortable: true,
        mono: true,
        help: "When the listing was captured.",
      },
      {
        key: "listing_type",
        label: "Type",
        type: "text",
        facet: true,
        sortable: true,
        help: "Sale or rent.",
      },
      {
        key: "property_type",
        label: "Property",
        type: "text",
        facet: true,
        help: "House, apartment…",
      },
      {
        key: "region",
        label: "Region",
        type: "text",
        facet: true,
        sortable: true,
        help: "Location.",
      },
      {
        key: "bedrooms",
        label: "Beds",
        type: "number",
        facet: true,
        sortable: true,
        mono: true,
        help: "Bedrooms.",
      },
      {
        key: "size_sqm",
        label: "m²",
        type: "number",
        sortable: true,
        mono: true,
        help: "Floor area.",
      },
      {
        key: "price",
        label: "Price",
        type: "number",
        sortable: true,
        mono: true,
        help: "Asking price.",
      },
      {
        key: "price_sqm",
        label: "Price/m²",
        type: "number",
        sortable: true,
        mono: true,
        help: "Price per m².",
      },
    ],
  },
];

export const datasetById = (id: string): Dataset | undefined =>
  DATASETS.find((d) => d.id === id);
export const colExpr = (c: ExploreColumn): string => c.expr ?? c.key;

export type Summary = {
  n: number;
  min: number;
  max: number;
  avg: number;
  sum: number;
};

/** Shape returned by GET /api/explore. */
export type ExploreResponse = {
  meta: DatasetMeta;
  rows: Record<string, unknown>[];
  total: number;
  page: number;
  pageSize: number;
  summary: Summary | null;
  facets: Record<string, (string | number)[]>;
};

/** Serializable view of a dataset for the client (no SQL exposed). */
export type DatasetMeta = {
  id: string;
  label: string;
  description: string;
  columns: {
    key: string;
    label: string;
    type: ColType;
    sortable: boolean;
    mono: boolean;
    help?: string;
  }[];
  facetKeys: string[];
  searchable: boolean;
  measure?: string;
  measureLabel?: string;
  dateKey?: string;
  defaultSort: { key: string; dir: "asc" | "desc" };
};

export function datasetMeta(d: Dataset): DatasetMeta {
  return {
    id: d.id,
    label: d.label,
    description: d.description,
    columns: d.columns.map((c) => ({
      key: c.key,
      label: c.label,
      type: c.type,
      sortable: !!c.sortable,
      mono: !!c.mono,
      help: c.help,
    })),
    facetKeys: d.columns.filter((c) => c.facet).map((c) => c.key),
    searchable: d.columns.some((c) => c.search),
    measure: d.measure,
    measureLabel: d.columns.find((c) => c.key === d.measure)?.label,
    dateKey: d.dateKey,
    defaultSort: d.defaultSort,
  };
}
