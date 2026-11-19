import { useState } from 'preact/hooks';
import type { Translate } from '../i18n';
import { catalogName } from '../i18n';
import type { CatalogItem, Lang } from '../lib/types';
import { IconCheck, IconClose, IconEdit, IconPlus, IconTrash } from './Icons';
import { Sheet } from './Sheet';

type Kind = 'med' | 'trigger' | 'symptom';

interface CatalogSheetProps {
  kind: Kind;
  items: CatalogItem[];
  lang: Lang;
  t: Translate;
  onClose: () => void;
  onAdd: (name: string) => void;
  onRename: (id: string, name: string) => void;
  onArchive: (id: string) => void;
}

const TITLE_KEYS: Record<Kind, 'catalog.medsTitle' | 'catalog.triggersTitle' | 'catalog.symptomsTitle'> = {
  med: 'catalog.medsTitle',
  trigger: 'catalog.triggersTitle',
  symptom: 'catalog.symptomsTitle',
};

const HINT_KEYS: Record<Kind, 'catalog.medsHint' | 'catalog.triggersHint' | 'catalog.symptomsHint'> = {
  med: 'catalog.medsHint',
  trigger: 'catalog.triggersHint',
  symptom: 'catalog.symptomsHint',
};

export function CatalogSheet({
  kind,
  items,
  lang,
  t,
  onClose,
  onAdd,
  onRename,
  onArchive,
}: CatalogSheetProps) {
  const visible = items.filter((item) => !item.archived);
  const [draft, setDraft] = useState('');
  const [error, setError] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState('');
  const [confirmId, setConfirmId] = useState<string | null>(null);

  const exists = (name: string, ignoreId?: string) =>
    visible.some(
      (item) => item.id !== ignoreId && catalogName(kind, item, lang).toLowerCase() === name.toLowerCase(),
    );

  const handleAdd = (event: Event) => {
    event.preventDefault();
    const name = draft.trim();
    if (!name) {
      setError(t('catalog.nameEmpty'));
      return;
    }
    if (exists(name)) {
      setError(t('catalog.duplicate'));
      return;
    }
    onAdd(name);
    setDraft('');
    setError('');
  };

  const startEdit = (item: CatalogItem) => {
    setEditingId(item.id);
    setEditDraft(catalogName(kind, item, lang));
    setConfirmId(null);
    setError('');
  };

  const saveEdit = (item: CatalogItem) => {
    const name = editDraft.trim();
    if (!name) {
      setError(t('catalog.nameEmpty'));
      return;
    }
    if (exists(name, item.id)) {
      setError(t('catalog.duplicate'));
      return;
    }
    onRename(item.id, name);
    setEditingId(null);
    setError('');
  };

  return (
    <Sheet labelledBy="catalog-sheet-title" onClose={onClose} class="catalog-manager">
      <div class="sheet-head">
        <h2 class="sheet-title" id="catalog-sheet-title">
          {t(TITLE_KEYS[kind])}
        </h2>
        <button class="icon-btn" type="button" onClick={onClose} aria-label={t('common.close')}>
          <IconClose size={20} />
        </button>
      </div>
      <form class="sheet-form" onSubmit={handleAdd}>
        <div class="sheet-body">
          <p class="catalog-hint">{t(HINT_KEYS[kind])}</p>
          <div class="catalog-add">
            <input
              class="input"
              value={draft}
              placeholder={t('catalog.addPlaceholder')}
              aria-label={t('catalog.addPlaceholder')}
              onInput={(event) => {
                setDraft((event.currentTarget as HTMLInputElement).value);
                setError('');
              }}
            />
            <button class="btn btn-soft" type="submit" disabled={!draft.trim()}>
              <IconPlus size={15} /> {t('catalog.add')}
            </button>
          </div>
          {error && <p class="form-error">{error}</p>}

          {visible.length === 0 ? (
            <div class="empty-inline">
              <strong>{t('catalog.empty')}</strong>
            </div>
          ) : (
            <div class="catalog-items">
              {visible.map((item) => {
                const name = catalogName(kind, item, lang);
                if (confirmId === item.id) {
                  return (
                    <div class="catalog-item is-confirm" key={item.id}>
                      <div class="catalog-confirm">
                        <span class="grow">{t('catalog.confirmDelete', { name })}</span>
                        <button type="button" onClick={() => setConfirmId(null)}>
                          {t('catalog.deleteNo')}
                        </button>
                        <button
                          type="button"
                          class="confirm"
                          onClick={() => {
                            onArchive(item.id);
                            setConfirmId(null);
                          }}
                        >
                          {t('catalog.deleteYes')}
                        </button>
                      </div>
                    </div>
                  );
                }
                if (editingId === item.id) {
                  return (
                    <div class="catalog-item" key={item.id}>
                      <div class="catalog-edit">
                        <input
                          class="input"
                          value={editDraft}
                          aria-label={t('catalog.rename')}
                          onInput={(event) => {
                            setEditDraft((event.currentTarget as HTMLInputElement).value);
                            setError('');
                          }}
                          onKeyDown={(event) => {
                            if (event.key === 'Enter') {
                              event.preventDefault();
                              saveEdit(item);
                            }
                            if (event.key === 'Escape') {
                              event.preventDefault();
                              setEditingId(null);
                            }
                          }}
                        />
                        <button
                          class="btn btn-soft"
                          type="button"
                          onClick={() => saveEdit(item)}
                          aria-label={t('common.save')}
                        >
                          <IconCheck size={15} />
                        </button>
                        <button class="btn btn-ghost" type="button" onClick={() => setEditingId(null)}>
                          {t('common.cancel')}
                        </button>
                      </div>
                    </div>
                  );
                }
                return (
                  <div class="catalog-item" key={item.id}>
                    <span class="catalog-item-name">{name}</span>
                    <div class="catalog-item-actions">
                      <button
                        class="icon-btn"
                        type="button"
                        onClick={() => startEdit(item)}
                        aria-label={`${t('catalog.rename')} ${name}`}
                      >
                        <IconEdit size={17} />
                      </button>
                      <button
                        class="icon-btn danger"
                        type="button"
                        onClick={() => {
                          setConfirmId(item.id);
                          setEditingId(null);
                        }}
                        aria-label={`${t('catalog.delete')} ${name}`}
                      >
                        <IconTrash size={17} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
        <div class="sheet-foot">
          <button class="btn btn-ghost btn-block" type="button" onClick={onClose}>
            {t('common.done')}
          </button>
        </div>
      </form>
    </Sheet>
  );
}
