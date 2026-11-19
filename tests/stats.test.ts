import { describe, expect, it } from 'vitest';
import {
  buildBuckets,
  computeStats,
  computeStreak,
  episodesInRange,
  medRanking,
  severityBucket,
  triggerRanking,
} from '../src/lib/stats';
import type { Episode } from '../src/lib/types';

const at = (year: number, month: number, day: number, hour = 10, minute = 0) =>
  new Date(year, month - 1, day, hour, minute, 0).toISOString();

function episode(partial: Partial<Episode> & Pick<Episode, 'id' | 'start'>): Episode {
  return {
    severity: 5,
    symptomIds: [],
    triggerIds: [],
    meds: [],
    createdAt: partial.start,
    updatedAt: partial.start,
    ...partial,
  };
}

const episodes: Episode[] = [
  episode({
    id: 'a',
    start: at(2026, 11, 14, 9),
    end: at(2026, 11, 14, 11),
    severity: 6,
    triggerIds: ['trg-stress'],
    meds: [{ medId: 'med-ibuprofen', name: 'Ibuprofen', relief: 2 }],
  }),
  episode({
    id: 'b',
    start: at(2026, 11, 16, 15),
    end: at(2026, 11, 16, 16, 30),
    severity: 8,
    triggerIds: ['trg-stress', 'trg-sleep'],
    meds: [{ medId: 'med-ibuprofen', name: 'Ibuprofen', relief: 1 }],
  }),
  episode({
    id: 'c',
    start: at(2026, 11, 4, 20),
    end: at(2026, 11, 4, 21),
    severity: 4,
    triggerIds: ['trg-weather'],
  }),
];

const names = new Map([
  ['trg-stress', 'Stress'],
  ['trg-sleep', 'Poor sleep'],
  ['trg-weather', 'Weather'],
]);

describe('stats', () => {
  it('filters by local day, inclusive', () => {
    expect(episodesInRange(episodes, '2026-11-14', '2026-11-16').map((item) => item.id)).toEqual([
      'b',
      'a',
    ]);
    expect(episodesInRange(episodes, '2026-11-15', '2026-11-16').map((item) => item.id)).toEqual([
      'b',
    ]);
  });

  it('counts attack days, medication days, durations and streak', () => {
    const stats = computeStats(episodes, '2026-11-13', '2026-11-19', '2026-11-19');
    expect(stats.totalDays).toBe(7);
    expect(stats.episodeCount).toBe(2);
    expect(stats.attackDays).toBe(2);
    expect(stats.painFreeDays).toBe(5);
    expect(stats.avgSeverity).toBe(7);
    expect(stats.medDays).toBe(2);
    expect(stats.avgDurationMin).toBe(105);
    expect(stats.streak).toBe(3);
  });

  it('computes streaks from today', () => {
    expect(computeStreak(episodes, '2026-11-19')).toBe(3);
    expect(computeStreak(episodes, '2026-11-16')).toBe(0);
    expect(computeStreak(episodes, '2026-11-17')).toBe(1);
    expect(computeStreak([], '2026-11-19')).toBeNull();
  });

  it('builds a bucket per day for a 30 day range', () => {
    const buckets = buildBuckets(episodes, '2026-11-01', '2026-11-30', 30);
    expect(buckets).toHaveLength(30);
    expect(buckets[0]?.startKey).toBe('2026-11-01');
    expect(buckets[29]?.endKey).toBe('2026-11-30');
    expect(buckets.reduce((sum, bucket) => sum + bucket.episodes, 0)).toBe(3);
    expect(buckets.find((bucket) => bucket.startKey === '2026-11-16')?.attackDays).toBe(1);
  });

  it('ranks triggers and medications', () => {
    const triggers = triggerRanking(episodes, names);
    expect(triggers[0]).toMatchObject({ id: 'trg-stress', count: 2 });
    expect(triggers.map((item) => item.id)).toContain('trg-weather');

    const meds = medRanking(episodes);
    expect(meds).toHaveLength(1);
    expect(meds[0]).toMatchObject({ id: 'med-ibuprofen', count: 2, relief: 1.5 });

    const localized = medRanking(episodes, new Map([['med-ibuprofen', 'Ibuprofen (current)']]));
    expect(localized[0]?.name).toBe('Ibuprofen (current)');
  });

  it('maps severity to four visual bands', () => {
    expect(severityBucket(1)).toBe('mild');
    expect(severityBucket(3)).toBe('mild');
    expect(severityBucket(4)).toBe('moderate');
    expect(severityBucket(6)).toBe('moderate');
    expect(severityBucket(7)).toBe('severe');
    expect(severityBucket(8)).toBe('severe');
    expect(severityBucket(9)).toBe('extreme');
    expect(severityBucket(10)).toBe('extreme');
  });

  it('handles an empty range', () => {
    const stats = computeStats([], '2026-11-01', '2026-11-30', '2026-11-19');
    expect(stats.attackDays).toBe(0);
    expect(stats.avgSeverity).toBeNull();
    expect(stats.painFreeDays).toBe(30);
    expect(stats.streak).toBeNull();
  });
});
