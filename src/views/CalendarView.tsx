import { useMemo, useState } from 'preact/hooks';
import type { Translate } from '../i18n';
import { dayKey, dayKeyOf, formatDayTitle, formatMonthDay, formatMonthTitle, parseDayKey } from '../lib/dates';
import { computeStats, severityBucket } from '../lib/stats';
import type { AppData, Episode, Lang } from '../lib/types';
import { EpisodeCard } from '../components/EpisodeCard';
import { IconChevronLeft, IconChevronRight, IconPlus } from '../components/Icons';

interface CalendarViewProps {
  data: AppData;
  lang: Lang;
  t: Translate;
  today: string;
  onAdd: (startIso: string) => void;
  onEdit: (episode: Episode) => void;
}

const WEEKDAYS: Record<Lang, string[]> = {
  zh: ['一', '二', '三', '四', '五', '六', '日'],
  'zh-Hant': ['一', '二', '三', '四', '五', '六', '日'],
  en: ['M', 'T', 'W', 'T', 'F', 'S', 'S'],
  ja: ['月', '火', '水', '木', '金', '土', '日'],
  fr: ['Lu', 'Ma', 'Me', 'Je', 'Ve', 'Sa', 'Di'],
  es: ['Lu', 'Ma', 'Mi', 'Ju', 'Vi', 'Sá', 'Do'],
  de: ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'],
  it: ['Lu', 'Ma', 'Me', 'Gi', 'Ve', 'Sa', 'Do'],
  pt: ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'],
};

function sameMonth(date: Date, key: string): boolean {
  const other = parseDayKey(key);
  return date.getFullYear() === other.getFullYear() && date.getMonth() === other.getMonth();
}

export function CalendarView({ data, lang, t, today, onAdd, onEdit }: CalendarViewProps) {
  const todayDate = parseDayKey(today);
  const [cursor, setCursor] = useState(new Date(todayDate.getFullYear(), todayDate.getMonth(), 1));
  const [selected, setSelected] = useState(today);

  const year = cursor.getFullYear();
  const month = cursor.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const offset = (new Date(year, month, 1).getDay() + 6) % 7;
  const monthStart = dayKey(new Date(year, month, 1));
  const monthEnd = dayKey(new Date(year, month, daysInMonth));

  const byDay = useMemo(() => {
    const map = new Map<string, Episode[]>();
    for (const episode of data.episodes) {
      const key = dayKeyOf(episode.start);
      if (key < monthStart || key > monthEnd) continue;
      const list = map.get(key) ?? [];
      list.push(episode);
      map.set(key, list);
    }
    return map;
  }, [data.episodes, monthStart, monthEnd]);

  const monthStats = computeStats(data.episodes, monthStart, monthEnd, today);
  const selectedEpisodes = (byDay.get(selected) ?? []).sort((a, b) => b.start.localeCompare(a.start));

  const currentMonth = sameMonth(cursor, today);
  const goToMonth = (delta: number) => {
    const next = new Date(year, month + delta, 1);
    if (next > new Date(todayDate.getFullYear(), todayDate.getMonth(), 1)) return;
    setCursor(next);
    const nextKey = dayKey(next);
    setSelected(sameMonth(next, today) ? today : nextKey);
  };

  const goToday = () => {
    setCursor(new Date(todayDate.getFullYear(), todayDate.getMonth(), 1));
    setSelected(today);
  };

  const cells: { key: string | null; day: number }[] = [];
  for (let i = 0; i < offset; i++) cells.push({ key: null, day: 0 });
  for (let day = 1; day <= daysInMonth; day++) {
    cells.push({ key: dayKey(new Date(year, month, day)), day });
  }
  while (cells.length % 7 !== 0) cells.push({ key: null, day: 0 });

  const addForSelected = () => {
    if (selected > today) return;
    const date = parseDayKey(selected);
    const isToday = selected === today;
    if (isToday) {
      date.setHours(new Date().getHours(), new Date().getMinutes(), 0, 0);
    } else {
      date.setHours(9, 0, 0, 0);
    }
    onAdd(date.toISOString());
  };

  return (
    <div class="view calendar">
      <header class="view-head">
        <h1 class="page-title">{t('calendar.title')}</h1>
      </header>

      <section class="card cal-card" aria-labelledby="cal-month-title">
        <div class="cal-head">
          <button class="icon-btn" type="button" onClick={() => goToMonth(-1)} aria-label={t('a11y.prevMonth')}>
            <IconChevronLeft size={19} />
          </button>
          <h2 class="cal-month" id="cal-month-title">
            {formatMonthTitle(cursor, lang)}
          </h2>
          <button
            class="icon-btn"
            type="button"
            onClick={() => goToMonth(1)}
            aria-label={t('a11y.nextMonth')}
            disabled={currentMonth}
          >
            <IconChevronRight size={19} />
          </button>
          {!sameMonth(cursor, today) && (
            <button class="text-btn" type="button" onClick={goToday}>
              {t('calendar.today')}
            </button>
          )}
        </div>
        <p class="cal-summary">
          {monthStats.attackDays > 0
            ? t('calendar.monthSummary', {
                days: monthStats.attackDays,
                avg: monthStats.avgSeverity ?? '—',
              })
            : t('calendar.noMonthData')}
        </p>

        <div class="weekdays" aria-hidden="true">
          {WEEKDAYS[lang].map((day, index) => (
            <span key={`${day}-${index}`}>{day}</span>
          ))}
        </div>

        <div class="cal-grid">
          {cells.map((cell, index) => {
            if (!cell.key) {
              return <span key={`empty-${index}`} class="cal-cell is-outside" aria-hidden="true" />;
            }
            const episodes = byDay.get(cell.key) ?? [];
            const maxSeverity = episodes.length ? Math.max(...episodes.map((episode) => episode.severity)) : 0;
            const level = maxSeverity ? severityBucket(maxSeverity) : null;
            const classes = [
              'cal-cell',
              episodes.length ? 'has-attack' : '',
              cell.key === today ? 'is-today' : '',
              cell.key === selected ? 'is-selected' : '',
            ]
              .filter(Boolean)
              .join(' ');
            const label = `${formatDayTitle(cell.key, lang)}${
              episodes.length
                ? ` · ${t(episodes.length === 1 ? 'calendar.daySummary.one' : 'calendar.daySummary.other', {
                    n: episodes.length,
                  })}`
                : ''
            }`;
            return (
              <button
                key={cell.key}
                type="button"
                class={classes}
                style={level ? `--sev:var(--sev-${level})` : undefined}
                aria-label={label}
                aria-pressed={cell.key === selected}
                onClick={() => setSelected(cell.key as string)}
              >
                <span class="cal-num">{cell.day}</span>
              </button>
            );
          })}
        </div>

        <div class="cal-legend" aria-label={t('calendar.legend')}>
          <span>
            <span class="legend-swatch" style="--sev:var(--sev-mild)" />
            {t('calendar.legendMild')}
          </span>
          <span>
            <span class="legend-swatch" style="--sev:var(--sev-moderate)" />
            {t('calendar.legendModerate')}
          </span>
          <span>
            <span class="legend-swatch" style="--sev:var(--sev-severe)" />
            {t('calendar.legendSevere')}
          </span>
        </div>
      </section>

      <section class="day-panel" aria-labelledby="day-title">
        <div class="day-panel-head">
          <div>
            <h2 class="day-panel-title" id="day-title">
              {selected === today ? t('common.today') : formatDayTitle(selected, lang)}
            </h2>
            <p class="day-panel-sub">
              {selectedEpisodes.length
                ? t(
                    selectedEpisodes.length === 1
                      ? 'calendar.daySummary.one'
                      : 'calendar.daySummary.other',
                    { n: selectedEpisodes.length },
                  )
                : formatMonthDay(selected, lang)}
            </p>          </div>
          {selected <= today && (
            <div class="day-actions">
              <button class="icon-btn" type="button" onClick={addForSelected} aria-label={t('calendar.addForDay')}>
                <IconPlus size={18} />
              </button>
            </div>
          )}
        </div>

        {selectedEpisodes.length === 0 ? (
          <div class="empty-inline">
            <strong>{t('calendar.empty')}</strong>
            {selected <= today && (
              <button class="text-btn" type="button" onClick={addForSelected}>
                {t('calendar.addForDay')}
              </button>
            )}
          </div>
        ) : (
          <div class="episode-list">
            {selectedEpisodes.map((episode) => (
              <EpisodeCard
                key={episode.id}
                episode={episode}
                data={data}
                lang={lang}
                t={t}
                onClick={() => onEdit(episode)}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
