import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { FactCarousel } from '@/components/relast/fact-carousel';
import { Mascot } from '@/components/relast/mascot';
import { TodayCarbon } from '@/components/relast/today-carbon';
import { Palette, Radius, Shadow } from '@/constants/palette';
import { useApp } from '@/state/app-context';

const FOOTPRINT_URL = 'https://www.footprintcalculator.org/home/en';

const greeting = () => {
  const h = new Date().getHours();
  return h < 12 ? 'Good morning' : h < 18 ? 'Good afternoon' : 'Good evening';
};

export default function HomeScreen() {
  const { user, history } = useApp();
  const [weekAgo] = useState(() => Date.now() - 7 * 24 * 3600 * 1000);
  const thisWeek = history.filter((h) => new Date(h.createdAt).getTime() >= weekAgo).length;

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.topRow}>
          <Text style={styles.brand}>Relast</Text>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Profile"
            onPress={() => router.navigate('/profile')}
            style={styles.avatar}>
            <Text style={styles.avatarText}>{(user?.name ?? 'R').charAt(0).toUpperCase()}</Text>
          </Pressable>
        </View>

        <Text style={styles.hello}>
          {greeting()}, {user?.name ?? 'there'}
        </Text>
        <Text style={styles.sub}>Make it last. Do it fast.</Text>

        <FactCarousel />

        <TodayCarbon />

        <Pressable
          accessibilityRole="link"
          accessibilityLabel="Calculate your ECO-Footprint on footprintcalculator.org"
          onPress={() => WebBrowser.openBrowserAsync(FOOTPRINT_URL)}
          style={({ pressed }) => [styles.footprint, pressed && { opacity: 0.7 }]}>
          <Ionicons name="calculator-outline" size={20} color={Palette.forest} />
          <Text style={styles.footprintText}>Calculate your footprint</Text>
          <Ionicons name="open-outline" size={16} color={Palette.muted} />
        </Pressable>

        <View style={styles.impact}>
          <View style={styles.impactIcon}>
            <Ionicons name="leaf" size={24} color={Palette.forestDark} />
          </View>
          <View>
            <Text style={styles.impactLabel}>Your impact this week</Text>
            <Text style={styles.impactValue}>
              {thisWeek} {thisWeek === 1 ? 'action' : 'actions'} completed
            </Text>
          </View>
        </View>

        <View style={styles.games}>
          <Ionicons name="game-controller-outline" size={20} color={Palette.muted} />
          <Text style={styles.gamesText}>Sustainability games coming soon</Text>
          <Mascot size={48} />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Palette.cream },
  scroll: { padding: 20, gap: 14 },
  topRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  brand: { fontSize: 60, fontWeight: '900', color: Palette.forestDark, letterSpacing: -0.5 },
  avatar: { width: 42, height: 42, borderRadius: 21, backgroundColor: Palette.forest, alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontWeight: '800', color: Palette.tea, fontSize: 16 },
  hello: { fontSize: 30, fontWeight: '800', color: Palette.forestDark, marginTop: 6, letterSpacing: -0.6 },
  sub: { fontSize: 16, color: Palette.muted, marginBottom: 4 },
  impact: { flexDirection: 'row', gap: 14, alignItems: 'center', backgroundColor: Palette.forest, borderRadius: Radius.card, padding: 18, ...Shadow.card },
  impactIcon: { width: 46, height: 46, borderRadius: 23, backgroundColor: Palette.moss, alignItems: 'center', justifyContent: 'center' },
  impactLabel: { fontSize: 13, color: Palette.olive, fontWeight: '600' },
  impactValue: { fontSize: 18, fontWeight: '800', color: Palette.beige },
  games: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: Palette.sand, borderRadius: Radius.card, paddingHorizontal: 18, paddingVertical: 10 },
  gamesText: { flex: 1, fontSize: 14, fontWeight: '600', color: Palette.muted },
  footprint: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: Radius.pill,
    borderWidth: 1.5,
    borderColor: Palette.mintDeep,
    backgroundColor: Palette.card,
    height: 52,
    ...Shadow.card,
  },
  footprintText: { color: Palette.forest, fontWeight: '700', fontSize: 15 },
});
