import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Palette, Radius, Shadow } from '@/constants/palette';
import { AVOIDED_FACTOR, formatGrams, summarizeTrips } from '@/services/carbon';
import { useApp } from '@/state/app-context';

/** Home card: today's CO₂ saved by walking, with a walk vs vehicle distance bar. Taps through to Profile. */
export function TodayCarbon() {
  const { trips, tracking } = useApp();
  const today = summarizeTrips(trips).days.at(-1);
  const walkKm = today?.walkKm ?? 0;
  const otherKm = today?.otherKm ?? 0;
  const saved = formatGrams(walkKm * AVOIDED_FACTOR);
  const emitted = formatGrams(today?.co2G ?? 0);
  const hasTrips = walkKm + otherKm > 0;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Today: ${saved} CO₂ saved, ${walkKm.toFixed(1)} km walked, ${otherKm.toFixed(1)} km by vehicle`}
      onPress={() => router.navigate('/profile')}
      style={({ pressed }) => [styles.card, pressed && { opacity: 0.8 }]}>
      <View style={styles.head}>
        <Ionicons name="leaf" size={18} color={Palette.leaf} />
        <Text style={styles.label}>Today</Text>
        <Ionicons name="chevron-forward" size={18} color={Palette.muted} />
      </View>

      <Text style={styles.big}>
        {saved} <Text style={styles.bigUnit}>CO₂ saved by walking</Text>
      </Text>

      <View style={styles.track}>
        {hasTrips && (
          <>
            <View style={{ flex: walkKm, backgroundColor: Palette.leaf }} />
            <View style={{ flex: otherKm, backgroundColor: Palette.clay }} />
          </>
        )}
      </View>

      <Text style={styles.caption}>
        {hasTrips
          ? `${walkKm.toFixed(1)} km walked · ${otherKm.toFixed(1)} km by vehicle · ${emitted} emitted`
          : `No trips yet today${tracking ? '' : ' · turn on tracking in Profile'}`}
      </Text>
    </Pressable>
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
  head: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  label: { flex: 1, fontSize: 13, fontWeight: '700', color: Palette.muted },
  big: { fontSize: 24, fontWeight: '800', color: Palette.forestDark },
  bigUnit: { fontSize: 14, fontWeight: '600', color: Palette.forest },
  track: {
    flexDirection: 'row',
    height: 12,
    borderRadius: Radius.pill,
    backgroundColor: Palette.sand,
    overflow: 'hidden',
  },
  caption: { fontSize: 13, color: Palette.muted },
});
