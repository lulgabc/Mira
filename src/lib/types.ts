export type Lang = 'zh' | 'zh-Hant' | 'en' | 'ja' | 'fr' | 'es' | 'de' | 'it' | 'pt';
export type ThemePref = 'auto' | 'light' | 'dark';
export type Tab = 'today' | 'calendar' | 'insights' | 'settings';
export type Relief = 0 | 1 | 2;

export interface CatalogItem {
  id: string;
  /** Built-in translation key suffix, e.g. "ibuprofen". */
  key?: string;
  /** User override or custom name. */
  label?: string;
  archived?: boolean;
}

export interface EpisodeMed {
  medId: string;
  name: string;
  dose?: string;
  relief?: Relief;
}

export interface Episode {
  id: string;
  /** ISO timestamp of the attack start. */
  start: string;
  /** ISO timestamp of the attack end; undefined while ongoing. */
  end?: string;
  severity: number;
  symptomIds: string[];
  triggerIds: string[];
  meds: EpisodeMed[];
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AppData {
  version: 1;
  episodes: Episode[];
  meds: CatalogItem[];
  triggers: CatalogItem[];
  symptoms: CatalogItem[];
}

export interface Settings {
  lang: Lang;
  theme: ThemePref;
  quiet: boolean;
  onboarded: boolean;
}

export interface EpisodeDraft {
  id?: string;
  start: string;
  end?: string;
  severity: number;
  symptomIds: string[];
  triggerIds: string[];
  meds: EpisodeMed[];
  notes: string;
}
