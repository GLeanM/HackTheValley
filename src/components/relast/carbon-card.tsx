import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { useState } from 'react';
import { StyleSheet, Switch, Text, View } from 'react-native';

import { Palette, Radius, Shadow } from '@/constants/palette';
import { formatGrams, summarizeTrips } from '@/services/carbon';
import { useApp } from '@/state/app-context';

const BAR_HEIGHT = 72;
const DAY_LABELS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

/** Profile card: CO₂ saved by walking vs emitted travelling, with a 7-day chart and tracking switch. */
export function CarbonCard() {
  const { trips, tracking, setTracking } = useApp();
  const [error, setError] = useState<string | null>(null);
  const summary = summarizeTrips(trips);
  const maxKm = Math.max(1, ...summary.days.map((d) => d.walkKm + d.otherKm));

  const onToggle = async (on: boolean) => {
    setError(null);
    if (!on) return setTracking(false);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === 'granted') setTracking(true);
      else setError('Location permission is needed to estimate your trips. You can allow it in Settings.');
    } catch {
      setError('Location isn’t available on this device.');
    }
  };

  return (
    <View style={styles.card}>
      <View style={styles.head}>
        <View style={styles.icon}>
          <Ionicons name="leaf" size={20} color={Palette.forest} />
        </View>
        <Text style={styles.title}>Travel impact</Text>
      </View>

      {trips.length ? (
        <>
          <Text style={styles.big}>
            {formatGrams(summary.savedG)} <Text style={styles.bigUnit}>CO₂ saved by walking</Text>
          </Text>
          <Text style={styles.sub}>
            {formatGrams(summary.emittedG)} emitted traveling · {summary.walkKm.toFixed(1)} km walked
          </Text>

          <View style={styles.chart} accessibilityLabel="Distance per day over the last 7 days">
            {summary.days.map((d) => {
              const walkH = (d.walkKm / maxKm) * BAR_HEIGHT;
              const otherH = (d.otherKm / maxKm) * BAR_HEIGHT;
              const day = new Date(`${d.date}T12:00:00`).getDay();
              return (
                <View key={d.date} style={styles.col}>
                  <View style={styles.barTrack}>
                    <View style={[styles.bar, { height: otherH, backgroundColor: Palette.clay }]} />
                    <View style={[styles.bar, { height: walkH, backgroundColor: Palette.leaf }]} />
                  </View>
                  <Text style={styles.dayLabel}>{DAY_LABELS[day]}</Text>
                </View>
              );
            })}
          </View>
          <View style={styles.legend}>
            <Legend color={Palette.leaf} label="Walked" />
            <Legend color={Palette.clay} label="Vehicle / transit" />
          </View>
        </>
      ) : (
        <Text style={styles.sub}>Turn on tracking and go for a walk to see your impact.</Text>
      )}

      <View style={styles.toggleRow}>
        <Text style={styles.toggleLabel}>Track my trips</Text>
        <Switch
          value={tracking}
          onValueChange={onToggle}
          trackColor={{ true: Palette.leaf, false: Palette.border }}
          thumbColor={Palette.white}
        />
      </View>
      {!!error && <Text style={styles.error}>{error}</Text>}
      <Text style={styles.caveat}>
        Estimated from your speed while the app is open — expected values, not exact measurements.
        Cycling and running may count as vehicle trips.
      </Text>
    </View>
  );
}

function Legend({ color, label }: { color: string; label: string }) {
  return (
    <View style={styles.legendItem}>
      <View style={[styles.dot, { backgroundColor: color }]} />
      <Text style={styles.legendText}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Palette.card,
    borderRadius: Radius.card,
    borderWidth: 1.5,
    borderColor: Palette.border,
    padding: 16,
    gap: 8,
    ...Shadow.card,
  },
  head: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  icon: {
    width: 36,
    height: 36,
    borderRadius: Radius.pill,
    backgroundColor: Palette.mint,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: { fontSize: 18, fontWeight: '800', color: Palette.forestDark },
  big: { fontSize: 28, fontWeight: '800', color: Palette.forestDark },
  bigUnit: { fontSize: 15, fontWeight: '600', color: Palette.forest },
  sub: { fontSize: 14, color: Palette.muted },
  chart: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 },
  col: { flex: 1, alignItems: 'center', gap: 4 },
  barTrack: {
    height: BAR_HEIGHT,
    width: 18,
    borderRadius: 6,
    backgroundColor: Palette.sand,
    justifyContent: 'flex-end',
    overflow: 'hidden',
  },
  bar: { width: '100%' },
  dayLabel: { fontSize: 12, fontWeight: '600', color: Palette.muted },
  legend: { flexDirection: 'row', gap: 16, justifyContent: 'center' },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  dot: { width: 10, height: 10, borderRadius: Radius.pill },
  legendText: { fontSize: 12, color: Palette.muted },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  toggleLabel: { fontSize: 16, fontWeight: '700', color: Palette.ink },
  error: {
    color: Palette.danger,
    backgroundColor: Palette.dangerBg,
    borderRadius: 12,
    padding: 10,
    fontSize: 13,
  },
  caveat: { fontSize: 12, color: Palette.muted },
});
