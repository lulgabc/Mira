import { useRef, useState } from 'preact/hooks';
import type { Translate } from '../i18n';
import { LANGS } from '../i18n';
import type { AppData, Lang, Settings, ThemePref } from '../lib/types';
import {
  IconDatabase,
  IconDownload,
  IconPill,
  IconPulse,
  IconSparkles,
  IconTrash,
  IconUpload,
} from '../components/Icons';
import { LogoMark } from '../components/Icons';
import { Switch } from '../components/Switch';

interface SettingsViewProps {
  data: AppData;
  settings: Settings;
  lang: Lang;
  t: Translate;
  onUpdateSettings: (patch: Partial<Settings>) => void;
  onOpenCatalog: (kind: 'med' | 'trigger' | 'symptom') => void;
  onExport: () => void;
  onImport: (file: File) => void;
  onDemo: () => void;
  onReset: () => void;
  onInstall: () => void;
  canInstall: boolean;
}

const THEME_OPTIONS: { id: ThemePref; key: 'settings.themeAuto' | 'settings.themeLight' | 'settings.themeDark' }[] = [
  { id: 'auto', key: 'settings.themeAuto' },
  { id: 'light', key: 'settings.themeLight' },
  { id: 'dark', key: 'settings.themeDark' },
];

export function SettingsView({
  data,
  settings,
  lang,
  t,
  onUpdateSettings,
  onOpenCatalog,
  onExport,
  onImport,
  onDemo,
  onReset,
  onInstall,
  canInstall,
}: SettingsViewProps) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [confirmDemo, setConfirmDemo] = useState(false);
  const [confirmReset, setConfirmReset] = useState(false);
  const activeMeds = data.meds.filter((item) => !item.archived).length;
  const activeTriggers = data.triggers.filter((item) => !item.archived).length;
  const activeSymptoms = data.symptoms.filter((item) => !item.archived).length;
  const standalone =
    typeof window !== 'undefined' && window.matchMedia?.('(display-mode: standalone)').matches;
  const isIos = typeof navigator !== 'undefined' && /iPad|iPhone|iPod/.test(navigator.userAgent);

  return (
    <div class="view settings">
      <header class="view-head">
        <p class="eyebrow">{t('settings.eyebrow')}</p>
        <h1 class="page-title">{t('settings.title')}</h1>
        <p class="page-sub">{t('settings.subtitle')}</p>
      </header>

      <section class="settings-group">
        <div class="settings-card">
          <div class="setting-row stack">
            <span class="setting-label">{t('settings.theme')}</span>
            <div class="theme-row" role="group" aria-label={t('settings.theme')}>
              {THEME_OPTIONS.map((option) => (
                <button
                  key={option.id}
                  type="button"
                  class="theme-option"
                  aria-pressed={settings.theme === option.id}
                  onClick={() => onUpdateSettings({ theme: option.id })}
                >
                  <span class={`theme-swatch ${option.id}`} aria-hidden="true" />
                  {t(option.key)}
                </button>
              ))}
            </div>
          </div>
          <div class="setting-row">
            <div class="setting-main">
              <div class="setting-label">{t('settings.quiet')}</div>
              <div class="setting-desc">{t('settings.quietDesc')}</div>
            </div>
            <Switch
              checked={settings.quiet}
              label={t('settings.quiet')}
              onChange={(quiet) => onUpdateSettings({ quiet })}
            />
          </div>
          <div class="setting-row stack">
            <span class="setting-label">{t('settings.language')}</span>
            <div class="lang-seg" role="group" aria-label={t('settings.language')}>
              {LANGS.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  aria-pressed={lang === item.id}
                  onClick={() => onUpdateSettings({ lang: item.id })}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section class="settings-group">
        <div class="settings-group-head">
          <h2 class="settings-group-title">{t('settings.catalogs')}</h2>
          <span class="settings-group-note">{t('settings.catalogsDesc')}</span>
        </div>
        <div class="settings-card">
          <button class="catalog-row" type="button" onClick={() => onOpenCatalog('med')}>
            <span class="catalog-icon" aria-hidden="true">
              <IconPill size={18} />
            </span>
            <span class="catalog-main">
              <span class="catalog-name">{t('settings.meds')}</span>
              <span class="catalog-count">{activeMeds}</span>
            </span>
            <span class="catalog-arrow" aria-hidden="true">
              ›
            </span>
          </button>
          <button class="catalog-row" type="button" onClick={() => onOpenCatalog('trigger')}>
            <span class="catalog-icon" aria-hidden="true">
              <IconSparkles size={18} />
            </span>
            <span class="catalog-main">
              <span class="catalog-name">{t('settings.triggers')}</span>
              <span class="catalog-count">{activeTriggers}</span>
            </span>
            <span class="catalog-arrow" aria-hidden="true">
              ›
            </span>
          </button>
          <button class="catalog-row" type="button" onClick={() => onOpenCatalog('symptom')}>
            <span class="catalog-icon" aria-hidden="true">
              <IconPulse size={18} />
            </span>
            <span class="catalog-main">
              <span class="catalog-name">{t('settings.symptoms')}</span>
              <span class="catalog-count">{activeSymptoms}</span>
            </span>
            <span class="catalog-arrow" aria-hidden="true">
              ›
            </span>
          </button>
        </div>
      </section>

      <section class="settings-group">
        <div class="settings-group-head">
          <h2 class="settings-group-title">{t('settings.data')}</h2>
          <span class="settings-group-note">{t('settings.countLine', { n: data.episodes.length, m: activeMeds })}</span>
        </div>
        <div class="settings-card">
          <div class="setting-row">
            <div class="setting-main">
              <div class="setting-label">{t('settings.data')}</div>
              <div class="setting-desc">{t('settings.dataDesc')}</div>
            </div>
          </div>
          <div class="data-actions">
            <button class="data-btn" type="button" onClick={onExport}>
              <span class="data-icon" aria-hidden="true">
                <IconDownload size={17} />
              </span>
              <span class="grow">{t('settings.export')}</span>
            </button>
            <button class="data-btn" type="button" onClick={() => fileRef.current?.click()}>
              <span class="data-icon" aria-hidden="true">
                <IconUpload size={17} />
              </span>
              <span class="grow">{t('settings.import')}</span>
            </button>
            <input
              ref={fileRef}
              type="file"
              accept="application/json,.json"
              class="sr-only"
              aria-label={t('settings.import')}
              onChange={(event) => {
                const file = (event.currentTarget as HTMLInputElement).files?.[0];
                if (file) onImport(file);
                (event.currentTarget as HTMLInputElement).value = '';
              }}
            />
            <button class="data-btn" type="button" onClick={() => setConfirmDemo(true)}>
              <span class="data-icon" aria-hidden="true">
                <IconDatabase size={17} />
              </span>
              <span class="grow">{t('settings.demo')}</span>
            </button>
            {confirmDemo && (
              <div class="inline-confirm">
                <span class="grow">{t('settings.demoConfirm')}</span>
                <span class="inline-confirm-actions">
                  <button type="button" onClick={() => setConfirmDemo(false)}>
                    {t('common.cancel')}
                  </button>
                  <button
                    type="button"
                    class="confirm"
                    onClick={() => {
                      onDemo();
                      setConfirmDemo(false);
                    }}
                  >
                    {t('settings.demoConfirmYes')}
                  </button>
                </span>
              </div>
            )}
            <button class="data-btn danger" type="button" onClick={() => setConfirmReset(true)}>
              <span class="data-icon" aria-hidden="true">
                <IconTrash size={17} />
              </span>
              <span class="grow">{t('settings.reset')}</span>
            </button>
            {confirmReset && (
              <div class="inline-confirm">
                <span class="grow">{t('settings.resetConfirm')}</span>
                <span class="inline-confirm-actions">
                  <button type="button" onClick={() => setConfirmReset(false)}>
                    {t('common.cancel')}
                  </button>
                  <button
                    type="button"
                    class="confirm"
                    onClick={() => {
                      onReset();
                      setConfirmReset(false);
                    }}
                  >
                    {t('settings.resetConfirmYes')}
                  </button>
                </span>
              </div>
            )}
          </div>
        </div>
      </section>

      <section class="settings-group">
        <div class="settings-card">
          <div class="setting-row stack">
            <div class="setting-main">
              <div class="setting-label">{t('settings.install')}</div>
              <div class="setting-desc">
                {standalone
                  ? t('settings.installed')
                  : canInstall
                    ? t('settings.installHint')
                    : isIos
                      ? t('settings.installIos')
                      : t('settings.installUnavailable')}
              </div>
            </div>
            {!standalone && (
              <button
                class="btn btn-ghost btn-block"
                type="button"
                style="margin-top:12px"
                onClick={onInstall}
                disabled={!canInstall}
              >
                {t('settings.install')}
              </button>
            )}
          </div>
        </div>
      </section>

      <section class="settings-group">
        <div class="settings-group-head">
          <h2 class="settings-group-title">{t('settings.about')}</h2>
        </div>
        <div class="card about-card">
          <div class="about-mark">
            <LogoMark size={38} />
          </div>
          <div class="about-name">Mira</div>
          <div class="about-version">
            {t('settings.version')} 0.1.0
          </div>
          <p class="about-privacy">{t('settings.privacy')}</p>
          <p class="about-disclaimer">{t('settings.disclaimer')}</p>
          <p class="about-made">{t('settings.madeBy')}</p>
        </div>
      </section>

      <p class="footnote">{t('insights.footnote')}</p>
    </div>
  );
}
