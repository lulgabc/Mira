import type { Translate } from '../i18n';
import { catalogName } from '../i18n';
import { formatDuration, formatMonthDay, formatTime, minutesBetween, dayKeyOf, dayKey } from '../lib/dates';
import { severityBucket } from '../lib/stats';
import type { AppData, Episode, Lang } from '../lib/types';
import { IconChevronRight } from './Icons';

interface EpisodeCardProps {
  episode: Episode;
  data: AppData;
  lang: Lang;
  t: Translate;
  onClick: () => void;
}

export function episodeMeta(episode: Episode, data: AppData, lang: Lang, t: Translate): string {
  if (episode.meds.length > 0) {
    return episode.meds
      .map((med) => {
        const item = data.meds.find((candidate) => candidate.id === med.medId);
        return item ? catalogName('med', item, lang) : med.name;
      })
      .join(' · ');
  }
  if (episode.triggerIds.length > 0) {
    const names = episode.triggerIds
      .map((id) => {
        const item = data.triggers.find((trigger) => trigger.id === id);
        return item ? catalogName('trigger', item, lang) : null;
      })
      .filter((name): name is string => Boolean(name));
    if (names.length) return names.slice(0, 2).join(' · ');
  }
  if (episode.end) {
    return formatDuration(minutesBetween(episode.start, episode.end), lang);
  }
  return t('today.durationOngoing');
}

function relativeDay(key: string, lang: Lang, t: Translate): string {
  const today = dayKey();
  if (key === today) return t('common.today');
  if (key === dayKey(new Date(Date.now() - 86_400_000))) return t('common.yesterday');
  return formatMonthDay(key, lang);
}

export function EpisodeCard({ episode, data, lang, t, onClick }: EpisodeCardProps) {
  const dateKey = dayKeyOf(episode.start);
  const level = severityBucket(episode.severity);
  const end = episode.end ? formatTime(episode.end, lang) : t('capture.timeOngoing');

  return (
    <button class="episode-row" type="button" onClick={onClick}>
      <span class="sev-badge" data-level={level} aria-hidden="true">
        {episode.severity}
      </span>
      <span class="episode-main">
        <span class="episode-top">
          <span class="episode-date">{relativeDay(dateKey, lang, t)}</span>
          <span class="episode-time">
            {formatTime(episode.start, lang)} – {end}
          </span>
        </span>
        <span class="episode-meta">{episodeMeta(episode, data, lang, t)}</span>
      </span>
      <span class="episode-arrow" aria-hidden="true">
        <IconChevronRight size={17} />
      </span>
    </button>
  );
}
