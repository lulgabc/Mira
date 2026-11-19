import { useState } from 'preact/hooks';
import type { Translate } from '../i18n';
import { catalogName } from '../i18n';
import {
  endAfterMinutes,
  fromDateTimeInput,
  toDateTimeInput,
} from '../lib/dates';
import type { AppData, CatalogItem, Episode, EpisodeDraft, EpisodeMed, Lang, Relief } from '../lib/types';
import { IconCheck, IconClose, IconPlus, IconTrash } from './Icons';
import { SeverityDial } from './SeverityDial';
import { Sheet } from './Sheet';
import { Switch } from './Switch';

interface EpisodeSheetProps {
  data: AppData;
  lang: Lang;
  t: Translate;
  episode?: Episode;
  initialStart?: string;
  initialOngoing?: boolean;
  onClose: () => void;
  onSave: (draft: EpisodeDraft) => void;
  onDelete?: (id: string) => void;
  onCreateMed: (name: string) => CatalogItem;
}

const PRESETS: { minutes: number; key: 'capture.preset.30m' | 'capture.preset.1h' | 'capture.preset.2h' | 'capture.preset.4h' | 'capture.preset.8h' | 'capture.preset.12h' | 'capture.preset.1d' }[] = [
  { minutes: 30, key: 'capture.preset.30m' },
  { minutes: 60, key: 'capture.preset.1h' },
  { minutes: 120, key: 'capture.preset.2h' },
  { minutes: 240, key: 'capture.preset.4h' },
  { minutes: 480, key: 'capture.preset.8h' },
  { minutes: 720, key: 'capture.preset.12h' },
  { minutes: 1440, key: 'capture.preset.1d' },
];

export function EpisodeSheet({
  data,
  lang,
  t,
  episode,
  initialStart,
  initialOngoing,
  onClose,
  onSave,
  onDelete,
  onCreateMed,
}: EpisodeSheetProps) {
  const now = new Date().toISOString();
  const defaultStart = episode?.start ?? initialStart ?? now;
  const defaultOngoing = episode ? !episode.end : (initialOngoing ?? true);
  const defaultEnd = episode?.end ?? endAfterMinutes(defaultStart, 120);

  const [startInput, setStartInput] = useState(toDateTimeInput(defaultStart));
  const [endInput, setEndInput] = useState(toDateTimeInput(defaultEnd));
  const [ongoing, setOngoing] = useState(defaultOngoing);
  const [severity, setSeverity] = useState(episode?.severity ?? 5);
  const [symptomIds, setSymptomIds] = useState<string[]>(episode?.symptomIds ?? []);
  const [triggerIds, setTriggerIds] = useState<string[]>(episode?.triggerIds ?? []);
  const [meds, setMeds] = useState<EpisodeMed[]>(episode?.meds ?? []);
  const [notes, setNotes] = useState(episode?.notes ?? '');
  const [addingMed, setAddingMed] = useState(false);
  const [newMedName, setNewMedName] = useState('');
  const [error, setError] = useState('');
  const [confirmDelete, setConfirmDelete] = useState(false);

  const visibleMeds = data.meds.filter((med) => !med.archived);
  const visibleSymptoms = data.symptoms.filter((item) => !item.archived);
  const visibleTriggers = data.triggers.filter((item) => !item.archived);

  const toggle = (value: string, list: string[], setList: (next: string[]) => void) => {
    setList(list.includes(value) ? list.filter((item) => item !== value) : [...list, value]);
  };

  const toggleMed = (item: CatalogItem) => {
    if (meds.some((med) => med.medId === item.id)) {
      setMeds(meds.filter((med) => med.medId !== item.id));
    } else {
      setMeds([...meds, { medId: item.id, name: catalogName('med', item, lang) }]);
    }
  };

  const updateMed = (id: string, patch: Partial<EpisodeMed>) => {
    setMeds(meds.map((med) => (med.medId === id ? { ...med, ...patch } : med)));
  };

  const applyPreset = (minutes: number) => {
    const start = fromDateTimeInput(startInput);
    if (!start) return;
    setEndInput(toDateTimeInput(endAfterMinutes(start, minutes)));
  };

  const handleAddMed = () => {
    const name = newMedName.trim();
    if (!name) return;
    const item = onCreateMed(name);
    setMeds((current) => [...current, { medId: item.id, name: catalogName('med', item, lang) }]);
    setNewMedName('');
    setAddingMed(false);
  };

  const handleSubmit = (event: Event) => {
    event.preventDefault();
    const start = fromDateTimeInput(startInput);
    if (!start) {
      setError(t('capture.error.start'));
      return;
    }
    const nowLimit = Date.now() + 60_000;
    if (new Date(start).getTime() > nowLimit) {
      setError(t('capture.error.future'));
      return;
    }
    let end: string | undefined;
    if (!ongoing) {
      const parsedEnd = fromDateTimeInput(endInput);
      if (!parsedEnd || new Date(parsedEnd).getTime() < new Date(start).getTime()) {
        setError(t('capture.error.endBeforeStart'));
        return;
      }
      if (new Date(parsedEnd).getTime() > nowLimit) {
        setError(t('capture.error.future'));
        return;
      }
      end = parsedEnd;
    }
    onSave({
      id: episode?.id,
      start,
      end,
      severity,
      symptomIds,
      triggerIds,
      meds,
      notes: notes.trim(),
    });
  };

  const handleDelete = () => {
    if (!episode || !onDelete) return;
    if (!confirmDelete) {
      setConfirmDelete(true);
      return;
    }
    onDelete(episode.id);
  };

  return (
    <Sheet labelledBy="episode-sheet-title" onClose={onClose}>
      <div class="sheet-head">
        <div>
          <h2 class="sheet-title" id="episode-sheet-title">
            {episode ? t('capture.editTitle') : t('capture.newTitle')}
          </h2>
        </div>
        <button class="icon-btn" type="button" onClick={onClose} aria-label={t('common.close')}>
          <IconClose size={20} />
        </button>
      </div>

      <form class="sheet-form" onSubmit={handleSubmit} noValidate>
        <div class="sheet-body">
          <section class="form-section">
            <div class="form-label-row">
              <span class="form-label">{t('severity.label')}</span>
              <span class="form-hint">1–10</span>
            </div>
            <SeverityDial value={severity} onChange={setSeverity} t={t} />
          </section>

          <section class="form-section">
            <span class="form-label">{t('capture.when')}</span>
            <div class={`field-grid${ongoing ? ' single' : ''}`}>
              <label class="field">
                <span>{t('capture.start')}</span>
                <input
                  class="input"
                  type="datetime-local"
                  value={startInput}
                  max={toDateTimeInput(new Date().toISOString())}
                  onInput={(event) => setStartInput((event.currentTarget as HTMLInputElement).value)}
                />
              </label>
              {!ongoing && (
                <label class="field">
                  <span>{t('capture.end')}</span>
                  <input
                    class="input"
                    type="datetime-local"
                    value={endInput}
                    max={toDateTimeInput(new Date().toISOString())}
                    onInput={(event) => setEndInput((event.currentTarget as HTMLInputElement).value)}
                  />
                </label>
              )}
            </div>
            <div class="check-line">
              <span class="check-line-text">
                <span class="check-line-title">{t('capture.ongoing')}</span>
                <span class="check-line-desc">{t('capture.ongoingHint')}</span>
              </span>
              <Switch
                checked={ongoing}
                label={t('capture.ongoing')}
                onChange={(checked) => {
                  setOngoing(checked);
                  setError('');
                  if (!checked) {
                    const start = fromDateTimeInput(startInput);
                    const currentEnd = fromDateTimeInput(endInput);
                    if (start && (!currentEnd || new Date(currentEnd) <= new Date(start))) {
                      setEndInput(toDateTimeInput(endAfterMinutes(start, 120)));
                    }
                  }
                }}
              />
            </div>
            {!ongoing && (
              <div class="duration-chips" role="group" aria-label={t('capture.duration')}>
                {PRESETS.map((preset) => (
                  <button
                    key={preset.minutes}
                    type="button"
                    class="chip"
                    onClick={() => applyPreset(preset.minutes)}
                  >
                    {t(preset.key)}
                  </button>
                ))}
              </div>
            )}
            {error && <p class="form-error">{error}</p>}
          </section>

          <section class="form-section">
            <span class="form-label">{t('capture.symptoms')}</span>
            <div class="chips">
              {visibleSymptoms.map((item) => {
                const on = symptomIds.includes(item.id);
                return (
                  <button
                    key={item.id}
                    type="button"
                    class="chip"
                    aria-pressed={on}
                    onClick={() => toggle(item.id, symptomIds, setSymptomIds)}
                  >
                    {catalogName('symptom', item, lang)}
                  </button>
                );
              })}
            </div>
          </section>

          <section class="form-section">
            <div class="form-label-row">
              <span class="form-label">{t('capture.triggers')}</span>
              <span class="form-optional">{t('common.optional')}</span>
            </div>
            <div class="chips">
              {visibleTriggers.map((item) => {
                const on = triggerIds.includes(item.id);
                return (
                  <button
                    key={item.id}
                    type="button"
                    class="chip"
                    aria-pressed={on}
                    onClick={() => toggle(item.id, triggerIds, setTriggerIds)}
                  >
                    {catalogName('trigger', item, lang)}
                  </button>
                );
              })}
            </div>
          </section>

          <section class="form-section">
            <div class="form-label-row">
              <span class="form-label">{t('capture.meds')}</span>
              <button
                type="button"
                class="text-btn"
                onClick={() => setAddingMed((value) => !value)}
              >
                <IconPlus size={14} /> {t('common.add')}
              </button>
            </div>
            {addingMed && (
              <div class="catalog-add">
                <input
                  class="input"
                  value={newMedName}
                  placeholder={t('catalog.addPlaceholder')}
                  aria-label={t('catalog.addPlaceholder')}
                  onInput={(event) => setNewMedName((event.currentTarget as HTMLInputElement).value)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter') {
                      event.preventDefault();
                      handleAddMed();
                    }
                  }}
                />
                <button type="button" class="btn btn-soft" onClick={handleAddMed} disabled={!newMedName.trim()}>
                  {t('common.add')}
                </button>
              </div>
            )}
            {visibleMeds.length === 0 ? (
              <p class="no-meds">
                {t('capture.noMeds')}
                <br />
                <span class="faint">{t('capture.manageMeds')}</span>
              </p>
            ) : (
              <div class="med-picks">
                {visibleMeds.map((item) => {
                  const selected = meds.find((med) => med.medId === item.id);
                  return (
                    <div key={item.id}>
                      <label class={`med-option${selected ? ' is-on' : ''}`}>
                        <input
                          type="checkbox"
                          checked={Boolean(selected)}
                          onChange={() => toggleMed(item)}
                        />
                        <span class="med-checkbox" aria-hidden="true">
                          {selected && <IconCheck size={12} strokeWidth={3} />}
                        </span>
                        <span class="med-option-name">{catalogName('med', item, lang)}</span>
                      </label>
                      {selected && (
                        <div class="med-extra">
                          <label class="field">
                            <span>{t('capture.dose')}</span>
                            <input
                              class="input"
                              value={selected.dose ?? ''}
                              placeholder={t('capture.dosePlaceholder')}
                              onInput={(event) =>
                                updateMed(item.id, {
                                  dose: (event.currentTarget as HTMLInputElement).value,
                                })
                              }
                            />
                          </label>
                          <label class="field">
                            <span>{t('capture.relief')}</span>
                            <select
                              class="select"
                              value={selected.relief === undefined ? '' : String(selected.relief)}
                              onChange={(event) => {
                                const value = (event.currentTarget as HTMLSelectElement).value;
                                updateMed(item.id, {
                                  relief: value === '' ? undefined : (Number(value) as Relief),
                                });
                              }}
                            >
                              <option value="">—</option>
                              <option value="0">{t('capture.relief.none')}</option>
                              <option value="1">{t('capture.relief.some')}</option>
                              <option value="2">{t('capture.relief.good')}</option>
                            </select>
                          </label>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </section>

          <section class="form-section">
            <label class="field">
              <span class="form-label">{t('capture.notes')}</span>
              <textarea
                class="textarea"
                value={notes}
                placeholder={t('capture.notesPlaceholder')}
                onInput={(event) => setNotes((event.currentTarget as HTMLTextAreaElement).value)}
              />
            </label>
          </section>
        </div>

        <div class="sheet-foot">
          {episode && onDelete && (
            <button
              class="icon-btn"
              type="button"
              onClick={handleDelete}
              aria-label={t('common.delete')}
              title={confirmDelete ? t('capture.deleteConfirm') : t('common.delete')}
              style={confirmDelete ? 'color:var(--danger);border-color:var(--danger);background:var(--danger-wash)' : ''}
            >
              <IconTrash size={20} />
            </button>
          )}
          {confirmDelete && (
            <button class="btn btn-danger" type="button" onClick={handleDelete}>
              {t('common.confirm')}
            </button>
          )}
          <button class="btn btn-primary" type="submit">
            {t('capture.save')}
          </button>
        </div>
      </form>
    </Sheet>
  );
}
