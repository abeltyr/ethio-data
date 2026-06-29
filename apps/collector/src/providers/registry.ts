import type { ProviderConfig } from "@ethiodata/types";

export const NBE_PROVIDER: ProviderConfig = {
  id: "nbe",
  name: "National Bank of Ethiopia",
  type: "nbe",
  domain: "currency",
  api_url: "https://api.nbe.gov.et/api",
  tasks: {
    daily: { id: "daily", name: "Daily Exchange Rates", kind: "dated", endpoint: "/filter-exchange-rates" },
    gold: { id: "gold", name: "Gold Rates", kind: "dated", endpoint: "/filter-gold-rates" },
  }
};

export const CBE_PROVIDER: ProviderConfig = {
  id: "cbe",
  name: "Commercial Bank of Ethiopia",
  type: "bank",
  domain: "currency",
  api_url: "https://combanketh.et/cbeapi",
  tasks: {
    daily: { id: "daily", name: "Daily Exchange Rates", kind: "dated", endpoint: "/daily-exchange-rates/" },
  }
};

export const BLACKMARKET_PROVIDER: ProviderConfig = {
  id: "blackmarket",
  name: "Black Market",
  type: "black_market",
  domain: "currency",
  tasks: { import: { id: "import", name: "Import Historical Data", kind: "import" } }
};

export const WFP_PROVIDER: ProviderConfig = {
  id: "wfp",
  name: "WFP Food Prices (Ethiopia)",
  type: "food_security",
  domain: "prices",
  api_url: "https://data.humdata.org",
  tasks: { prices: { id: "prices", name: "Market Food/Livestock Prices", kind: "snapshot" } }
};

export const FEWSNET_PROVIDER: ProviderConfig = {
  id: "fewsnet",
  name: "FEWS NET Market Prices",
  type: "food_security",
  domain: "prices",
  api_url: "https://fdw.fews.net/api",
  tasks: { prices: { id: "prices", name: "Market & Livestock Prices", kind: "snapshot" } }
};

export const WORLDBANK_PROVIDER: ProviderConfig = {
  id: "worldbank",
  name: "World Bank Indicators",
  type: "macro",
  domain: "macro",
  api_url: "https://api.worldbank.org/v2",
  tasks: { macro: { id: "macro", name: "Macro Indicators", kind: "snapshot" } }
};

export const IMF_PROVIDER: ProviderConfig = {
  id: "imf",
  name: "IMF DataMapper (WEO)",
  type: "macro",
  domain: "macro",
  api_url: "https://www.imf.org/external/datamapper/api/v1",
  tasks: { macro: { id: "macro", name: "WEO Indicators & Forecasts", kind: "snapshot" } }
};

export const COMTRADE_PROVIDER: ProviderConfig = {
  id: "comtrade",
  name: "UN Comtrade (Ethiopia Trade)",
  type: "trade",
  domain: "trade",
  api_url: "https://comtradeapi.un.org/public/v1/preview/C/A/HS",
  tasks: {
    trade: { id: "trade", name: "Annual Export/Import Flows (detailed HS)", kind: "snapshot" },
    basket: { id: "basket", name: "Full Basket + Trade Balance (HS chapters + TOTAL)", kind: "snapshot" },
    partners: { id: "partners", name: "Bilateral Trade by Partner Country", kind: "snapshot" },
  }
};

export const WORLDBANK_PINKSHEET_PROVIDER: ProviderConfig = {
  id: "worldbank_pinksheet",
  name: "World Bank Pink Sheet (Global Benchmarks)",
  type: "commodity",
  domain: "prices",
  api_url: "https://www.worldbank.org/en/research/commodity-markets",
  tasks: { prices: { id: "prices", name: "Monthly Benchmark Prices (coffee, gold, oil)", kind: "snapshot" } }
};

export const FAOSTAT_PROVIDER: ProviderConfig = {
  id: "faostat",
  name: "FAOSTAT Producer Prices (Ethiopia)",
  type: "commodity",
  domain: "prices",
  api_url: "https://data.humdata.org",
  tasks: { producer: { id: "producer", name: "Annual Producer Prices", kind: "snapshot" } }
};

export const WORLDBANK_RTP_PROVIDER: ProviderConfig = {
  id: "worldbank_rtp",
  name: "World Bank Real-Time Prices (Ethiopia, est.)",
  type: "commodity",
  domain: "prices",
  api_url: "https://data.humdata.org",
  tasks: { prices: { id: "prices", name: "Monthly Market Prices (ML-imputed)", kind: "snapshot" } }
};

export const ZEMEN_PROVIDER: ProviderConfig = {
  id: "zemen",
  name: "Zemen Bank",
  type: "bank",
  domain: "currency",
  api_url: "https://zemenbank.com",
  tasks: { daily: { id: "daily", name: "Daily Exchange Rates", kind: "dated" } }
};

export const HIBRET_PROVIDER: ProviderConfig = {
  id: "hibret",
  name: "Hibret Bank",
  type: "bank",
  domain: "currency",
  api_url: "https://www.hibretbank.com.et",
  tasks: { daily: { id: "daily", name: "Today's Exchange Rates", kind: "snapshot", endpoint: "/exchange-rate/" } }
};

export const REALETHIO_PROVIDER: ProviderConfig = {
  id: "realethio",
  name: "realethio.com Property Listings",
  type: "property",
  domain: "property",
  api_url: "https://realethio.com",
  tasks: { listings: { id: "listings", name: "Current Housing/Rent Listings", kind: "snapshot" } }
};

export const REALESTATE_HIST_PROVIDER: ProviderConfig = {
  id: "realestate_hist",
  name: "Addis Ababa Real Estate (Zenodo 2017–2024)",
  type: "property",
  domain: "property",
  api_url: "https://zenodo.org/records/11205969",
  tasks: { historical: { id: "historical", name: "Historical Housing/Rent (CSV)", kind: "snapshot" } }
};

export const PARALLEL_FX_PROVIDER: ProviderConfig = {
  id: "parallel",
  name: "Parallel (black-market) FX",
  type: "black_market",
  domain: "currency",
  api_url: "https://www.ethiopianforexrates.com",
  tasks: { rates: { id: "rates", name: "Recent Parallel Rates", kind: "snapshot" } }
};

export const TWOMERKATO_PROVIDER: ProviderConfig = {
  id: "twomerkato",
  name: "2merkato (ECX Daily Trade Data)",
  type: "commodity",
  domain: "prices",
  api_url: "https://www.2merkato.com",
  tasks: { ecx: { id: "ecx", name: "ECX Coffee/Sesame Avg Prices", kind: "snapshot" } }
};

// Central registry. Add new providers here and to providers/dispatch.ts.
const REGISTRY: Record<string, ProviderConfig> = {
  nbe: NBE_PROVIDER,
  cbe: CBE_PROVIDER,
  blackmarket: BLACKMARKET_PROVIDER,
  wfp: WFP_PROVIDER,
  fewsnet: FEWSNET_PROVIDER,
  worldbank: WORLDBANK_PROVIDER,
  imf: IMF_PROVIDER,
  comtrade: COMTRADE_PROVIDER,
  worldbank_pinksheet: WORLDBANK_PINKSHEET_PROVIDER,
  faostat: FAOSTAT_PROVIDER,
  worldbank_rtp: WORLDBANK_RTP_PROVIDER,
  zemen: ZEMEN_PROVIDER,
  hibret: HIBRET_PROVIDER,
  twomerkato: TWOMERKATO_PROVIDER,
  realethio: REALETHIO_PROVIDER,
  realestate_hist: REALESTATE_HIST_PROVIDER,
  parallel: PARALLEL_FX_PROVIDER,
};

export function registerProvider(config: ProviderConfig): void {
  REGISTRY[config.id] = config;
}

export function getProviderConfig(id: string): ProviderConfig | undefined {
  return REGISTRY[id];
}

export function listProviders(): ProviderConfig[] {
  return Object.values(REGISTRY);
}
