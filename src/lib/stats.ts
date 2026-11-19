import { addDays, dayKey, dayKeyOf, diffDays, minutesBetween, parseDayKey } from './dates';
import type { Episode } from './types';

export interface RangeStats {
  totalDays: number;
  episodes: Episode[];
  episodeCount: number;
  attackDays: number;
  painFreeDays: number;
  attackShare: number;
  avgSeverity: number | null;
  medDays: number;
  avgDurationMin: number | null;
  streak: number | null;
}

export interface Bucket {
  startKey: string;
  endKey: string;
  attackDays: number;
  episodes: number;
  avgSeverity: number | null;
}

export interface NamedCount {
  id: string;
  name: string;
  count: number;
}

export interface MedStat extends NamedCount {
  relief: number | null;
}

export function episodesInRange(episodes: Episode[], fromKey: string, toKey: string): Episode[] {
  return episodes
    .filter((episode) => {
      const key = dayKeyOf(episode.start);
      return key >= fromKey && key <= toKey;
    })
    .sort((a, b) => b.start.localeCompare(a.start));
}

function mean(values: number[]): number | null {
  if (values.length === 0) return null;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

export function round1(value: number | null): number | null {
  return value === null ? null : Math.round(value * 10) / 10;
}

export function computeStreak(episodes: Episode[], todayKey: string): number | null {
  if (episodes.length === 0) return null;
  const attackDays = new Set(episodes.map((episode) => dayKeyOf(episode.start)));
  if (attackDays.has(todayKey)) return 0;
  let cursor = parseDayKey(todayKey);
  let streak = 1;
  // Guard against pathological clocks / future dates.
  for (let i = 0; i < 3650; i++) {
    cursor = addDays(cursor, -1);
    const key = dayKey(cursor);
    if (attackDays.has(key)) return streak;
    streak += 1;
  }
  return streak;
}

export function computeStats(
  episodes: Episode[],
  fromKey: string,
  toKey: string,
  todayKey: string = dayKey(),
): RangeStats {
  const rangeEpisodes = episodesInRange(episodes, fromKey, toKey);
  const attackDaySet = new Set(rangeEpisodes.map((episode) => dayKeyOf(episode.start)));
  const medDaySet = new Set(
    rangeEpisodes.filter((episode) => episode.meds.length > 0).map((episode) => dayKeyOf(episode.start)),
  );
  const durations = rangeEpisodes
    .filter((episode) => episode.end)
    .map((episode) => minutesBetween(episode.start, episode.end as string))
    .filter((minutes) => minutes >= 0);
  const totalDays = Math.max(0, diffDays(fromKey, toKey) + 1);
  const attackDays = attackDaySet.size;
  const avgSeverity = mean(rangeEpisodes.map((episode) => episode.severity));

  return {
    totalDays,
    episodes: rangeEpisodes,
    episodeCount: rangeEpisodes.length,
    attackDays,
    painFreeDays: Math.max(0, totalDays - attackDays),
    attackShare: totalDays === 0 ? 0 : attackDays / totalDays,
    avgSeverity: round1(avgSeverity),
    medDays: medDaySet.size,
    avgDurationMin: durations.length ? Math.round(mean(durations) ?? 0) : null,
    streak: computeStreak(episodes, todayKey),
  };
}

/** Split a range into evenly sized buckets, used by the trend chart. */
export function buildBuckets(
  episodes: Episode[],
  fromKey: string,
  toKey: string,
  bucketCount: number,
): Bucket[] {
  const totalDays = diffDays(fromKey, toKey) + 1;
  if (totalDays <= 0) return [];
  const size = Math.max(1, Math.ceil(totalDays / bucketCount));
  const buckets: Bucket[] = [];
  let start = parseDayKey(fromKey);
  for (let i = 0; i < bucketCount * 2; i++) {
    const startKey = dayKey(start);
    if (startKey > toKey) break;
    const end = addDays(start, size - 1);
    const endKey = dayKey(end) > toKey ? toKey : dayKey(end);
    const inBucket = episodesInRange(episodes, startKey, endKey);
    const days = new Set(inBucket.map((episode) => dayKeyOf(episode.start)));
    buckets.push({
      startKey,
      endKey,
      attackDays: days.size,
      episodes: inBucket.length,
      avgSeverity: round1(mean(inBucket.map((episode) => episode.severity))),
    });
    start = addDays(end, 1);
  }
  return buckets;
}

export function triggerRanking(
  episodes: Episode[],
  names: Map<string, string>,
): NamedCount[] {
  const counts = new Map<string, number>();
  for (const episode of episodes) {
    for (const id of new Set(episode.triggerIds)) {
      counts.set(id, (counts.get(id) ?? 0) + 1);
    }
  }
  return [...counts.entries()]
    .map(([id, count]) => ({ id, count, name: names.get(id) ?? id }))
    .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));
}

export function symptomRanking(
  episodes: Episode[],
  names: Map<string, string>,
): NamedCount[] {
  const counts = new Map<string, number>();
  for (const episode of episodes) {
    for (const id of new Set(episode.symptomIds)) {
      counts.set(id, (counts.get(id) ?? 0) + 1);
    }
  }
  return [...counts.entries()]
    .map(([id, count]) => ({ id, count, name: names.get(id) ?? id }))
    .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));
}

export function medRanking(episodes: Episode[], names?: Map<string, string>): MedStat[] {
  const stats = new Map<string, { name: string; count: number; relief: number[] }>();
  for (const episode of episodes) {
    const seen = new Set<string>();
    for (const med of episode.meds) {
      const entry = stats.get(med.medId) ?? { name: med.name, count: 0, relief: [] };
      if (!seen.has(med.medId)) {
        entry.count += 1;
        seen.add(med.medId);
      }
      entry.name = med.name;
      if (typeof med.relief === 'number') entry.relief.push(med.relief);
      stats.set(med.medId, entry);
    }
  }
  return [...stats.entries()]
    .map(([id, entry]) => ({
      id,
      name: names?.get(id) ?? entry.name,
      count: entry.count,
      relief: round1(mean(entry.relief)),
    }))
    .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));
}

export function severityBucket(severity: number): 'mild' | 'moderate' | 'severe' | 'extreme' {
  if (severity <= 3) return 'mild';
  if (severity <= 6) return 'moderate';
  if (severity <= 8) return 'severe';
  return 'extreme';
}
