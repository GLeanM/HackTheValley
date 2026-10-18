import * as Location from 'expo-location';
import { useEffect, useRef } from 'react';
import { AppState } from 'react-native';

import { createTripRecorder, type TripDraft } from '@/services/carbon';
import { useApp } from '@/state/app-context';

/**
 * Renders nothing. While the user has trip tracking on, watches foreground location at
 * low power and turns speed into single-mode trips (walk / vehicle / rail / flight).
 * Mounted in the app layout so tracking survives switching tabs; it stops when the app
 * is backgrounded because we only hold "when in use" permission.
 */
export function TripTracker() {
  const { user, tracking, setTracking, addTrip } = useApp();
  const addTripRef = useRef(addTrip);
  addTripRef.current = addTrip;

  const active = tracking && !!user;

  useEffect(() => {
    if (!active) return;
    const recorder = createTripRecorder();
    const save = (done: TripDraft[]) => done.forEach((t) => addTripRef.current(t));
    let sub: Location.LocationSubscription | null = null;
    let cancelled = false;

    (async () => {
      const { status } = await Location.getForegroundPermissionsAsync();
      if (status !== 'granted') {
        if (!cancelled) setTracking(false);
        return;
      }
      const s = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.Balanced, // cell / Wi-Fi + coarse GPS, saves battery
          timeInterval: 15000, // Android only; iOS paces by distance
          distanceInterval: 10,
        },
        ({ coords, timestamp }) =>
          save(
            recorder.push({
              lat: coords.latitude,
              lon: coords.longitude,
              speed: coords.speed,
              accuracy: coords.accuracy,
              timestamp,
            }),
          ),
      );
      if (cancelled) s.remove();
      else sub = s;
    })().catch((err) => console.warn('Trip tracking failed:', err));

    const appState = AppState.addEventListener('change', (state) => {
      if (state === 'background') save(recorder.flush());
    });

    return () => {
      cancelled = true;
      sub?.remove();
      appState.remove();
      save(recorder.flush());
    };
  }, [active, setTracking]);

  return null;
}
