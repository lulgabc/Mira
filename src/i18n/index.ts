import type { CatalogItem, Lang } from '../lib/types';
import { en } from './en';
import { ja } from './ja';
import { zh, type MessageKey, type Messages } from './zh';

export type { MessageKey, Messages };

export const dictionaries: Record<Lang, Messages> = { zh, en, ja };

export const LANGS: { id: Lang; label: string; locale: string }[] = [
  { id: 'zh', label: '中文', locale: 'zh-CN' },
  { id: 'en', label: 'English', locale: 'en-US' },
  { id: 'ja', label: '日本語', locale: 'ja-JP' },
];

export function localeOf(lang: Lang): string {
  return lang === 'zh' ? 'zh-CN' : lang === 'ja' ? 'ja-JP' : 'en-US';
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
    if (lower.startsWith('zh')) return 'zh';
    if (lower.startsWith('ja')) return 'ja';
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
