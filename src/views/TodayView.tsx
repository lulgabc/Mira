import { useEffect, useState } from 'preact/hooks';
import type { Translate } from '../i18n';
import { severityKey } from '../i18n';
import {
  dayKey,
  dayKeyOf,
  diffDays,
  formatElapsed,
  formatFullDate,
  formatTime,
  greetingKey,
} from '../lib/dates';
import { computeStats, severityBucket } from '../lib/stats';
import type { AppData, Episode, Lang } from '../lib/types';
import { EpisodeCard } from '../components/EpisodeCard';
import { IconPlus } from '../components/Icons';

interface TodayViewProps {
  data: AppData;
  lang: Lang;
  t: Translate;
  today: string;
  quiet: boolean;
  onLog: (options?: { ongoing?: boolean }) => void;
  onEdit: (episode: Episode) => void;
  onEnd: (id: string) => void;
  onQuickMeds: (episode: Episode) => void;
  onLoadDemo: () => void;
}

function orbColors(severity: number | null, quiet: boolean): string {
  if (quiet) {
    if (severity === null) return '--orb-a:#d6b28e;--orb-b:#7a5638;--orb-c:#b49a7f';
    const bucket = severityBucket(severity);
    if (bucket === 'mild') return '--orb-a:#d0b08a;--orb-b:#86623f;--orb-c:#b9a082';
    if (bucket === 'moderate') return '--orb-a:#dbab74;--orb-b:#91643b;--orb-c:#c8a678';
    if (bucket === 'severe') return '--orb-a:#c98f73;--orb-b:#7b4633;--orb-c:#b99279';
    return '--orb-a:#c48a7d;--orb-b:#6c3b33;--orb-c:#b28a80';
  }
  if (severity === null) return '--orb-a:#a9d9cf;--orb-b:#427e76;--orb-c:#8fb6df';
  const bucket = severityBucket(severity);
  if (bucket === 'mild') return '--orb-a:#b7ddcb;--orb-b:#568d77;--orb-c:#96bdd9';
  if (bucket === 'moderate') return '--orb-a:#e4c88d;--orb-b:#a17b45;--orb-c:#d2a0b4';
  if (bucket === 'severe') return '--orb-a:#e3aa8c;--orb-b:#a95c4c;--orb-c:#cbb878';
  return '--orb-a:#d99aa6;--orb-b:#8e3d50;--orb-c:#c3a0de';
}

export function TodayView({
  data,
  lang,
  t,
  today,
  quiet,
  onLog,
  onEdit,
  onEnd,
  onQuickMeds,
  onLoadDemo,
}: TodayViewProps) {
  const [now, setNow] = useState(Date.now());
  const active = data.episodes.find((episode) => !episode.end) ?? null;
  const activeToday = Boolean(active && dayKeyOf(active.start) === today);
  const todayEpisodes = data.episodes.filter((episode) => dayKeyOf(episode.start) === today);
  const recent = [...data.episodes].sort((a, b) => b.start.localeCompare(a.start)).slice(0, 3);
  const latest = recent[0];
  const lastAttackDay = latest ? dayKeyOf(latest.start) : null;
  const sinceLast = lastAttackDay && lastAttackDay !== today ? diffDays(lastAttackDay, today) : null;
  const todayMaxSeverity = todayEpisodes.length
    ? Math.max(...todayEpisodes.map((episode) => episode.severity))
    : null;
  const todayLatest = todayEpisodes.sort((a, b) => b.start.localeCompare(a.start))[0];

  const monthStart = dayKey(new Date(new Date().getFullYear(), new Date().getMonth(), 1));
  const month = computeStats(data.episodes, monthStart, today, today);

  useEffect(() => {
    if (!active) return;
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, [active?.id]);

  const greeting = t(`greeting.${greetingKey()}` as const);

  const quietSeverity = active?.severity ?? todayMaxSeverity;
  const quietTitle = active
    ? t('today.ongoing')
    : todayEpisodes.length
      ? t(
          todayEpisodes.length === 1 ? 'today.todayCount.one' : 'today.todayCount.other',
          { n: todayEpisodes.length },
        )
      : t('today.quietDay');
  const quietSub = active
    ? `${t('today.started', { time: formatTime(active.start, lang) })} · ${t(severityKey(active.severity))}`
    : todayEpisodes.length && todayLatest
      ? `${formatTime(todayLatest.start, lang)} · ${t(severityKey(todayMaxSeverity ?? todayLatest.severity))}`
      : sinceLast
        ? t(sinceLast === 1 ? 'today.sinceLast.one' : 'today.sinceLast.other', { n: sinceLast })
        : t('today.firstRecord');
  const quietRule = quietSeverity
    ? `var(--sev-${severityBucket(quietSeverity)})`
    : 'var(--accent)';

  if (quiet) {
    return (
      <div class={`view today quiet-today${active ? ' is-active' : ''}`}>
        <p class="eyebrow quiet-date">{formatFullDate(new Date(), lang)}</p>

        <section class="quiet-hero">
          <h1 class="quiet-title">{quietTitle}</h1>
          <p class="quiet-sub">{quietSub}</p>
          <span class="quiet-rule" style={`--quiet-rule:${quietRule}`} aria-hidden="true" />
        </section>

        <div class="quiet-orb-stage">
          <div
            class={`orb quiet-orb${quietSeverity ? ' is-attack' : ' is-calm'}`}
            style={orbColors(quietSeverity, true)}
            aria-hidden="true"
          />
          {active && (
            <p
              class="quiet-timer"
              aria-label={t('today.elapsed', {
                duration: formatElapsed(now - new Date(active.start).getTime()),
              })}
            >
              {formatElapsed(now - new Date(active.start).getTime())}
            </p>
          )}
        </div>

        <div class="quiet-bottom">
          {active ? (
            <div class="quiet-actions">
              <button
                type="button"
                class="quiet-action"
                onClick={() => onQuickMeds(active)}
              >
                <span class="quiet-plus" aria-hidden="true">
                  <IconPlus size={16} />
                </span>
                <span>{t('today.addMed')}</span>
                <span class="quiet-arrow" aria-hidden="true">
                  →
                </span>
              </button>
              <button type="button" class="quiet-action" onClick={() => onEnd(active.id)}>
                <span>{t('today.end')}</span>
                <span class="quiet-arrow" aria-hidden="true">
                  →
                </span>
              </button>
            </div>
          ) : (
            <button
              type="button"
              class="quiet-primary"
              onClick={() => onLog({ ongoing: true })}
            >
              <span class="quiet-plus" aria-hidden="true">
                <IconPlus size={18} />
              </span>
              <span>{t('today.log')}</span>
              <span class="quiet-arrow" aria-hidden="true">
                →
              </span>
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div class="view today">
      <header class="today-head">
        <div>
          <p class="eyebrow today-date">{formatFullDate(new Date(), lang)}</p>
          <h1 class={`today-greeting${quiet ? ' sr-only' : ''}`}>
            {greeting}
            {lang === 'zh' || lang === 'zh-Hant' || lang === 'ja' ? '。' : '.'}
          </h1>
        </div>
      </header>

      <section class="card hero-card" aria-labelledby="hero-title">
        <div class="hero-grid">
          <div class="hero-copy">
            <h2 class="hero-title" id="hero-title">
              {todayEpisodes.length
                ? t(
                    todayEpisodes.length === 1
                      ? 'today.todayCount.one'
                      : 'today.todayCount.other',
                    { n: todayEpisodes.length },
                  )
                : t('today.quietDay')}
            </h2>
            {!activeToday && (
              <p class="hero-sub">
                {todayEpisodes.length && todayLatest
                  ? `${formatTime(todayLatest.start, lang)} · ${t(severityKey(todayMaxSeverity ?? todayLatest.severity))}`
                  : sinceLast
                    ? t(sinceLast === 1 ? 'today.sinceLast.one' : 'today.sinceLast.other', { n: sinceLast })
                    : t('today.firstRecord')}
              </p>
            )}
            {!active && (
              <div class="hero-actions">
                <button class="btn btn-primary" type="button" onClick={() => onLog({ ongoing: true })}>
                  <IconPlus size={18} />
                  {t('today.log')}
                </button>
              </div>
            )}
          </div>
          <div
            class={`orb${todayEpisodes.length ? ' is-attack' : ' is-calm'}`}
            style={orbColors(todayMaxSeverity, quiet)}
            aria-hidden="true"
          />
        </div>
      </section>

      {active && (
        <section class="card active-card" aria-labelledby="active-title">
          <div class="active-top">
            <div>
              <span class="live-label">
                <span class="live-dot" aria-hidden="true" />
                <span id="active-title">{t('today.ongoing')}</span>
              </span>
              <p class="active-meta">
                {t('today.started', { time: formatTime(active.start, lang) })} ·{' '}
                {t(severityKey(active.severity))}
              </p>
            </div>
            <span class="active-timer" aria-label={t('today.elapsed', { duration: formatElapsed(now - new Date(active.start).getTime()) })}>
              {formatElapsed(now - new Date(active.start).getTime())}
            </span>
          </div>
          <div class="active-actions">
            <button class="btn btn-soft" type="button" onClick={() => onQuickMeds(active)}>
              <IconPlus size={16} />
              {t('today.addMed')}
            </button>
            <button class="btn btn-ghost" type="button" onClick={() => onEnd(active.id)}>
              {t('today.end')}
            </button>
          </div>
        </section>
      )}

      {!quiet && (
  <div class="stat-strip" role="group" aria-label={t('today.monthTitle')}>
    <div>
      <span class="stat-label">{t('today.attackDays')}</span>
      <span class="stat-value">
        {month.attackDays}
        <small>{t(month.attackDays === 1 ? 'common.day' : 'common.days')}</small>
      </span>
    </div>
    <div>
      <span class="stat-label">{t('today.avgSeverity')}</span>
      <span class="stat-value">{month.avgSeverity ?? '—'}</span>
    </div>
    <div>
      <span class="stat-label">{t('today.painFree')}</span>
      <span class="stat-value">
        {data.episodes.length === 0 ? '—' : month.painFreeDays}
        {data.episodes.length > 0 && (
          <small>{t(month.painFreeDays === 1 ? 'common.day' : 'common.days')}</small>
        )}
      </span>
    </div>
  </div>

      )}

      {!quiet && (
  <section class="section" aria-labelledby="recent-title">
    <h2 class="section-title" id="recent-title">
      {t('today.recent')}
    </h2>
    {recent.length === 0 ? (
      <div class="empty-inline">
        <strong>{t('today.emptyTitle')}</strong>
        <p>{t('today.emptyBody')}</p>
        <button class="text-btn" type="button" onClick={onLoadDemo}>
          {t('today.demoHint')}
        </button>
      </div>
    ) : (
      <div class="episode-list">
        {recent.map((episode) => (
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
      )}


    </div>
  );
}
