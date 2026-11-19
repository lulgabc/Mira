import type { Translate } from '../i18n';
import { LANGS } from '../i18n';
import type { Lang } from '../lib/types';
import { LogoMark } from './Icons';
import { Sheet } from './Sheet';

interface WelcomeSheetProps {
  lang: Lang;
  t: Translate;
  onLang: (lang: Lang) => void;
  onStart: () => void;
  onDemo: () => void;
}

export function WelcomeSheet({ lang, t, onLang, onStart, onDemo }: WelcomeSheetProps) {
  return (
    <Sheet labelledBy="welcome-title" variant="welcome" onClose={onStart}>
      <div class="welcome-inner">
        <div class="welcome-logo">
          <LogoMark size={44} />
        </div>
        <h2 class="welcome-title" id="welcome-title">
          {t('welcome.title')}
        </h2>
        <p class="welcome-body">{t('welcome.body')}</p>
        <p class="welcome-lang-label">{t('welcome.language')}</p>
        <select
          class="select welcome-select"
          value={lang}
          aria-label={t('welcome.language')}
          onChange={(event) => onLang(event.currentTarget.value as Lang)}
        >
          {LANGS.map((item) => (
            <option key={item.id} value={item.id}>
              {item.label}
            </option>
          ))}
        </select>
        <div class="welcome-actions">
          <button class="btn btn-primary btn-block" type="button" onClick={onStart}>
            {t('welcome.start')}
          </button>
          <button class="btn btn-ghost btn-block" type="button" onClick={onDemo}>
            {t('welcome.demo')}
          </button>
        </div>
        <p class="welcome-privacy">{t('welcome.privacy')}</p>
        <span class="sr-only">{t('welcome.language')}</span>
      </div>
    </Sheet>
  );
}
