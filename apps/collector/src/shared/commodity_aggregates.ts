import type { CommodityPrice, CommodityAggregate } from "@ethiodata/types";

export function calculateCommodityAggregates(
  prices: CommodityPrice[],
  periodType: "week" | "month" | "year"
): CommodityAggregate[] {
  const grouped = new Map<string, CommodityPrice[]>();

  for (const p of prices) {
    const periodValue = getPeriodValue(p.date, periodType);
    const market = p.market_id ?? "national";
    const key = `${p.provider_id}|${p.commodity_id}|${market}|${p.price_type}|${periodValue}`;
    if (!grouped.has(key)) grouped.set(key, []);
    grouped.get(key)!.push(p);
  }

  const aggregates: CommodityAggregate[] = [];
  for (const [key, group] of grouped) {
    const [providerId, commodityId, market, priceType, periodValue] = key.split("|");
    if (!providerId || !commodityId || !priceType || !periodValue) continue;

    const prices_ = group.map(g => g.price);
    const usd = group.filter(g => g.price_usd != null).map(g => g.price_usd!);

    aggregates.push({
      id: `${providerId}_${commodityId}_${market}_${priceType}_${periodType}_${periodValue}`,
      provider_id: providerId,
      commodity_id: commodityId,
      market_id: market,
      price_type: priceType as CommodityAggregate["price_type"],
      period_type: periodType,
      period_value: periodValue,
      avg_price: average(prices_),
      min_price: Math.min(...prices_),
      max_price: Math.max(...prices_),
      avg_price_usd: usd.length > 0 ? average(usd) : 0,
      price_count: group.length,
    });
  }

  return aggregates;
}

function average(values: number[]): number {
  return values.length === 0 ? 0 : values.reduce((s, v) => s + v, 0) / values.length;
}

function getPeriodValue(date: string, periodType: "week" | "month" | "year"): string {
  const d = new Date(date);
  switch (periodType) {
    case "week": {
      const year = d.getFullYear();
      const oneJan = new Date(year, 0, 1);
      const days = Math.floor((d.getTime() - oneJan.getTime()) / 86400000);
      const weekNum = Math.ceil((days + oneJan.getDay() + 1) / 7);
      return `${year}-W${String(weekNum).padStart(2, "0")}`;
    }
    case "month": return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    case "year": return `${d.getFullYear()}`;
  }
}
