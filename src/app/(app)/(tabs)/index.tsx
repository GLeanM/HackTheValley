import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Mascot } from '@/components/relast/mascot';
import { Palette } from '@/constants/palette';
import { CATEGORY_META, type Category } from '@/services/ai';
import { useApp } from '@/state/app-context';

const FEATURES: { category: Category; title: string; sub: string }[] = [
  { category: 'lifecycle', title: 'Product lifespan', sub: 'Repair, donate or responsibly dispose' },
  { category: 'sorter', title: 'Waste sorter', sub: 'Find the right bin' },
  { category: 'food', title: 'Food rescue', sub: 'Turn leftovers into meals' },
];

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
        <Text style={styles.sub}>Make it last. Waste less.</Text>

        {FEATURES.map((f) => (
          <Pressable
            key={f.category}
            accessibilityRole="button"
            accessibilityLabel={`${f.title}. ${f.sub}`}
            onPress={() => router.push({ pathname: '/assistant', params: { category: f.category } })}
            style={({ pressed }) => [styles.card, pressed && { transform: [{ scale: 0.98 }] }]}>
            <View style={styles.cardIcon}>
              <Ionicons name={CATEGORY_META[f.category].icon} size={34} color={Palette.forest} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.cardTitle}>{f.title}</Text>
              <Text style={styles.cardSub}>{f.sub}</Text>
            </View>
            <Ionicons name="arrow-forward" size={20} color={Palette.forestDark} />
          </Pressable>
        ))}

        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Ask Relast anything"
          onPress={() => router.push('/assistant')}
          style={styles.ask}>
          <Ionicons name="chatbubble-ellipses-outline" size={20} color={Palette.forest} />
          <Text style={styles.askText}>Not sure? Ask Relast anything</Text>
        </Pressable>

        <View style={styles.impact}>
          <Ionicons name="leaf" size={26} color={Palette.leaf} />
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
  brand: { fontSize: 34, fontWeight: '900', color: Palette.forestDark, letterSpacing: -0.5 },
  avatar: { width: 38, height: 38, borderRadius: 19, backgroundColor: Palette.mintDeep, alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontWeight: '800', color: Palette.forestDark, fontSize: 16 },
  hello: { fontSize: 28, fontWeight: '800', color: Palette.forestDark, marginTop: 6 },
  sub: { fontSize: 16, color: Palette.muted, marginBottom: 4 },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    backgroundColor: Palette.mint,
    borderRadius: 28,
    borderWidth: 1,
    borderColor: Palette.mintDeep,
    padding: 16,
    minHeight: 104,
  },
  cardIcon: { width: 68, height: 68, borderRadius: 34, backgroundColor: Palette.mintDeep, alignItems: 'center', justifyContent: 'center' },
  cardTitle: { fontSize: 20, fontWeight: '800', color: Palette.ink },
  cardSub: { fontSize: 14, color: Palette.muted, marginTop: 2 },
  ask: { flexDirection: 'row', gap: 8, alignItems: 'center', justifyContent: 'center', borderRadius: 999, borderWidth: 1.5, borderColor: Palette.mintDeep, backgroundColor: Palette.card, height: 50 },
  askText: { color: Palette.forest, fontWeight: '700', fontSize: 15 },
  impact: { flexDirection: 'row', gap: 12, alignItems: 'center', backgroundColor: Palette.mint, borderRadius: 24, padding: 16 },
  impactLabel: { fontSize: 13, color: Palette.muted },
  impactValue: { fontSize: 18, fontWeight: '700', color: Palette.ink },
  games: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: Palette.sand, borderRadius: 24, paddingHorizontal: 16, paddingVertical: 8 },
  gamesText: { flex: 1, fontSize: 14, fontWeight: '600', color: Palette.muted },
});
