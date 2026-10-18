/** How the user was moving, inferred from speed alone. */
export type TravelMode = 'walk' | 'vehicle' | 'rail' | 'flight';

/** One continuous stretch in a single mode, as stored in the `trips` table. */
export interface Trip {
  id: string;
  startedAt: string;
  endedAt: string;
  mode: TravelMode;
  distanceM: number;
  co2G: number;
}

/** A completed segment before it has been saved (no id yet). */
export type TripDraft = Omit<Trip, 'id'>;

/** A single location reading. `speed` is m/s and may be missing or negative. */
export interface Fix {
  lat: number;
  lon: number;
  speed: number | null;
  accuracy: number | null;
  timestamp: number;
}

export interface DaySummary {
  /** Local date key, YYYY-MM-DD. */
  date: string;
  walkKm: number;
  otherKm: number;
  co2G: number;
}

export interface TripSummary {
  savedG: number;
  emittedG: number;
  walkKm: number;
  otherKm: number;
  days: DaySummary[];
}
