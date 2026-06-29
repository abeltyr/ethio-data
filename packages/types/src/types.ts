export interface Currency {
  id: string;
  code: string;
  name: string;
}

export interface GoldType {
  id: string;
  karat: string;
  level: string;
}

export interface ExchangeRate {
  id: string;
  provider_id: string;
  currency_id: string;
  currency: { id: string; code: string; name: string };
  date: string;
  buying: number;
  selling: number;
  weighted_average?: number;
  buying_rate?: number;
  selling_rate?: number;
  cash_buying?: number;
  cash_selling?: number;
  transaction_buying?: number;
  transaction_selling?: number;
  avg_buying_rate?: number;
  avg_selling_rate?: number;
}

export interface GoldRate {
  id: string;
  gold_type_id: string;
  price_usd: number;
  price_birr: number;
  date: string;
  gold_type: { id: string; karat: string; level: string };
}

export interface RateAggregate {
  id: string;
  provider_id: string;
  currency_id: string;
  period_type: "day" | "week" | "month" | "year";
  period_value: string;
  avg_buying: number;
  avg_selling: number;
  avg_weighted: number;
  min_buying: number;
  max_buying: number;
  min_selling: number;
  max_selling: number;
  rate_count: number;
}

// ----- Generic economic-data warehouse types -----

export type CommodityCategory =
  | "coffee"
  | "cereal"
  | "pulse"
  | "oilseed"
  | "vegetable"
  | "fruit"
  | "livestock"
  | "meat"
  | "dairy"
  | "fuel"
  | "metal"
  | "other";

export type PriceType = "retail" | "wholesale" | "export" | "producer" | "wage" | "spot";

export interface Commodity {
  id: string;
  code: string;
  name: string;
  category: CommodityCategory;
  unit: string;
}

export interface Market {
  id: string;
  name: string;
  admin1?: string;
  admin2?: string;
  latitude?: number;
  longitude?: number;
  country?: string;
}

export interface CommodityPrice {
  id: string;
  provider_id: string;
  commodity_id: string;
  market_id?: string | null;
  date: string;
  price: number;
  currency: string;
  price_usd?: number | null;
  price_type: PriceType;
  unit: string;
}

export interface EconomicIndicator {
  id: string;
  provider_id: string;
  indicator_code: string;
  indicator_name: string;
  area: string;
  period: string;
  period_type: "year" | "month" | "week" | "day";
  value: number;
  unit?: string | null;
}

export interface TradeFlow {
  id: string;
  provider_id: string;
  reporter: string;
  partner: string;
  partner_code: string;
  commodity_hs: string;
  commodity_desc: string;
  flow: "export" | "import";
  period: string;
  period_type: "year" | "month";
  value_usd: number;
  qty?: number | null;
  qty_unit?: string | null;
}

export interface PropertyPrice {
  id: string;
  provider_id: string;
  source: string;
  listing_type: "sale" | "rent";
  property_type?: string | null;
  region?: string | null;
  area?: string | null;
  bedrooms?: number | null;
  bathrooms?: number | null;
  size_sqm?: number | null;
  price: number;
  currency: string;
  price_sqm?: number | null;
  latitude?: number | null;
  longitude?: number | null;
  listed_date?: string | null;
  collected_at: string;
}

export interface CommodityAggregate {
  id: string;
  provider_id: string;
  commodity_id: string;
  market_id?: string | null;
  price_type: PriceType;
  period_type: "week" | "month" | "year";
  period_value: string;
  avg_price: number;
  min_price: number;
  max_price: number;
  avg_price_usd: number;
  price_count: number;
}
