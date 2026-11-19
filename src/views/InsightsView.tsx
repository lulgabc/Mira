import { useMemo, useState } from 'preact/hooks';
import type { Translate } from '../i18n';
import { catalogName, pluralKey } from '../i18n';
import { addDays, dayKey, formatDuration, formatMonthDay, parseDayKey } from '../lib/dates';
import {
  buildBuckets,
  computeStats,
  medRanking,
  symptomRanking,
  triggerRanking,
} from '../lib/stats';
import type { AppData, Lang } from '../lib/types';
import { TrendChart } from '../components/Charts';
import { IconPill, IconSparkles } from '../components/Icons';

interface InsightsViewProps {
  data: AppData;
  lang: Lang;
  t: Translate;
  today: string;
  onLog: () => void;
}

type Period = 30 | 90 | 365;

const PERIOD_KEYS: Record<Period, 'insights.period30' | 'insights.period90' | 'insights.period365'> = {
  30: 'insights.period30',
  90: 'insights.period90',
  365: 'insights.period365',
};

export function InsightsView({ data, lang, t, today, onLog }: InsightsViewProps) {
  const [period, setPeriod] = useState<Period>(30);

  const stats = useMemo(() => {
    const to = today;
    const from = dayKey(addDays(parseDayKey(today), -(period - 1)));
    const previousTo = dayKey(addDays(parseDayKey(from), -1));
    const previousFrom = dayKey(addDays(parseDayKey(previousTo), -(period - 1)));
    const current = computeStats(data.episodes, from, to, today);
    const previous = computeStats(data.episodes, previousFrom, previousTo, today);
    return { from, to, current, previous };
  }, [data.episodes, period, today]);

  const { current, previous, from, to } = stats;

  const buckets = useMemo(
    () =>
      buildBuckets(
        current.episodes,
        from,
        to,
        period === 30 ? 30 : period === 90 ? 13 : 12,
      ),
    [current.episodes, from, to, period],
  );

  const triggerNames = useMemo(() => {
    const map = new Map<string, string>();
    for (const item of data.triggers) map.set(item.id, catalogName('trigger', item, lang));
    return map;
  }, [data.triggers, lang]);

  const symptomNames = useMemo(() => {
    const map = new Map<string, string>();
    for (const item of data.symptoms) map.set(item.id, catalogName('symptom', item, lang));
    return map;
  }, [data.symptoms, lang]);

  const triggers = triggerRanking(current.episodes, triggerNames).slice(0, 5);
  const symptoms = symptomRanking(current.episodes, symptomNames).slice(0, 5);
  const medNames = useMemo(() => {
    const map = new Map<string, string>();
    for (const item of data.meds) map.set(item.id, catalogName('med', item, lang));
    return map;
  }, [data.meds, lang]);
  const meds = medRanking(current.episodes, medNames).slice(0, 4);

  if (data.episodes.length === 0) {
    return (
      <div class="view insights">
        <header class="view-head">
          <p class="eyebrow">{t('insights.eyebrow')}</p>
          <h1 class="page-title">{t('insights.title')}</h1>
          <p class="page-sub">{t('insights.subtitle')}</p>
        </header>
        <section class="card insight-card">
          <span class="insight-top">
            <IconSparkles size={14} />
            {t('insights.summary')}
          </span>
          <h2 class="insight-text">{t('insights.insightFirst')}</h2>
        </section>
        <div class="empty-inline" style="margin-top:16px">
          <strong>{t('insights.noData')}</strong>
          <p>{t('insights.noDataBody')}</p>
          <button class="text-btn" type="button" onClick={onLog}>
            {t('today.log')}
          </button>
        </div>
        <p class="footnote">{t('insights.footnote')}</p>
      </div>
    );
  }

  const diff = current.attackDays - previous.attackDays;
  let headline: string;
  if (previous.episodeCount === 0 && current.episodeCount > 0) {
    headline = t('insights.insightBaseline');
  } else if (current.attackDays === 0 && previous.attackDays === 0) {
    headline = t('insights.insightQuiet');
  } else if (diff === 0) {
    headline = t('insights.insightSame');
  } else if (diff < 0) {
    headline = t(pluralKey('insights.insightLess', Math.abs(diff)), { n: Math.abs(diff) });
  } else {
    headline = t(pluralKey('insights.insightMore', diff), { n: diff });
  }

  const maxTrigger = triggers[0]?.count ?? 1;
  const maxSymptom = symptoms[0]?.count ?? 1;

  return (
    <div class="view insights">
      <header class="view-head">
        <p class="eyebrow">{t('insights.eyebrow')}</p>
        <h1 class="page-title">{t('insights.title')}</h1>
        <p class="page-sub">{t('insights.subtitle')}</p>
      </header>

      <div class="period-bar">
        <div class="segmented" role="group" aria-label={t('insights.title')}>
          {([30, 90, 365] as Period[]).map((value) => (
            <button
              key={value}
              type="button"
              aria-pressed={period === value}
              onClick={() => setPeriod(value)}
            >
              {t(PERIOD_KEYS[value])}
            </button>
          ))}
        </div>
      </div>

      <section class="card insight-card">
        <span class="insight-top">
          <IconSparkles size={14} />
          {t('insights.summary')}
        </span>
        <h2 class="insight-text">{headline}</h2>
        <p class="insight-sub">
          {t(PERIOD_KEYS[period])} · {formatMonthDay(from, lang)} — {formatMonthDay(to, lang)}
        </p>
      </section>

      <div class="metric-grid">
        <div class="metric-card">
          <span class="metric-label">{t('insights.attackDays')}</span>
          <span class="metric-value">
            {current.attackDays}
            <small>{t(current.attackDays === 1 ? 'common.day' : 'common.days')}</small>
          </span>
          <span class="metric-foot">
            {Math.round(current.attackShare * 100)}% · {t('insights.attackShare')}
          </span>
        </div>
        <div class="metric-card">
          <span class="metric-label">{t('insights.avgSeverity')}</span>
          <span class="metric-value">{current.avgSeverity ?? '—'}</span>
          <span class="metric-foot">
            {current.avgDurationMin !== null
              ? `${t('insights.avgDuration')} ${formatDuration(current.avgDurationMin, lang)}`
              : t('common.unknown')}
          </span>
        </div>
        <div class="metric-card">
          <span class="metric-label">{t('insights.medDays')}</span>
          <span class="metric-value">
            {current.medDays}
            <small>{t(current.medDays === 1 ? 'common.day' : 'common.days')}</small>
          </span>
          <span class="metric-foot">{t('insights.medDaysNote')}</span>
        </div>
        <div class="metric-card">
          <span class="metric-label">{t('insights.streak')}</span>
          <span class="metric-value">
            {current.streak ?? '—'}
            <small>{current.streak !== null ? t(current.streak === 1 ? 'common.day' : 'common.days') : ''}</small>
          </span>
          <span class="metric-foot">{t('insights.streakNote')}</span>
        </div>
      </div>

      {current.episodeCount === 0 ? (
        <div class="empty-inline" style="margin-top:20px">
          <strong>{t('insights.noData')}</strong>
          <p>{t('insights.noDataBody')}</p>
          <button class="text-btn" type="button" onClick={onLog}>
            {t('today.log')}
          </button>
        </div>
      ) : (
        <>
          <section class="card chart-card" style="margin-top:20px" aria-labelledby="trend-title">
            <div class="chart-head">
              <h2 class="chart-title" id="trend-title">
                {period === 30 ? t('insights.severityTrend') : t('insights.trend')}
              </h2>
              {period !== 30 && (
                <span class="chart-note">
                  {t(period === 90 ? 'insights.bucketWeek' : 'insights.bucketMonth')}
                </span>
              )}
            </div>
            <TrendChart
              buckets={buckets}
              mode={period === 30 ? 'severity' : 'days'}
              ariaLabel={`${period === 30 ? t('insights.severityTrend') : t('insights.trend')} · ${t(PERIOD_KEYS[period])}`}
              formatTick={(key) => formatMonthDay(key, lang)}
            />
          </section>

          <section class="card chart-card" style="margin-top:12px" aria-labelledby="triggers-title">
            <div class="chart-head">
              <h2 class="chart-title" id="triggers-title">
                {t('insights.triggers')}
              </h2>
              <span class="chart-note">{t('insights.triggerNote')}</span>
            </div>
            {triggers.length === 0 ? (
              <p class="rank-empty">{t('insights.noDataBody')}</p>
            ) : (
              <div class="rank-list">
                {triggers.map((trigger) => (
                  <div class="rank-row" key={trigger.id}>
                    <div class="rank-top">
                      <span class="rank-name">{trigger.name}</span>
                      <span class="rank-value">
                        {t(pluralKey('insights.triggerShare', trigger.count), { n: trigger.count })}
                      </span>
                    </div>
                    <div class="rank-track">
                      <div
                        class="rank-fill"
                        style={`width:${Math.max(4, (trigger.count / maxTrigger) * 100)}%`}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          <section class="card chart-card" style="margin-top:12px" aria-labelledby="symptoms-title">
            <div class="chart-head">
              <h2 class="chart-title" id="symptoms-title">
                {t('insights.symptoms')}
              </h2>
            </div>
            {symptoms.length === 0 ? (
              <p class="rank-empty">{t('insights.noDataBody')}</p>
            ) : (
              <div class="rank-list">
                {symptoms.map((symptom) => (
                  <div class="rank-row" key={symptom.id}>
                    <div class="rank-top">
                      <span class="rank-name">{symptom.name}</span>
                      <span class="rank-value">
                        {t(pluralKey('insights.symptomShare', symptom.count), { n: symptom.count })}
                      </span>
                    </div>
                    <div class="rank-track">
                      <div
                        class="rank-fill warm"
                        style={`width:${Math.max(4, (symptom.count / maxSymptom) * 100)}%`}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          <section class="card chart-card" style="margin-top:12px" aria-labelledby="meds-title">
            <div class="chart-head">
              <h2 class="chart-title" id="meds-title">
                {t('insights.meds')}
              </h2>
            </div>
            {meds.length === 0 ? (
              <p class="rank-empty">{t('insights.noDataBody')}</p>
            ) : (
              <div class="med-list">
                {meds.map((med) => (
                  <div class="med-row" key={med.id}>
                    <span class="med-icon" aria-hidden="true">
                      <IconPill size={17} />
                    </span>
                    <div class="med-main">
                      <div class="med-name">{med.name}</div>
                      <div class="med-sub">
                        {med.relief !== null
                          ? t('insights.reliefAvg', {
                              v:
                                med.relief < 0.75
                                  ? t('capture.relief.none')
                                  : med.relief < 1.5
                                    ? t('capture.relief.some')
                                    : t('capture.relief.good'),
                            })
                          : t('insights.meds')}
                      </div>
                    </div>
                    {med.relief !== null && (
                      <span class="relief-dots" aria-hidden="true">
                        {[0, 1, 2].map((index) => (
                          <span
                            key={index}
                            class={`relief-dot${index < Math.round((med.relief as number) / 2 * 3) ? ' on' : ''}`}
                          />
                        ))}
                      </span>
                    )}
                    <span class="rank-value">{t('insights.medsTimes', { n: med.count })}</span>
                  </div>
                ))}
              </div>
            )}
          </section>
        </>
      )}

      <p class="footnote">{t('insights.footnote')}</p>
    </div>
  );
}
