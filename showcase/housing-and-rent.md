# Housing & Rent

*The cost of a roof in Addis Ababa: house and apartment listings, for sale and for rent.*

Source database: **`property.db`** — see [`../data/db/property.md`](../data/db/property.md) for
exact tables and current coverage.

---

## What's in this data

- **Property listings** for Addis Ababa — a historical dataset (2017–2024) plus ongoing
  snapshots of current listings.
- Each listing carries: **listing type** (sale/rent), **property type**, **region/area**,
  **bedrooms** and **bathrooms**, **size (m²)**, **price** and currency, **price per m²**, and
  (where available) **coordinates** and listed date.
- **Ready-made views**: `v_housing_summary` (by type/region/bedrooms) and `v_housing_monthly`
  (the monthly trend).

---

## How to show it

| You want to show… | Use this chart |
|-------------------|----------------|
| Price by size/type | Bar chart by bedroom count, split sale vs rent |
| Trend over time | Monthly average line (`v_housing_monthly`) |
| Where it's expensive | Ranked bars (or a map) of price-per-m² by area |
| Distribution | Box plot or histogram of prices within a type |
| Supply activity | Listing-count bars over time |

## What to calculate (aggregations)

- **Average and median price** by listing type, bedrooms, and region (median resists outliers —
  prefer it for headlines).
- **Price per square meter** — the fair, size-adjusted comparison across areas.
- **Monthly trend** — average price and listing volume over time.
- **Rent-to-buy ratio** — where both exist, compare typical rent to typical sale price.

## Showcase pages this powers

- **A — Addis Ababa rent & affordability**
- **H — House price per square meter, by neighborhood**
- **U — Urban housing supply (listings volume)**

## Research it can support

- **Housing affordability** — price and rent relative to incomes (pair with macro data).
- **Spatial premiums** — how much location adds to price-per-m².
- **Market activity** — whether listing volumes lead or lag price moves.

## Caveats to put on the page

- Listings are **asking prices, not sale prices**, and reflect **what was collected**, not the
  entire market — state this clearly.
- Coverage is **Addis Ababa-centric**; don't generalise to the whole country.
- Mixed currencies may appear — **normalise or label** before comparing.
- Use **medians** for typical-value headlines; a few luxury listings can distort averages.
