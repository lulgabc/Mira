import type { Lang } from './types';

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

const dateTimeFormat = new Map<string, Intl.DateTimeFormat>();

function formatter(locale: string, options: Intl.DateTimeFormatOptions): Intl.DateTimeFormat {
  const cacheKey = `${locale}|${JSON.stringify(options)}`;
  let f = dateTimeFormat.get(cacheKey);
  if (!f) {
    f = new Intl.DateTimeFormat(locale, options);
    dateTimeFormat.set(cacheKey, f);
  }
  return f;
}

export function startOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

export function addDays(date: Date, days: number): Date {
  const copy = new Date(date);
  copy.setDate(copy.getDate() + days);
  return copy;
}

/** Local calendar day key, e.g. 2026-11-19. ISO keys sort chronologically. */
export function dayKey(date: Date = new Date()): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function dayKeyOf(input: string | Date): string {
  return dayKey(typeof input === 'string' ? new Date(input) : input);
}

export function parseDayKey(key: string): Date {
  const [y = 1970, m = 1, d = 1] = key.split('-').map(Number);
  return new Date(y, m - 1, d);
}

/** Number of calendar days from `fromKey` to `toKey` (can be negative). */
export function diffDays(fromKey: string, toKey: string): number {
  const from = parseDayKey(fromKey);
  const to = parseDayKey(toKey);
  return Math.round(
    (Date.UTC(to.getFullYear(), to.getMonth(), to.getDate()) -
      Date.UTC(from.getFullYear(), from.getMonth(), from.getDate())) /
      86_400_000,
  );
}

export function minutesBetween(startIso: string, endIso: string): number {
  return Math.max(0, Math.round((new Date(endIso).getTime() - new Date(startIso).getTime()) / 60_000));
}

export function endAfterMinutes(startIso: string, minutes: number): string {
  return new Date(new Date(startIso).getTime() + minutes * 60_000).toISOString();
}

export function toDateTimeInput(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function fromDateTimeInput(value: string): string | null {
  if (!value) return null;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d.toISOString();
}

export function formatTime(iso: string, lang: Lang): string {
  return formatter(LOCALES[lang], { hour: '2-digit', minute: '2-digit', hour12: false }).format(new Date(iso));
}

export function formatMonthTitle(date: Date, lang: Lang): string {
  return formatter(LOCALES[lang], { year: 'numeric', month: 'long' }).format(date);
}

export function formatMonthDay(key: string, lang: Lang): string {
  return formatter(LOCALES[lang], { month: 'short', day: 'numeric' }).format(parseDayKey(key));
}

export function formatDayTitle(key: string, lang: Lang): string {
  const date = parseDayKey(key);
  if (lang === 'zh' || lang === 'zh-Hant') {
    return `${date.getMonth() + 1}月${date.getDate()}日 · ${formatter(LOCALES[lang], {
      weekday: 'short',
    }).format(date)}`;
  }
  if (lang === 'ja') {
    return `${date.getMonth() + 1}月${date.getDate()}日（${formatter(LOCALES.ja, {
      weekday: 'narrow',
    }).format(date)}）`;
  }
  return formatter(LOCALES[lang], { month: 'short', day: 'numeric', weekday: 'short' }).format(date);
}

export function formatFullDate(date: Date, lang: Lang): string {
  if (lang === 'zh' || lang === 'zh-Hant') {
    return `${date.getMonth() + 1}月${date.getDate()}日 · ${formatter(LOCALES[lang], {
      weekday: 'long',
    }).format(date)}`;
  }
  if (lang === 'ja') {
    return `${date.getMonth() + 1}月${date.getDate()}日（${formatter(LOCALES.ja, {
      weekday: 'short',
    }).format(date)}）`;
  }
  return formatter(LOCALES[lang], { month: 'long', day: 'numeric', weekday: 'long' }).format(date);
}

export function greetingKey(date: Date = new Date()): 'morning' | 'afternoon' | 'evening' | 'night' {
  const hour = date.getHours();
  if (hour < 5) return 'night';
  if (hour < 12) return 'morning';
  if (hour < 18) return 'afternoon';
  return 'evening';
}

export function formatElapsed(ms: number): string {
  const total = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  const pad = (n: number) => String(n).padStart(2, '0');
  return h > 0 ? `${h}:${pad(m)}:${pad(s)}` : `${pad(m)}:${pad(s)}`;
}

const UNITS: Record<Lang, { h: string; m: string; min: string; d: string }> = {
  zh: { h: '小时', m: '分', min: '分钟', d: '天' },
  'zh-Hant': { h: '小時', m: '分', min: '分鐘', d: '天' },
  en: { h: 'h', m: 'm', min: 'min', d: 'd' },
  ja: { h: '時間', m: '分', min: '分', d: '日' },
  fr: { h: 'h', m: 'min', min: 'min', d: 'j' },
  es: { h: 'h', m: 'min', min: 'min', d: 'd' },
  de: { h: 'Std.', m: 'Min.', min: 'Min.', d: 'T.' },
  it: { h: 'h', m: 'min', min: 'min', d: 'g' },
  pt: { h: 'h', m: 'min', min: 'min', d: 'd' },
};

export function formatDuration(minutes: number, lang: Lang): string {
  const units = UNITS[lang];
  const safe = Math.max(0, Math.round(minutes));
  if (safe < 60) return `${safe} ${units.min}`;
  const h = Math.floor(safe / 60);
  const m = safe % 60;
  if (m === 0) return `${h} ${units.h}`;
  return lang === 'en' ? `${h}${units.h} ${m}${units.m}` : `${h} ${units.h} ${m} ${units.m}`;
}
