import { describe, expect, it } from 'vitest';
import {
  addDays,
  dayKey,
  dayKeyOf,
  diffDays,
  endAfterMinutes,
  formatDuration,
  formatElapsed,
  fromDateTimeInput,
  minutesBetween,
  parseDayKey,
  toDateTimeInput,
} from '../src/lib/dates';

describe('dates', () => {
  it('uses local calendar days for keys', () => {
    expect(dayKey(new Date(2026, 10, 19, 23, 59))).toBe('2026-11-19');
    expect(dayKeyOf(new Date(2026, 0, 2, 0, 1).toISOString())).toBe('2026-01-02');
  });

  it('adds days across month and DST boundaries', () => {
    expect(dayKey(addDays(parseDayKey('2026-03-28'), 3))).toBe('2026-03-31');
    expect(dayKey(addDays(parseDayKey('2026-12-31'), 1))).toBe('2027-01-01');
    expect(diffDays('2026-11-01', '2026-11-19')).toBe(18);
    expect(diffDays('2026-11-19', '2026-11-01')).toBe(-18);
  });

  it('round-trips datetime-local values', () => {
    const iso = new Date(2026, 10, 19, 8, 5).toISOString();
    const input = toDateTimeInput(iso);
    expect(input).toBe('2026-11-19T08:05');
    expect(fromDateTimeInput(input)).toBe(iso);
    expect(fromDateTimeInput('not-a-date')).toBeNull();
  });

  it('computes durations and presets', () => {
    const start = new Date(2026, 10, 19, 9, 0).toISOString();
    const end = endAfterMinutes(start, 90);
    expect(minutesBetween(start, end)).toBe(90);
    expect(formatDuration(90, 'zh')).toBe('1 小时 30 分');
    expect(formatDuration(90, 'en')).toBe('1h 30m');
    expect(formatDuration(45, 'ja')).toBe('45 分');
    expect(formatElapsed(3_723_000)).toBe('1:02:03');
    expect(formatElapsed(62_000)).toBe('01:02');
  });
});
