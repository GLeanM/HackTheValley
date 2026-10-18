import { AVOIDED_FACTOR } from './factors';
import type { DaySummary, Trip, TripSummary } from './types';

const dayKey = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

/** Totals across all trips plus a per-day breakdown of the last `days` days (oldest first). */
export function summarizeTrips(trips: Trip[], days = 7, now = new Date()): TripSummary {
  const buckets: DaySummary[] = [];
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i);
    buckets.push({ date: dayKey(d), walkKm: 0, otherKm: 0, co2G: 0 });
  }
  const byDate = new Map(buckets.map((b) => [b.date, b]));

  let walkKm = 0;
  let otherKm = 0;
  let emittedG = 0;
  for (const t of trips) {
    const km = t.distanceM / 1000;
    const bucket = byDate.get(dayKey(new Date(t.startedAt)));
    if (t.mode === 'walk') {
      walkKm += km;
      if (bucket) bucket.walkKm += km;
    } else {
      otherKm += km;
      emittedG += t.co2G;
      if (bucket) {
        bucket.otherKm += km;
        bucket.co2G += t.co2G;
      }
    }
  }

  return { savedG: walkKm * AVOIDED_FACTOR, emittedG, walkKm, otherKm, days: buckets };
}

/** "820 g" below a kilo, "1.4 kg" above. */
export function formatGrams(g: number): string {
  if (g < 1000) return `${Math.round(g)} g`;
  return `${(g / 1000).toFixed(g < 10000 ? 1 : 0)} kg`;
}
