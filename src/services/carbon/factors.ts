import type { TravelMode } from './types';

/**
 * Expected-value emission factors (g CO₂e per passenger-km). These are averages,
 * not measurements: we only know how fast someone moved, not what they were in.
 */
export const EMISSION_FACTORS = {
  walk: 0,
  vehicle: 120, // car / bus blend
  rail: 41,
  flight: 255,
} as const satisfies Record<TravelMode, number>;

/** Walking is counted as replacing a car/bus trip of the same distance. */
export const AVOIDED_FACTOR = EMISSION_FACTORS.vehicle;

/** Upper speed bound (m/s, exclusive) for each mode. Below STATIONARY_MAX we ignore movement. */
export const STATIONARY_MAX = 0.5;
export const SPEED_TIERS: readonly { mode: TravelMode; max: number }[] = [
  { mode: 'walk', max: 2.5 },
  { mode: 'vehicle', max: 33 },
  { mode: 'rail', max: 70 },
  { mode: 'flight', max: Infinity },
];

export const MODE_META = {
  walk: { label: 'Walking', icon: 'walk-outline' },
  vehicle: { label: 'Car / bus', icon: 'car-outline' },
  rail: { label: 'Train', icon: 'train-outline' },
  flight: { label: 'Flight', icon: 'airplane-outline' },
} as const satisfies Record<TravelMode, { label: string; icon: string }>;

export function classifyMode(speedMs: number): TravelMode | null {
  if (!Number.isFinite(speedMs) || speedMs < STATIONARY_MAX) return null;
  return SPEED_TIERS.find((t) => speedMs < t.max)?.mode ?? 'flight';
}

export const co2For = (mode: TravelMode, distanceM: number) =>
  (distanceM / 1000) * EMISSION_FACTORS[mode];
