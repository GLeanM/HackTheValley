import { classifyMode, co2For } from './factors';
import type { Fix, TravelMode, TripDraft } from './types';

const MAX_ACCURACY_M = 50; // ignore fixes worse than this
const MAX_GAP_MS = 5 * 60 * 1000; // a longer silence ends the segment
const MIN_SEGMENT_M = 100; // drop GPS jitter and tiny segments
const SMOOTHING = 3; // median of the last N speeds
const SWITCH_AFTER = 2; // consecutive fixes in a new mode before switching

const toRad = (d: number) => (d * Math.PI) / 180;

export function haversineM(a: Fix, b: Fix): number {
  const R = 6371000;
  const dLat = toRad(b.lat - a.lat);
  const dLon = toRad(b.lon - a.lon);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

const median = (xs: number[]) => {
  const s = [...xs].sort((a, b) => a - b);
  const m = Math.floor(s.length / 2);
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
};

interface Segment {
  mode: TravelMode;
  startedAt: number;
  endedAt: number;
  distanceM: number;
}

/**
 * Turns a stream of location fixes into completed single-mode segments.
 * Pure and synchronous so it can be reasoned about without a device.
 */
export function createTripRecorder() {
  let last: Fix | null = null;
  let speeds: number[] = [];
  let current: Segment | null = null;
  let pendingMode: TravelMode | null = null;
  let pendingCount = 0;

  const close = (): TripDraft[] => {
    const seg = current;
    current = null;
    pendingMode = null;
    pendingCount = 0;
    if (!seg || seg.distanceM < MIN_SEGMENT_M) return [];
    return [
      {
        mode: seg.mode,
        startedAt: new Date(seg.startedAt).toISOString(),
        endedAt: new Date(seg.endedAt).toISOString(),
        distanceM: Math.round(seg.distanceM),
        co2G: Math.round(co2For(seg.mode, seg.distanceM)),
      },
    ];
  };

  const reset = () => {
    last = null;
    speeds = [];
  };

  return {
    push(fix: Fix): TripDraft[] {
      if (fix.accuracy != null && fix.accuracy > MAX_ACCURACY_M) return [];
      const prev = last;
      last = fix;
      if (!prev) return [];

      const dt = fix.timestamp - prev.timestamp;
      if (dt <= 0) return [];
      if (dt > MAX_GAP_MS) {
        speeds = [];
        return close();
      }

      const dist = haversineM(prev, fix);
      const speed = fix.speed != null && fix.speed > 0 ? fix.speed : dist / (dt / 1000);
      speeds = [...speeds, speed].slice(-SMOOTHING);
      const mode = classifyMode(median(speeds));

      // Standing still: end whatever we were doing.
      if (!mode) return close();

      if (!current) {
        current = { mode, startedAt: prev.timestamp, endedAt: fix.timestamp, distanceM: dist };
        return [];
      }

      if (mode === current.mode) {
        pendingMode = null;
        pendingCount = 0;
        current.endedAt = fix.timestamp;
        current.distanceM += dist;
        return [];
      }

      // A different mode: only switch once it has held for a couple of fixes.
      pendingCount = pendingMode === mode ? pendingCount + 1 : 1;
      pendingMode = mode;
      if (pendingCount < SWITCH_AFTER) {
        current.endedAt = fix.timestamp;
        current.distanceM += dist;
        return [];
      }
      const done = close();
      current = { mode, startedAt: prev.timestamp, endedAt: fix.timestamp, distanceM: dist };
      return done;
    },

    /** End the current segment (tracking stopped or app backgrounded). */
    flush(): TripDraft[] {
      reset();
      return close();
    },
  };
}

export type TripRecorder = ReturnType<typeof createTripRecorder>;
