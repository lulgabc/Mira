import { useState } from 'preact/hooks';
import type { Translate } from '../i18n';
import { catalogName } from '../i18n';
import type { AppData, EpisodeMed, Lang } from '../lib/types';
import { IconCheck, IconClose } from './Icons';
import { Sheet } from './Sheet';

interface QuickMedSheetProps {
  data: AppData;
  lang: Lang;
  t: Translate;
  onClose: () => void;
  onSave: (meds: EpisodeMed[]) => void;
}

export function QuickMedSheet({ data, lang, t, onClose, onSave }: QuickMedSheetProps) {
  const meds = data.meds.filter((med) => !med.archived);
  const [selected, setSelected] = useState<Record<string, string>>({});

  const toggle = (id: string) => {
    setSelected((current) => {
      if (Object.hasOwn(current, id)) {
        const next = { ...current };
        delete next[id];
        return next;
      }
      return { ...current, [id]: '' };
    });
  };

  const handleSave = (event: Event) => {
    event.preventDefault();
    const entries: EpisodeMed[] = meds
      .filter((med) => Object.hasOwn(selected, med.id))
      .map((med) => ({
        medId: med.id,
        name: catalogName('med', med, lang),
        dose: selected[med.id]?.trim() || undefined,
      }));
    if (entries.length === 0) return;
    onSave(entries);
  };

  return (
    <Sheet labelledBy="quick-meds-title" onClose={onClose}>
      <div class="sheet-head">
        <h2 class="sheet-title" id="quick-meds-title">
          {t('today.quickMedsTitle')}
        </h2>
        <button class="icon-btn" type="button" onClick={onClose} aria-label={t('common.close')}>
          <IconClose size={20} />
        </button>
      </div>
      <form class="sheet-form" onSubmit={handleSave}>
        <div class="sheet-body">
          {meds.length === 0 ? (
            <p class="no-meds">{t('today.quickMedsEmpty')}</p>
          ) : (
            <div class="quick-list">
              {meds.map((med) => {
                const on = Object.hasOwn(selected, med.id);
                return (
                  <div key={med.id} class={`quick-row${on ? ' is-on' : ''}`}>
                    <label class={`med-option${on ? ' is-on' : ''}`}>
                      <input type="checkbox" checked={on} onChange={() => toggle(med.id)} />
                      <span class="med-checkbox" aria-hidden="true">
                        {on && <IconCheck size={12} strokeWidth={3} />}
                      </span>
                      <span class="med-option-name">{catalogName('med', med, lang)}</span>
                    </label>
                    {on && (
                      <input
                        class="input"
                        value={selected[med.id] ?? ''}
                        placeholder={t('today.quickMedsDose')}
                        aria-label={`${catalogName('med', med, lang)} ${t('today.quickMedsDose')}`}
                        onInput={(event) =>
                          setSelected((current) => ({
                            ...current,
                            [med.id]: (event.currentTarget as HTMLInputElement).value,
                          }))
                        }
                      />
                    )}
                  </div>
                );
              })}
            </div>
          )}
          {meds.length > 0 && Object.keys(selected).length === 0 && (
            <p class="form-subtle">{t('today.noMedSelected')}</p>
          )}
        </div>
        <div class="sheet-foot">
          <button class="btn btn-primary" type="submit" disabled={Object.keys(selected).length === 0}>
            {t('today.quickMedsSave')}
          </button>
        </div>
      </form>
    </Sheet>
  );
}
