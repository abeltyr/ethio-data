import "server-only";
import { count, type Point, row, rows } from "./db";

export type HousingSummaryRow = {
  listing_type: string;
  bedrooms: number;
  listings: number;
  avg_price: number;
  avg_price_per_sqm: number;
};
export type RawListing = {
  listing_type: string;
  property_type: string | null;
  region: string | null;
  bedrooms: number | null;
  size_sqm: number | null;
  price: number;
  currency: string;
  price_sqm: number | null;
};

export function summaryByBedroom(): HousingSummaryRow[] {
  return rows<HousingSummaryRow>(
    "property",
    `SELECT listing_type, bedrooms, listings, avg_price, avg_price_per_sqm
     FROM v_housing_summary
     WHERE region='Addis Ababa' AND bedrooms BETWEEN 1 AND 5
     ORDER BY listing_type, bedrooms`,
  );
}

export function monthlyTrend(listingType: string): Point[] {
  return rows<Point>(
    "property",
    `SELECT month AS x, avg_price AS y FROM v_housing_monthly
     WHERE listing_type = ? AND avg_price > 0 ORDER BY month`,
    listingType,
  );
}

export function listingTypes(): { listing_type: string; listings: number }[] {
  return rows(
    "property",
    "SELECT listing_type, COUNT(*) AS listings FROM property_prices GROUP BY listing_type ORDER BY listings DESC",
  );
}

export function rawListings(limit = 40): RawListing[] {
  return rows<RawListing>(
    "property",
    `SELECT listing_type, property_type, region, bedrooms, size_sqm, price, currency, price_sqm
     FROM property_prices ORDER BY COALESCE(listed_date, collected_at) DESC LIMIT ?`,
    limit,
  );
}

export function coverage() {
  return {
    listings: count("property", "property_prices"),
    regions:
      row<{ n: number }>(
        "property",
        "SELECT COUNT(DISTINCT region) AS n FROM property_prices",
      )?.n ?? 0,
    span: row<{ lo: string; hi: string }>(
      "property",
      "SELECT MIN(COALESCE(listed_date,collected_at)) lo, MAX(COALESCE(listed_date,collected_at)) hi FROM property_prices",
    ),
  };
}
