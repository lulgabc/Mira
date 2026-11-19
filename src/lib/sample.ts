import { catalogName } from '../i18n';
import { defaultCatalogs } from './catalog';
import { addDays, startOfDay } from './dates';
import type { AppData, Episode, EpisodeMed, Lang } from './types';

const OFFSETS = [3, 8, 15, 24, 29, 34, 38, 43, 49, 53, 58, 63, 67, 72, 77, 82, 88, 94, 101, 108, 115];
const HOURS = [7, 9, 14, 16, 18, 21, 6, 11, 15, 19];
const DURATIONS = [45, 90, 120, 180, 240, 360, 480, 600];
const TRIGGER_SETS = [
  ['trg-sleep', 'trg-stress'],
  ['trg-weather'],
  ['trg-screens', 'trg-sleep'],
  ['trg-stress'],
  ['trg-hormones', 'trg-sleep'],
  ['trg-meal', 'trg-hydration'],
  ['trg-light', 'trg-screens'],
  ['trg-weather', 'trg-stress'],
  ['trg-alcohol'],
  ['trg-smell'],
];
const SYMPTOM_SETS = [
  ['sym-photophobia', 'sym-nausea'],
  ['sym-phonophobia', 'sym-fatigue'],
  ['sym-nausea', 'sym-neck'],
  ['sym-aura', 'sym-photophobia'],
  ['sym-dizziness'],
  ['sym-nausea', 'sym-vomiting'],
  ['sym-photophobia', 'sym-phonophobia', 'sym-fatigue'],
];
const DOSES: Record<string, string> = {
  'med-ibuprofen': '400 mg',
  'med-acetaminophen': '500 mg',
  'med-sumatriptan': '50 mg',
  'med-naproxen': '500 mg',
  'med-aspirin': '500 mg',
  'med-metoclopramide': '10 mg',
};

export function sampleData(lang: Lang): AppData {
  const catalogs = defaultCatalogs();
  const today = startOfDay(new Date());

  const episodes: Episode[] = OFFSETS.map((daysAgo, index) => {
    const day = addDays(today, -daysAgo);
    day.setHours(HOURS[index % HOURS.length] ?? 15, index % 2 === 0 ? 10 : 40, 0, 0);
    const start = day.toISOString();
    const duration = DURATIONS[index % DURATIONS.length] ?? 120;
    const end = new Date(day.getTime() + duration * 60_000).toISOString();
    const severity = [5, 6, 7, 4, 8, 6, 5, 7, 9, 6, 8, 5][index % 12] ?? 6;

    const meds: EpisodeMed[] = [];
    if (index % 4 !== 2) {
      const med = catalogs.meds[index % 3 === 0 ? 2 : index % 2 === 0 ? 0 : 1];
      if (med) {
        meds.push({
          medId: med.id,
          name: catalogName('med', med, lang),
          dose: DOSES[med.id],
          relief: (index % 3) as 0 | 1 | 2,
        });
      }
      if (index % 5 === 0) {
        const antiemetic = catalogs.meds.find((item) => item.id === 'med-metoclopramide');
        if (antiemetic) {
          meds.push({ medId: antiemetic.id, name: catalogName('med', antiemetic, lang), dose: DOSES[antiemetic.id] });
        }
      }
    }

    return {
      id: `sample_${index + 1}`,
      start,
      end,
      severity,
      symptomIds: SYMPTOM_SETS[index % SYMPTOM_SETS.length] ?? [],
      triggerIds: TRIGGER_SETS[index % TRIGGER_SETS.length] ?? [],
      meds,
      createdAt: start,
      updatedAt: end,
    };
  });

  return {
    version: 1,
    episodes: episodes.sort((a, b) => b.start.localeCompare(a.start)),
    ...catalogs,
  };
}
