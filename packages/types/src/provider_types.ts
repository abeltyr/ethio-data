export type ProviderType =
  | "nbe"
  | "bank"
  | "black_market"
  | "official"
  | "commodity"
  | "food_security"
  | "trade"
  | "macro"
  | "property";

// Which domain database a provider's data lands in. Each domain is one SQLite file under
// DB_DIR (currency.db, prices.db, …) holding only that subject area's tables.
export type Domain = "currency" | "prices" | "macro" | "trade" | "property";

export const DOMAINS: Domain[] = ["currency", "prices", "macro", "trade", "property"];

// "dated"    -> executor is called once per date in a range (forex/gold style)
// "snapshot" -> executor is called once and pulls a whole dataset/series (bulk APIs, CSV dumps)
// "import"   -> executor is called once from a local file
export type TaskKind = "dated" | "snapshot" | "import";

export interface ProviderTaskConfig {
  id: string;
  name: string;
  kind?: TaskKind; // defaults to "dated" when omitted (back-compat with nbe/cbe)
  endpoint?: string;
  method?: string;
}

export interface ProviderConfig {
  id: string;
  name: string;
  type: ProviderType;
  domain: Domain;
  api_url?: string;
  tasks: Record<string, ProviderTaskConfig>;
}
