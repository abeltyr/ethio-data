import type { ExchangeRate, RateAggregate, CommodityPrice, EconomicIndicator, TradeFlow, CommodityAggregate, PropertyPrice } from "../types";

export function upsertExchangeRate(db: any, r: ExchangeRate): void {
  db.prepare(`INSERT INTO exchange_rates (id, provider_id, currency_id, date, buying, selling, weighted_average,
    buying_rate, selling_rate, cash_buying, cash_selling, transaction_buying, transaction_selling, 
    avg_buying_rate, avg_selling_rate)
    VALUES ($id, $provider_id, $currency_id, $date, $buying, $selling, $weighted_average,
      $buying_rate, $selling_rate, $cash_buying, $cash_selling, $transaction_buying, $transaction_selling,
      $avg_buying_rate, $avg_selling_rate)
    ON CONFLICT(provider_id, currency_id, date) DO UPDATE SET
      buying = $buying, selling = $selling, weighted_average = $weighted_average,
      buying_rate = $buying_rate, selling_rate = $selling_rate,
      cash_buying = $cash_buying, cash_selling = $cash_selling,
      transaction_buying = $transaction_buying, transaction_selling = $transaction_selling,
      avg_buying_rate = $avg_buying_rate, avg_selling_rate = $avg_selling_rate`)
    .run({ $id: r.id, $provider_id: r.provider_id, $currency_id: r.currency_id, $date: r.date,
           $buying: r.buying ?? r.buying_rate ?? 0, $selling: r.selling ?? r.selling_rate ?? 0,
           $weighted_average: r.weighted_average ?? null,
           $buying_rate: r.buying_rate ?? null, $selling_rate: r.selling_rate ?? null,
           $cash_buying: r.cash_buying ?? null, $cash_selling: r.cash_selling ?? null,
           $transaction_buying: r.transaction_buying ?? null, $transaction_selling: r.transaction_selling ?? null,
           $avg_buying_rate: r.avg_buying_rate ?? null, $avg_selling_rate: r.avg_selling_rate ?? null });
}

export function upsertGoldRate(db: any, g: { id: string; gold_type_id: string; price_usd: number; price_birr: number; date: string }): void {
  db.prepare(`INSERT INTO gold_rates (id, gold_type_id, price_usd, price_birr, date)
    VALUES ($id, $gold_type_id, $price_usd, $price_birr, $date)
    ON CONFLICT(gold_type_id, date) DO UPDATE SET price_usd = $price_usd, price_birr = $price_birr`)
    .run({ $id: g.id, $gold_type_id: g.gold_type_id, $price_usd: g.price_usd, $price_birr: g.price_birr, $date: g.date });
}

export function saveExchangeRates(db: any, rates: ExchangeRate[]): void {
  db.transaction(() => rates.forEach(r => upsertExchangeRate(db, r)))();
}

export function saveGoldRates(db: any, rates: Array<{ id: string; gold_type_id: string; price_usd: number; price_birr: number; date: string }>): void {
  db.transaction(() => rates.forEach(g => upsertGoldRate(db, g)))();
}

export function upsertCommodityPrice(db: any, p: CommodityPrice): void {
  db.prepare(`INSERT INTO commodity_prices
    (id, provider_id, commodity_id, market_id, date, price, currency, price_usd, price_type, unit)
    VALUES ($id, $provider_id, $commodity_id, $market_id, $date, $price, $currency, $price_usd, $price_type, $unit)
    ON CONFLICT(provider_id, commodity_id, market_id, date, price_type) DO UPDATE SET
      price = $price, currency = $currency, price_usd = $price_usd, unit = $unit`)
    .run({ $id: p.id, $provider_id: p.provider_id, $commodity_id: p.commodity_id,
           $market_id: p.market_id ?? null, $date: p.date, $price: p.price, $currency: p.currency,
           $price_usd: p.price_usd ?? null, $price_type: p.price_type, $unit: p.unit });
}

export function saveCommodityPrices(db: any, prices: CommodityPrice[]): void {
  db.transaction(() => prices.forEach(p => upsertCommodityPrice(db, p)))();
}

export function upsertIndicator(db: any, i: EconomicIndicator): void {
  db.prepare(`INSERT INTO economic_indicators
    (id, provider_id, indicator_code, indicator_name, area, period, period_type, value, unit)
    VALUES ($id, $provider_id, $indicator_code, $indicator_name, $area, $period, $period_type, $value, $unit)
    ON CONFLICT(provider_id, indicator_code, area, period) DO UPDATE SET
      indicator_name = $indicator_name, period_type = $period_type, value = $value, unit = $unit`)
    .run({ $id: i.id, $provider_id: i.provider_id, $indicator_code: i.indicator_code,
           $indicator_name: i.indicator_name, $area: i.area, $period: i.period,
           $period_type: i.period_type, $value: i.value, $unit: i.unit ?? null });
}

export function saveIndicators(db: any, indicators: EconomicIndicator[]): void {
  db.transaction(() => indicators.forEach(i => upsertIndicator(db, i)))();
}

export function upsertTradeFlow(db: any, t: TradeFlow): void {
  db.prepare(`INSERT INTO trade_flows
    (id, provider_id, reporter, partner, partner_code, commodity_hs, commodity_desc, flow, period, period_type, value_usd, qty, qty_unit)
    VALUES ($id, $provider_id, $reporter, $partner, $partner_code, $commodity_hs, $commodity_desc, $flow, $period, $period_type, $value_usd, $qty, $qty_unit)
    ON CONFLICT(provider_id, reporter, partner_code, commodity_hs, flow, period) DO UPDATE SET
      commodity_desc = $commodity_desc, period_type = $period_type, value_usd = $value_usd,
      qty = $qty, qty_unit = $qty_unit, partner = $partner`)
    .run({ $id: t.id, $provider_id: t.provider_id, $reporter: t.reporter, $partner: t.partner,
           $partner_code: t.partner_code, $commodity_hs: t.commodity_hs, $commodity_desc: t.commodity_desc,
           $flow: t.flow, $period: t.period, $period_type: t.period_type, $value_usd: t.value_usd,
           $qty: t.qty ?? null, $qty_unit: t.qty_unit ?? null });
}

export function saveTradeFlows(db: any, flows: TradeFlow[]): void {
  db.transaction(() => flows.forEach(t => upsertTradeFlow(db, t)))();
}

export function upsertPropertyPrice(db: any, p: PropertyPrice): void {
  db.prepare(`INSERT INTO property_prices
    (id, provider_id, source, listing_type, property_type, region, area, bedrooms, bathrooms,
     size_sqm, price, currency, price_sqm, latitude, longitude, listed_date, collected_at)
    VALUES ($id,$provider_id,$source,$listing_type,$property_type,$region,$area,$bedrooms,$bathrooms,
     $size_sqm,$price,$currency,$price_sqm,$latitude,$longitude,$listed_date,$collected_at)
    ON CONFLICT(id) DO UPDATE SET price=$price, currency=$currency, price_sqm=$price_sqm,
     bedrooms=$bedrooms, bathrooms=$bathrooms, size_sqm=$size_sqm, area=$area,
     property_type=$property_type, region=$region`)
    .run({ $id: p.id, $provider_id: p.provider_id, $source: p.source, $listing_type: p.listing_type,
           $property_type: p.property_type ?? null, $region: p.region ?? null, $area: p.area ?? null,
           $bedrooms: p.bedrooms ?? null, $bathrooms: p.bathrooms ?? null, $size_sqm: p.size_sqm ?? null,
           $price: p.price, $currency: p.currency, $price_sqm: p.price_sqm ?? null,
           $latitude: p.latitude ?? null, $longitude: p.longitude ?? null,
           $listed_date: p.listed_date ?? null, $collected_at: p.collected_at });
}

export function savePropertyPrices(db: any, prices: PropertyPrice[]): void {
  db.transaction(() => prices.forEach(p => upsertPropertyPrice(db, p)))();
}

export function saveCommodityAggregates(db: any, aggregates: CommodityAggregate[]): void {
  db.transaction(() => aggregates.forEach(a => {
    db.prepare(`INSERT INTO commodity_aggregates (
      id, provider_id, commodity_id, market_id, price_type, period_type, period_value,
      avg_price, min_price, max_price, avg_price_usd, price_count
    ) VALUES ($id, $provider_id, $commodity_id, $market_id, $price_type, $period_type, $period_value,
      $avg_price, $min_price, $max_price, $avg_price_usd, $price_count)
    ON CONFLICT(provider_id, commodity_id, market_id, price_type, period_type, period_value) DO UPDATE SET
      avg_price = $avg_price, min_price = $min_price, max_price = $max_price,
      avg_price_usd = $avg_price_usd, price_count = $price_count, updated_at = CURRENT_TIMESTAMP`)
      .run({ $id: a.id, $provider_id: a.provider_id, $commodity_id: a.commodity_id,
             $market_id: a.market_id ?? null, $price_type: a.price_type, $period_type: a.period_type,
             $period_value: a.period_value, $avg_price: a.avg_price, $min_price: a.min_price,
             $max_price: a.max_price, $avg_price_usd: a.avg_price_usd, $price_count: a.price_count });
  }))();
}

export function saveAggregates(db: any, aggregates: RateAggregate[]): void {
  db.transaction(() => aggregates.forEach(a => {
    db.prepare(`INSERT INTO rate_aggregates (
      id, provider_id, currency_id, period_type, period_value, avg_buying, avg_selling, avg_weighted,
      min_buying, max_buying, min_selling, max_selling, rate_count
    ) VALUES ($id, $provider_id, $currency_id, $period_type, $period_value, $avg_buying, $avg_selling,
      $avg_weighted, $min_buying, $max_buying, $min_selling, $max_selling, $rate_count)
    ON CONFLICT(provider_id, currency_id, period_type, period_value) DO UPDATE SET
      avg_buying = $avg_buying, avg_selling = $avg_selling, avg_weighted = $avg_weighted,
      min_buying = $min_buying, max_buying = $max_buying, min_selling = $min_selling,
      max_selling = $max_selling, rate_count = $rate_count, updated_at = CURRENT_TIMESTAMP`)
      .run({
        $id: a.id, $provider_id: a.provider_id, $currency_id: a.currency_id, $period_type: a.period_type,
        $period_value: a.period_value, $avg_buying: a.avg_buying, $avg_selling: a.avg_selling,
        $avg_weighted: a.avg_weighted, $min_buying: a.min_buying, $max_buying: a.max_buying,
        $min_selling: a.min_selling, $max_selling: a.max_selling, $rate_count: a.rate_count
      });
  }))();
}
