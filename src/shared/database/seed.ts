import type { Currency, GoldType, Commodity, Market } from "../types";
import type { ProviderType } from "../provider_types";

export function seedProvider(db: any, p: { id: string; name: string; type: ProviderType; api_url?: string | null }): void {
  db.prepare(`INSERT OR IGNORE INTO providers (id, name, type, api_url) VALUES ($id, $name, $type, $api_url)`)
    .run({ $id: p.id, $name: p.name, $type: p.type, $api_url: p.api_url || null });
}

export function upsertCurrency(db: any, c: Currency): void {
  if (db.prepare("SELECT id FROM currencies WHERE id = $id").get({ $id: c.id })) return;
  db.prepare(`INSERT INTO currencies (id, code, name) VALUES ($id, $code, $name)`)
    .run({ $id: c.id, $code: c.code, $name: c.name });
}

export function upsertCurrencyByCode(db: any, c: { code: string; name: string }): string {
  const existing = db.prepare("SELECT id FROM currencies WHERE code = $code").get({ $code: c.code });
  if (existing) return existing.id;
  const id = c.code.toLowerCase();
  db.prepare(`INSERT INTO currencies (id, code, name) VALUES ($id, $code, $name)`)
    .run({ $id: id, $code: c.code, $name: c.name });
  return id;
}

export function upsertGoldType(db: any, g: GoldType): void {
  db.prepare(`INSERT OR IGNORE INTO gold_types (id, karat, level) VALUES ($id, $karat, $level)`)
    .run({ $id: g.id, $karat: g.karat, $level: g.level });
}

export function upsertCommodity(db: any, c: Commodity): void {
  db.prepare(`INSERT INTO commodities (id, code, name, category, unit)
    VALUES ($id, $code, $name, $category, $unit)
    ON CONFLICT(id) DO UPDATE SET name = $name, category = $category, unit = $unit`)
    .run({ $id: c.id, $code: c.code, $name: c.name, $category: c.category, $unit: c.unit });
}

export function upsertMarket(db: any, m: Market): void {
  db.prepare(`INSERT INTO markets (id, name, admin1, admin2, latitude, longitude, country)
    VALUES ($id, $name, $admin1, $admin2, $latitude, $longitude, $country)
    ON CONFLICT(id) DO UPDATE SET name = $name, admin1 = $admin1, admin2 = $admin2,
      latitude = $latitude, longitude = $longitude, country = $country`)
    .run({ $id: m.id, $name: m.name, $admin1: m.admin1 ?? null, $admin2: m.admin2 ?? null,
           $latitude: m.latitude ?? null, $longitude: m.longitude ?? null, $country: m.country ?? "ET" });
}
