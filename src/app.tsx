import { useEffect, useMemo, useState } from 'preact/hooks';
import { CatalogSheet } from './components/CatalogSheet';
import { EpisodeSheet } from './components/EpisodeSheet';
import { IconCheck, IconMoon, LogoMark } from './components/Icons';
import { QuickMedSheet } from './components/QuickMedSheet';
import { WelcomeSheet } from './components/WelcomeSheet';
import { BottomNav } from './components/BottomNav';
import { localeOf, translator } from './i18n';
import { dayKey, dayKeyOf } from './lib/dates';
import { isInstallAvailable, promptInstall } from './lib/pwa';
import { sampleData } from './lib/sample';
import {
  emptyData,
  loadData,
  loadSettings,
  parseBackup,
  saveData,
  saveSettings,
  serializeBackup,
} from './lib/storage';
import type {
  AppData,
  CatalogItem,
  Episode,
  EpisodeDraft,
  EpisodeMed,
  Settings,
  Tab,
} from './lib/types';
import { uid } from './lib/uid';
import { CalendarView } from './views/CalendarView';
import { InsightsView } from './views/InsightsView';
import { SettingsView } from './views/SettingsView';
import { TodayView } from './views/TodayView';

type CatalogKind = 'med' | 'trigger' | 'symptom';

interface SheetState {
  episode?: Episode;
  initialStart?: string;
  initialOngoing?: boolean;
}

export function App() {
  const [settings, setSettings] = useState<Settings>(() => loadSettings());
  const [data, setData] = useState<AppData>(() => loadData());
  const [tab, setTab] = useState<Tab>('today');
  const [today, setToday] = useState(dayKey());
  const [sheet, setSheet] = useState<SheetState | null>(null);
  const [quickMedId, setQuickMedId] = useState<string | null>(null);
  const [catalogKind, setCatalogKind] = useState<CatalogKind | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [canInstall, setCanInstall] = useState(isInstallAvailable());

  const lang = settings.lang;
  const t = useMemo(() => translator(lang), [lang]);

  useEffect(() => {
    saveSettings(settings);
  }, [settings]);

  useEffect(() => {
    saveData(data);
  }, [data]);

  useEffect(() => {
    const media = window.matchMedia('(prefers-color-scheme: dark)');
    const apply = () => {
      const resolved = settings.quiet
        ? 'dark'
        : settings.theme === 'auto'
          ? media.matches
            ? 'dark'
            : 'light'
          : settings.theme;
      const root = document.documentElement;
      root.dataset.theme = resolved;
      if (settings.quiet) root.dataset.quiet = 'true';
      else delete root.dataset.quiet;
      root.lang = localeOf(lang);
      document.title = `Mira · ${t('app.tagline')}`;
      document
        .getElementById('meta-theme-color')
        ?.setAttribute('content', settings.quiet ? '#0b0806' : resolved === 'dark' ? '#0d0f12' : '#f4f1e9');
      document
        .querySelector('meta[name="apple-mobile-web-app-status-bar-style"]')
        ?.setAttribute('content', resolved === 'dark' ? 'black-translucent' : 'default');
    };
    apply();
    media.addEventListener('change', apply);
    return () => media.removeEventListener('change', apply);
  }, [settings.quiet, settings.theme, lang, t]);

  useEffect(() => {
    const timer = window.setInterval(() => {
      const key = dayKey();
      setToday((current) => (current === key ? current : key));
    }, 30_000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(null), 2600);
    return () => window.clearTimeout(timer);
  }, [toast]);

  useEffect(() => {
    const onAvailable = () => setCanInstall(true);
    const onInstalled = () => {
      setCanInstall(false);
      setToast(t('settings.installed'));
    };
    window.addEventListener('mira:installable', onAvailable);
    window.addEventListener('mira:installed', onInstalled);
    return () => {
      window.removeEventListener('mira:installable', onAvailable);
      window.removeEventListener('mira:installed', onInstalled);
    };
  }, [t]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('capture') === '1') {
      setSheet({ initialOngoing: true });
      window.history.replaceState(null, '', window.location.pathname);
    }
  }, []);

  const updateSettings = (patch: Partial<Settings>) => {
    setSettings((current) => ({ ...current, ...patch }));
  };

  const changeTab = (next: Tab) => {
    setTab(next);
    window.scrollTo(0, 0);
  };

  const quickMedEpisode = quickMedId
    ? (data.episodes.find((episode) => episode.id === quickMedId) ?? null)
    : null;

  const saveEpisode = (draft: EpisodeDraft) => {
    const timestamp = new Date().toISOString();
    const existing = draft.id ? data.episodes.find((episode) => episode.id === draft.id) : undefined;
    const episode: Episode = {
      id: draft.id ?? uid('ep'),
      start: draft.start,
      severity: Math.max(1, Math.min(10, draft.severity)),
      symptomIds: draft.symptomIds,
      triggerIds: draft.triggerIds,
      meds: draft.meds,
      createdAt: existing?.createdAt ?? timestamp,
      updatedAt: timestamp,
    };
    if (draft.end) episode.end = draft.end;
    if (draft.notes.trim()) episode.notes = draft.notes.trim();

    setData((current) => {
      let episodes = existing
        ? current.episodes.map((item) => (item.id === episode.id ? episode : item))
        : [episode, ...current.episodes];
      if (!episode.end) {
        episodes = episodes.map((item) =>
          item.id !== episode.id && !item.end
            ? { ...item, end: episode.start, updatedAt: timestamp }
            : item,
        );
      }
      episodes = [...episodes].sort((a, b) => b.start.localeCompare(a.start));
      return { ...current, episodes };
    });
    setSheet(null);
    setToast(existing ? t('capture.updated') : t('capture.saved'));
  };

  const deleteEpisode = (id: string) => {
    setData((current) => ({ ...current, episodes: current.episodes.filter((episode) => episode.id !== id) }));
    setSheet(null);
    setToast(t('capture.deleted'));
  };

  const endEpisode = (id: string) => {
    const timestamp = new Date().toISOString();
    setData((current) => ({
      ...current,
      episodes: current.episodes.map((episode) =>
        episode.id === id ? { ...episode, end: timestamp, updatedAt: timestamp } : episode,
      ),
    }));
    setToast(t('today.endDone'));
  };

  const addMedsToEpisode = (id: string, meds: EpisodeMed[]) => {
    const timestamp = new Date().toISOString();
    setData((current) => ({
      ...current,
      episodes: current.episodes.map((episode) =>
        episode.id === id
          ? { ...episode, meds: [...episode.meds, ...meds], updatedAt: timestamp }
          : episode,
      ),
    }));
    setQuickMedId(null);
    setToast(t('today.medAdded'));
  };

  const createMed = (name: string): CatalogItem => {
    const item: CatalogItem = { id: uid('med'), label: name };
    setData((current) => ({ ...current, meds: [...current.meds, item] }));
    return item;
  };

  const updateCatalog = (
    kind: CatalogKind,
    updater: (items: CatalogItem[]) => CatalogItem[],
  ) => {
    setData((current) => {
      if (kind === 'med') return { ...current, meds: updater(current.meds) };
      if (kind === 'trigger') return { ...current, triggers: updater(current.triggers) };
      return { ...current, symptoms: updater(current.symptoms) };
    });
  };

  const catalogItems = (kind: CatalogKind): CatalogItem[] =>
    kind === 'med' ? data.meds : kind === 'trigger' ? data.triggers : data.symptoms;

  const handleExport = () => {
    const blob = new Blob([serializeBackup(data)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `mira-backup-${today}.json`;
    anchor.click();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    setToast(t('settings.exported'));
  };

  const handleImport = async (file: File) => {
    try {
      const imported = parseBackup(await file.text());
      setData(imported);
      updateSettings({ onboarded: true });
      setToast(t('settings.imported'));
    } catch {
      setToast(t('settings.importError'));
    }
  };

  const loadDemo = (onboard = false) => {
    setData(sampleData(lang));
    if (onboard) updateSettings({ onboarded: true });
    setToast(t('settings.demoDone'));
  };

  const resetData = () => {
    setData(emptyData());
    setToast(t('settings.resetDone'));
  };

  const handleInstall = async () => {
    const accepted = await promptInstall();
    if (accepted) setToast(t('settings.installed'));
  };

  const addForDay = (startIso: string) => {
    setSheet({ initialStart: startIso, initialOngoing: dayKeyOf(startIso) === today });
  };

  return (
    <div class="app-shell">
      <header class="app-header">
        <div class="brand">
          <span class="brand-mark">
            <LogoMark size={26} />
          </span>
          <span class="brand-name">Mira</span>
        </div>
        <div class="header-actions">
          <button
            class="icon-btn"
            type="button"
            aria-pressed={settings.quiet}
            aria-label={settings.quiet ? t('a11y.quietOff') : t('a11y.quietOn')}
            onClick={() => updateSettings({ quiet: !settings.quiet })}
          >
            <IconMoon size={19} />
          </button>
        </div>
      </header>

      {settings.quiet && (
        <div class="quiet-banner">
          <span>{t('settings.quiet')}</span>
          <button type="button" onClick={() => updateSettings({ quiet: false })}>
            {t('a11y.quietOff')}
          </button>
        </div>
      )}

      <main id="main">
        {tab === 'today' && (
          <TodayView
            data={data}
            lang={lang}
            t={t}
            today={today}
            quiet={settings.quiet}
            onLog={() => setSheet({ initialOngoing: true })}
            onEdit={(episode) => setSheet({ episode })}
            onEnd={endEpisode}
            onQuickMeds={(episode) => setQuickMedId(episode.id)}
            onLoadDemo={() => loadDemo(true)}
          />
        )}
        {tab === 'calendar' && (
          <CalendarView data={data} lang={lang} t={t} today={today} onAdd={addForDay} onEdit={(episode) => setSheet({ episode })} />
        )}
        {tab === 'insights' && (
          <InsightsView
            data={data}
            lang={lang}
            t={t}
            today={today}
            onLog={() => setSheet({ initialOngoing: true })}
          />
        )}
        {tab === 'settings' && (
          <SettingsView
            data={data}
            settings={settings}
            lang={lang}
            t={t}
            onUpdateSettings={updateSettings}
            onOpenCatalog={setCatalogKind}
            onExport={handleExport}
            onImport={handleImport}
            onDemo={() => loadDemo(true)}
            onReset={resetData}
            onInstall={handleInstall}
            canInstall={canInstall}
          />
        )}
      </main>

      <BottomNav tab={tab} onChange={changeTab} t={t} />

      {sheet && (
        <EpisodeSheet
          key={sheet.episode?.id ?? sheet.initialStart ?? 'new'}
          data={data}
          lang={lang}
          t={t}
          episode={sheet.episode}
          initialStart={sheet.initialStart}
          initialOngoing={sheet.initialOngoing}
          onClose={() => setSheet(null)}
          onSave={saveEpisode}
          onDelete={sheet.episode ? deleteEpisode : undefined}
          onCreateMed={createMed}
        />
      )}

      {quickMedEpisode && (
        <QuickMedSheet
          key={quickMedEpisode.id}
          data={data}
          lang={lang}
          t={t}
          onClose={() => setQuickMedId(null)}
          onSave={(meds) => addMedsToEpisode(quickMedEpisode.id, meds)}
        />
      )}

      {catalogKind && (
        <CatalogSheet
          key={catalogKind}
          kind={catalogKind}
          items={catalogItems(catalogKind)}
          lang={lang}
          t={t}
          onClose={() => setCatalogKind(null)}
          onAdd={(name) => {
            updateCatalog(catalogKind, (items) => [...items, { id: uid(catalogKind), label: name }]);
            setToast(t('catalog.added'));
          }}
          onRename={(id, name) => {
            updateCatalog(catalogKind, (items) =>
              items.map((item) => (item.id === id ? { ...item, label: name } : item)),
            );
            setToast(t('catalog.renamed'));
          }}
          onArchive={(id) => {
            updateCatalog(catalogKind, (items) =>
              items.map((item) => (item.id === id ? { ...item, archived: true } : item)),
            );
            setToast(t('catalog.archived'));
          }}
        />
      )}

      {!settings.onboarded && (
        <WelcomeSheet
          lang={lang}
          t={t}
          onLang={(next) => updateSettings({ lang: next })}
          onStart={() => updateSettings({ onboarded: true })}
          onDemo={() => loadDemo(true)}
        />
      )}

      {toast && (
        <div class="toast" role="status" aria-live="polite">
          <span class="toast-check" aria-hidden="true">
            <IconCheck size={12} strokeWidth={3} />
          </span>
          {toast}
        </div>
      )}

    </div>
  );
}
