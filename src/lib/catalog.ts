import type { CatalogItem } from './types';

export const MED_KEYS = [
  'ibuprofen',
  'acetaminophen',
  'sumatriptan',
  'naproxen',
  'aspirin',
  'metoclopramide',
] as const;

export const TRIGGER_KEYS = [
  'stress',
  'sleep',
  'weather',
  'hormones',
  'meal',
  'hydration',
  'screens',
  'caffeine',
  'alcohol',
  'smell',
  'light',
  'food',
] as const;

export const SYMPTOM_KEYS = [
  'nausea',
  'aura',
  'photophobia',
  'phonophobia',
  'vomiting',
  'dizziness',
  'neck',
  'fatigue',
] as const;

function builtIns(prefix: string, keys: readonly string[]): CatalogItem[] {
  return keys.map((key) => ({ id: `${prefix}-${key}`, key }));
}

export interface Catalogs {
  meds: CatalogItem[];
  triggers: CatalogItem[];
  symptoms: CatalogItem[];
}

export function defaultCatalogs(): Catalogs {
  return {
    meds: builtIns('med', MED_KEYS),
    triggers: builtIns('trg', TRIGGER_KEYS),
    symptoms: builtIns('sym', SYMPTOM_KEYS),
  };
}

export function visibleItems(items: CatalogItem[]): CatalogItem[] {
  return items.filter((item) => !item.archived);
}
