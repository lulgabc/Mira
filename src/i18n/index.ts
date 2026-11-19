import type { CatalogItem, Lang } from '../lib/types';
import { de } from './de';
import { en } from './en';
import { es } from './es';
import { fr } from './fr';
import { it } from './it';
import { ja } from './ja';
import { pt } from './pt';
import { zhHant } from './zh-Hant';
import { zh, type MessageKey, type Messages } from './zh';

export type { MessageKey, Messages };

export const dictionaries: Record<Lang, Messages> = {
  zh,
  'zh-Hant': zhHant,
  en,
  ja,
  fr,
  es,
  de,
  it,
  pt,
};

export const LANGS: { id: Lang; label: string; locale: string }[] = [
  { id: 'zh', label: '简体中文', locale: 'zh-CN' },
  { id: 'zh-Hant', label: '繁體中文', locale: 'zh-TW' },
  { id: 'en', label: 'English', locale: 'en-US' },
  { id: 'ja', label: '日本語', locale: 'ja-JP' },
  { id: 'fr', label: 'Français', locale: 'fr-FR' },
  { id: 'es', label: 'Español', locale: 'es-ES' },
  { id: 'de', label: 'Deutsch', locale: 'de-DE' },
  { id: 'it', label: 'Italiano', locale: 'it-IT' },
  { id: 'pt', label: 'Português', locale: 'pt-BR' },
];

const LOCALES: Record<Lang, string> = {
  zh: 'zh-CN',
  'zh-Hant': 'zh-TW',
  en: 'en-US',
  ja: 'ja-JP',
  fr: 'fr-FR',
  es: 'es-ES',
  de: 'de-DE',
  it: 'it-IT',
  pt: 'pt-BR',
};

export function localeOf(lang: Lang): string {
  return LOCALES[lang];
}

export function translate(
  lang: Lang,
  key: MessageKey,
  vars?: Record<string, string | number>,
): string {
  const template = dictionaries[lang][key] ?? zh[key] ?? key;
  if (!vars) return template;
  return template.replace(/\{(\w+)\}/g, (match, name: string) =>
    Object.hasOwn(vars, name) ? String(vars[name]) : match,
  );
}

export type Translate = (key: MessageKey, vars?: Record<string, string | number>) => string;

export function translator(lang: Lang): Translate {
  return (key, vars) => translate(lang, key, vars);
}

const PREFIX: Record<'med' | 'trigger' | 'symptom', string> = {
  med: 'catalog.med.',
  trigger: 'catalog.trigger.',
  symptom: 'catalog.symptom.',
};

export function catalogName(
  kind: 'med' | 'trigger' | 'symptom',
  item: CatalogItem,
  lang: Lang,
): string {
  if (item.label && item.label.trim()) return item.label;
  if (item.key) {
    const key = `${PREFIX[kind]}${item.key}`;
    const dict = dictionaries[lang] as Record<string, string>;
    return dict[key] ?? item.key;
  }
  return item.id;
}

export function detectLang(): Lang {
  if (typeof navigator === 'undefined') return 'zh';
  const languages = navigator.languages?.length ? navigator.languages : [navigator.language];
  for (const candidate of languages) {
    const lower = candidate.toLowerCase();
    if (lower.startsWith('zh')) {
      if (lower.includes('hant') || lower.includes('tw') || lower.includes('hk') || lower.includes('mo')) {
        return 'zh-Hant';
      }
      return 'zh';
    }
    if (lower.startsWith('ja')) return 'ja';
    if (lower.startsWith('fr')) return 'fr';
    if (lower.startsWith('es')) return 'es';
    if (lower.startsWith('de')) return 'de';
    if (lower.startsWith('it')) return 'it';
    if (lower.startsWith('pt')) return 'pt';
    if (lower.startsWith('en')) return 'en';
  }
  return 'en';
}

export function severityKey(value: number): MessageKey {
  const clamped = Math.max(1, Math.min(10, Math.round(value)));
  return `severity.${clamped}` as MessageKey;
}

export function pluralKey(
  key: string,
  n: number,
): MessageKey {
  return `${key}.${n === 1 ? 'one' : 'other'}` as MessageKey;
}
