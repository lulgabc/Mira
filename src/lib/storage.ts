import { defaultCatalogs } from './catalog';
import { detectLang } from '../i18n';
import type { AppData, CatalogItem, Episode, EpisodeMed, Lang, Settings } from './types';

export const DATA_KEY = 'mira.data.v1';
export const SETTINGS_KEY = 'mira.settings.v1';

const LANGS: Lang[] = ['zh', 'en', 'ja'];

export function emptyData(): AppData {
  const catalogs = defaultCatalogs();
  return { version: 1, episodes: [], ...catalogs };
}

export function defaultSettings(): Settings {
  return { lang: detectLang(), theme: 'auto', quiet: false, onboarded: false };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isIso(value: unknown): value is string {
  return typeof value === 'string' && !Number.isNaN(new Date(value).getTime());
}

function safeParse(text: string | null): unknown {
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

function getStorage(storage?: Storage): Storage | null {
  if (storage) return storage;
  try {
    return globalThis.localStorage ?? null;
  } catch {
    return null;
  }
}

export function sanitizeCatalog(raw: unknown): CatalogItem[] | null {
  if (!Array.isArray(raw)) return null;
  const seen = new Set<string>();
  const items: CatalogItem[] = [];
  for (const entry of raw) {
    if (!isRecord(entry) || typeof entry.id !== 'string' || !entry.id || seen.has(entry.id)) continue;
    seen.add(entry.id);
    const item: CatalogItem = { id: entry.id };
    if (typeof entry.key === 'string' && entry.key) item.key = entry.key;
    if (typeof entry.label === 'string' && entry.label.trim()) item.label = entry.label.trim();
    if (entry.archived === true) item.archived = true;
    items.push(item);
  }
  return items;
}

function sanitizeMed(raw: unknown): EpisodeMed | null {
  if (!isRecord(raw) || typeof raw.medId !== 'string' || typeof raw.name !== 'string') return null;
  const med: EpisodeMed = { medId: raw.medId, name: raw.name };
  if (typeof raw.dose === 'string' && raw.dose.trim()) med.dose = raw.dose.trim().slice(0, 60);
  if (raw.relief === 0 || raw.relief === 1 || raw.relief === 2) med.relief = raw.relief;
  return med;
}

export function sanitizeEpisode(raw: unknown): Episode | null {
  if (!isRecord(raw)) return null;
  if (typeof raw.id !== 'string' || !raw.id) return null;
  if (!isIso(raw.start)) return null;
  const severity = Number(raw.severity);
  if (!Number.isFinite(severity)) return null;
  const stringIds = (value: unknown): string[] =>
    Array.isArray(value) ? [...new Set(value.filter((id): id is string => typeof id === 'string'))] : [];

  const start = new Date(raw.start as string);
  const end = isIso(raw.end) && new Date(raw.end as string).getTime() >= start.getTime() ? raw.end : undefined;
  const episode: Episode = {
    id: raw.id,
    start: start.toISOString(),
    severity: Math.max(1, Math.min(10, Math.round(severity))),
    symptomIds: stringIds(raw.symptomIds),
    triggerIds: stringIds(raw.triggerIds),
    meds: Array.isArray(raw.meds)
      ? raw.meds.map(sanitizeMed).filter((med): med is EpisodeMed => med !== null)
      : [],
    createdAt: isIso(raw.createdAt) ? raw.createdAt : start.toISOString(),
    updatedAt: isIso(raw.updatedAt) ? raw.updatedAt : start.toISOString(),
  };
  if (end) episode.end = new Date(end).toISOString();
  if (typeof raw.notes === 'string' && raw.notes.trim()) episode.notes = raw.notes.trim().slice(0, 2000);
  return episode;
}

function sanitizeData(raw: unknown): AppData | null {
  if (!isRecord(raw)) return null;
  if (!Array.isArray(raw.episodes)) return null;
  const episodes = raw.episodes
    .map(sanitizeEpisode)
    .filter((episode): episode is Episode => episode !== null)
    .sort((a, b) => b.start.localeCompare(a.start));
  const catalogs = defaultCatalogs();
  return {
    version: 1,
    episodes,
    meds: sanitizeCatalog(raw.meds) ?? catalogs.meds,
    triggers: sanitizeCatalog(raw.triggers) ?? catalogs.triggers,
    symptoms: sanitizeCatalog(raw.symptoms) ?? catalogs.symptoms,
  };
}

export function loadData(storage?: Storage): AppData {
  const store = getStorage(storage);
  const raw = safeParse(store?.getItem(DATA_KEY) ?? null);
  return sanitizeData(raw) ?? emptyData();
}

export function saveData(data: AppData, storage?: Storage): boolean {
  const store = getStorage(storage);
  if (!store) return false;
  try {
    store.setItem(DATA_KEY, JSON.stringify(data));
    return true;
  } catch {
    return false;
  }
}

export function loadSettings(storage?: Storage): Settings {
  const store = getStorage(storage);
  const raw = safeParse(store?.getItem(SETTINGS_KEY) ?? null);
  const defaults = defaultSettings();
  if (!isRecord(raw)) return defaults;
  const lang = LANGS.includes(raw.lang as Lang) ? (raw.lang as Lang) : defaults.lang;
  const theme = raw.theme === 'light' || raw.theme === 'dark' ? raw.theme : 'auto';
  return {
    lang,
    theme,
    quiet: raw.quiet === true,
    onboarded: raw.onboarded === true,
  };
}

export function saveSettings(settings: Settings, storage?: Storage): boolean {
  const store = getStorage(storage);
  if (!store) return false;
  try {
    store.setItem(SETTINGS_KEY, JSON.stringify(settings));
    return true;
  } catch {
    return false;
  }
}

export interface Backup {
  app: 'mira';
  version: 1;
  exportedAt: string;
  data: AppData;
}

export function serializeBackup(data: AppData): string {
  const backup: Backup = { app: 'mira', version: 1, exportedAt: new Date().toISOString(), data };
  return JSON.stringify(backup, null, 2);
}

export function parseBackup(text: string): AppData {
  const raw = safeParse(text);
  if (!isRecord(raw)) throw new Error('invalid');
  const candidate = isRecord(raw.data) ? raw.data : raw;
  const data = sanitizeData(candidate);
  if (!data) throw new Error('invalid');
  return data;
}
