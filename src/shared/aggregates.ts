import type { ExchangeRate, RateAggregate } from "./types";

export function calculateAggregates(
  rates: ExchangeRate[],
  periodType: "week" | "month" | "year"
): RateAggregate[] {
  const grouped = groupByPeriod(rates, periodType);
  const aggregates: RateAggregate[] = [];
  
  for (const [key, groupRates] of grouped) {
    const parts = key.split("|");
    const providerId = parts[0];
    const currencyId = parts[1];
    const periodValue = parts[2];
    if (!providerId || !currencyId || !periodValue) continue;
    
    const buyingValues = groupRates.map(r => r.buying);
    const sellingValues = groupRates.map(r => r.selling);
    const weightedValues = groupRates.filter(r => r.weighted_average).map(r => r.weighted_average!);
    
    aggregates.push({
      id: `${providerId}_${currencyId}_${periodType}_${periodValue}`,
      provider_id: providerId,
      currency_id: currencyId,
      period_type: periodType,
      period_value: periodValue,
      avg_buying: average(buyingValues),
      avg_selling: average(sellingValues),
      avg_weighted: weightedValues.length > 0 ? average(weightedValues) : 0,
      min_buying: Math.min(...buyingValues),
      max_buying: Math.max(...buyingValues),
      min_selling: Math.min(...sellingValues),
      max_selling: Math.max(...sellingValues),
      rate_count: groupRates.length
    });
  }
  
  return aggregates;
}

function average(values: number[]): number {
  return values.length === 0 ? 0 : values.reduce((sum, v) => sum + v, 0) / values.length;
}

function groupByPeriod(rates: ExchangeRate[], periodType: "week" | "month" | "year"): Map<string, ExchangeRate[]> {
  const grouped = new Map<string, ExchangeRate[]>();
  
  for (const rate of rates) {
    const periodValue = getPeriodValue(rate.date, periodType);
    const key = `${rate.provider_id}|${rate.currency_id}|${periodValue}`;
    if (!grouped.has(key)) grouped.set(key, []);
    grouped.get(key)!.push(rate);
  }
  
  return grouped;
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
