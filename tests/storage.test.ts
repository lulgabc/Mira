import { describe, expect, it } from 'vitest';
import {
  DATA_KEY,
  SETTINGS_KEY,
  emptyData,
  loadData,
  loadSettings,
  parseBackup,
  saveData,
  saveSettings,
  serializeBackup,
} from '../src/lib/storage';
import { LANGS } from '../src/i18n';
import type { Episode } from '../src/lib/types';

class MemoryStorage implements Storage {
  private map = new Map<string, string>();
  get length(): number {
    return this.map.size;
  }
  clear(): void {
    this.map.clear();
  }
  getItem(key: string): string | null {
    return this.map.get(key) ?? null;
  }
  key(index: number): string | null {
    return [...this.map.keys()][index] ?? null;
  }
  removeItem(key: string): void {
    this.map.delete(key);
  }
  setItem(key: string, value: string): void {
    this.map.set(key, value);
  }
}

const sampleEpisode = (): Episode => ({
  id: 'ep_1',
  start: '2026-11-19T09:00:00.000Z',
  end: '2026-11-19T11:00:00.000Z',
  severity: 7,
  symptomIds: ['sym-nausea'],
  triggerIds: ['trg-stress'],
  meds: [{ medId: 'med-ibuprofen', name: 'Ibuprofen', dose: '400 mg', relief: 2 }],
  notes: 'Quiet room helped.',
  createdAt: '2026-11-19T09:00:00.000Z',
  updatedAt: '2026-11-19T11:00:00.000Z',
});

describe('storage', () => {
  it('starts with empty data and default catalogs', () => {
    const storage = new MemoryStorage();
    const data = loadData(storage);
    expect(data.episodes).toEqual([]);
    expect(data.meds).toHaveLength(6);
    expect(data.triggers.length).toBeGreaterThan(0);
    expect(data.symptoms.length).toBeGreaterThan(0);
    expect(LANGS.map((entry) => entry.id)).toContain(loadSettings(storage).lang);
  });

  it('round-trips data and settings', () => {
    const storage = new MemoryStorage();
    const data = emptyData();
    data.episodes.push(sampleEpisode());
    expect(saveData(data, storage)).toBe(true);
    expect(loadData(storage).episodes[0]).toMatchObject({ id: 'ep_1', severity: 7 });

    const settings = { lang: 'en' as const, theme: 'dark' as const, quiet: true, onboarded: true };
    expect(saveSettings(settings, storage)).toBe(true);
    expect(loadSettings(storage)).toEqual(settings);
  });

  it('survives corrupt JSON and clamps invalid episodes', () => {
    const storage = new MemoryStorage();
    storage.setItem(DATA_KEY, '{not json');
    expect(loadData(storage).episodes).toEqual([]);

    storage.setItem(
      DATA_KEY,
      JSON.stringify({
        version: 1,
        episodes: [{ id: 'x', start: '2026-11-19T09:00:00.000Z', severity: 99 }],
        meds: [{ id: 'med-a', label: 'A' }],
        triggers: [],
        symptoms: [],
      }),
    );
    const data = loadData(storage);
    expect(data.episodes[0]?.severity).toBe(10);
    expect(data.meds).toEqual([{ id: 'med-a', label: 'A' }]);
  });

  it('rejects malformed settings fields', () => {
    const storage = new MemoryStorage();
    storage.setItem(SETTINGS_KEY, JSON.stringify({ lang: 'fr', theme: 'neon', quiet: 'yes' }));
    const settings = loadSettings(storage);
    expect(LANGS.map((entry) => entry.id)).toContain(settings.lang);
    expect(settings).toMatchObject({ theme: 'auto', quiet: false, onboarded: false });
  });

  it('exports and imports a backup', () => {
    const data = emptyData();
    data.episodes.push(sampleEpisode());
    const json = serializeBackup(data);
    const parsed = JSON.parse(json) as { app: string; data: { episodes: Episode[] } };
    expect(parsed.app).toBe('mira');
    expect(parsed.data.episodes).toHaveLength(1);
    expect(parseBackup(json).episodes[0]?.id).toBe('ep_1');

    expect(() => parseBackup('nonsense')).toThrow();
  });
});
