import { describe, expect, it } from 'vitest';
import {
  catalogName,
  detectLang,
  dictionaries,
  pluralKey,
  severityKey,
  translate,
  translator,
} from '../src/i18n';
import { MED_KEYS, SYMPTOM_KEYS, TRIGGER_KEYS } from '../src/lib/catalog';

const languages = ['zh', 'en', 'ja'] as const;

function placeholders(template: string): string[] {
  return [...template.matchAll(/\{(\w+)\}/g)].map((match) => match[1] ?? '').sort();
}

describe('i18n', () => {
  it('has the same keys in every language', () => {
    const reference = Object.keys(dictionaries.zh).sort();
    for (const lang of languages) {
      expect(Object.keys(dictionaries[lang]).sort()).toEqual(reference);
    }
  });

  it('keeps placeholders consistent across languages', () => {
    for (const key of Object.keys(dictionaries.zh) as (keyof typeof dictionaries.zh)[]) {
      const expected = placeholders(dictionaries.zh[key]);
      for (const lang of languages) {
        expect(placeholders(dictionaries[lang][key]), `${lang}:${key}`).toEqual(expected);
      }
    }
  });

  it('translates and interpolates', () => {
    expect(translate('zh', 'calendar.monthSummary', { days: 3, avg: 6.2 })).toBe(
      '3 个发作日 · 平均 6.2',
    );
    expect(translate('en', 'insights.insightLess.other', { n: 4 })).toBe(
      '4 fewer attack days than the previous period',
    );
    expect(translate('ja', 'severity.label')).toBe('症状の強さ');
    expect(translate('en', 'nav.today')).toBe('Today');
  });

  it('falls back to the key for unknown messages', () => {
    const t = translator('en');
    expect(t('nav.today')).toBe('Today');
    expect(severityKey(7)).toBe('severity.7');
    expect(severityKey(99)).toBe('severity.10');
    expect(pluralKey('insights.insightMore', 1)).toBe('insights.insightMore.one');
    expect(pluralKey('insights.insightMore', 3)).toBe('insights.insightMore.other');
  });

  it('resolves built-in and custom catalog names', () => {
    for (const key of MED_KEYS) {
      expect(catalogName('med', { id: `med-${key}`, key }, 'en')).not.toBe(key);
      expect(catalogName('med', { id: `med-${key}`, key }, 'zh')).not.toBe(key);
    }
    for (const key of TRIGGER_KEYS) {
      expect(catalogName('trigger', { id: `trg-${key}`, key }, 'ja')).not.toBe(key);
    }
    for (const key of SYMPTOM_KEYS) {
      expect(catalogName('symptom', { id: `sym-${key}`, key }, 'en')).not.toBe(key);
    }
    expect(catalogName('med', { id: 'med-custom', label: 'My pill' }, 'zh')).toBe('My pill');
    expect(catalogName('trigger', { id: 'trg-custom' }, 'en')).toBe('trg-custom');
  });

  it('detects a supported language from the browser', () => {
    expect(['zh', 'en', 'ja']).toContain(detectLang());
  });
});
