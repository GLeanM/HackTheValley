import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { router, useLocalSearchParams } from 'expo-router';
import type { ReactNode } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Mascot } from '@/components/relast/mascot';
import { PrimaryButton } from '@/components/relast/primary-button';
import { Palette, Radius, Shadow } from '@/constants/palette';
import { CATEGORY_META, ON_DEVICE_MODEL, type BinType } from '@/services/ai';
import { useApp } from '@/state/app-context';

const BIN_BADGE: Record<BinType, { label: string; icon: keyof typeof Ionicons.glyphMap; bg: string }> = {
  recycling: { label: 'Recycle', icon: 'refresh-circle-outline', bg: Palette.moss },
  garbage: { label: 'Landfill', icon: 'trash-outline', bg: Palette.steel },
  compost: { label: 'Compost', icon: 'leaf-outline', bg: Palette.mint },
  hazardous: { label: 'Hazardous', icon: 'warning-outline', bg: Palette.dangerBg },
  ewaste: { label: 'E-waste', icon: 'hardware-chip-outline', bg: Palette.olive },
  unsure: { label: 'Check local rules', icon: 'help-circle-outline', bg: Palette.sand },
};

export default function AnswerScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { history } = useApp();
  const entry = history.find((h) => h.id === id);

  const back = () => (router.canGoBack() ? router.back() : router.replace('/'));

  if (!entry) {
    return (
      <SafeAreaView style={[styles.safe, { alignItems: 'center', justifyContent: 'center', gap: 16, padding: 24 }]}>
        <Text style={styles.h1}>We couldn’t find that answer</Text>
        <PrimaryButton label="Go back" onPress={back} />
      </SafeAreaView>
    );
  }

  const r = entry.response;
  const meta = CATEGORY_META[r.category];

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <Pressable onPress={back} accessibilityRole="button" accessibilityLabel="Back" style={styles.backBtn}>
          <Ionicons name="chevron-back" size={24} color={Palette.forest} />
        </Pressable>
        <Text style={styles.headerTitle}>{{ lifecycle: 'Give it a second life', sorter: 'Sort it right', food: 'Rescue your leftovers' }[r.category]}</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        {entry.imageUri ? (
          <Image source={{ uri: entry.imageUri }} style={styles.image} contentFit="cover" accessibilityLabel="Your photo" />
        ) : (
          <View style={[styles.image, styles.imageFallback]}>
            <Ionicons name={meta.icon} size={56} color={Palette.forest} />
          </View>
        )}

        <View style={styles.titleRow}>
          <Text style={[styles.h1, { flex: 1 }]}>{r.itemName}</Text>
          {r.bin && (
            <View style={[styles.binBadge, { backgroundColor: BIN_BADGE[r.bin].bg }]} accessibilityLabel={`Goes in: ${BIN_BADGE[r.bin].label}`}>
              <Ionicons name={BIN_BADGE[r.bin].icon} size={16} color={Palette.forestDark} />
              <Text style={styles.binText}>{BIN_BADGE[r.bin].label}</Text>
            </View>
          )}
        </View>
        <View style={styles.chips}>
          <Text style={[styles.chip, { backgroundColor: Palette.mintDeep }]}>{meta.label}</Text>
          <Text style={[styles.chip, { backgroundColor: Palette.sand }]}>Confidence: {r.confidence.level}</Text>
        </View>
        {!!r.question && <Text style={styles.question}>“{r.question}”</Text>}

        {r.source === 'mock' && <Text style={styles.sample}>Sample answer — the live AI isn’t connected yet.</Text>}
        {r.classifier && (
          <Text style={styles.muted}>
            Bin picked by our {r.classifier.model === ON_DEVICE_MODEL ? 'on-device ' : ''}trash classifier: {r.classifier.label} ({Math.round(r.classifier.score * 100)}% confident)
          </Text>
        )}

        <Card>
          <Text style={styles.body}>{r.answer}</Text>
        </Card>

        {r.reuse && (
          <Card tint={r.reuse.possible}>
            <View style={styles.row}>
              <Ionicons name="repeat-outline" size={26} color={Palette.forest} />
              <View style={{ flex: 1 }}>
                <Text style={styles.label}>Reusable?</Text>
                <Text style={styles.big}>{r.reuse.possible ? 'Yes — give it another life' : 'Not really reusable'}</Text>
              </View>
            </View>
            {r.reuse.possible &&
              r.reuse.ideas.map((t) => (
                <View key={t} style={styles.row}>
                  <Ionicons name="leaf-outline" size={18} color={Palette.leaf} style={{ marginTop: 3 }} />
                  <Text style={[styles.body, { flex: 1 }]}>{t}</Text>
                </View>
              ))}
          </Card>
        )}

        {r.lifecycle && (
          <Card tint>
            <View style={styles.row}>
              <Ionicons name="time-outline" size={26} color={Palette.forest} />
              <View style={{ flex: 1 }}>
                <Text style={styles.big}>Typical lifespan: {r.lifecycle.estimate}</Text>
                <Text style={styles.muted}>Varies by use and condition.</Text>
              </View>
            </View>
          </Card>
        )}

        {r.recommendations.length > 0 && (
          <Section title="What you can do" items={r.recommendations} />
        )}

        {!!r.why && (
          <Card>
            <Text style={styles.label}>Why this helps</Text>
            <Text style={styles.body}>{r.why}</Text>
          </Card>
        )}

        {r.lifecycle && r.lifecycle.repairs.length > 0 && <Section title="Repair" icon="construct-outline" items={r.lifecycle.repairs} />}
        {r.lifecycle && r.lifecycle.donation.length > 0 && <Section title="Donate" icon="heart-outline" items={r.lifecycle.donation} />}

        {r.recipes?.map((rec) => (
          <Card key={rec.title}>
            <Text style={styles.big}>{rec.title}</Text>
            {!!rec.time && <Text style={styles.muted}>{rec.time}</Text>}
            <Text style={[styles.label, { marginTop: 10 }]}>Ingredients</Text>
            {rec.ingredients.map((i) => (
              <Text key={i} style={styles.body}>• {i}</Text>
            ))}
            <Text style={[styles.label, { marginTop: 10 }]}>Steps</Text>
            {rec.steps.map((s, n) => (
              <Text key={s} style={styles.body}>{n + 1}. {s}</Text>
            ))}
          </Card>
        ))}

        {r.alternatives.length > 0 && <Section title="Alternatives" items={r.alternatives} />}

        <View style={styles.confidence}>
          <Ionicons name="information-circle-outline" size={18} color={Palette.muted} />
          <Text style={styles.confText}>
            <Text style={{ fontWeight: '700' }}>Confidence: {r.confidence.level}. </Text>
            {r.confidence.note}
          </Text>
        </View>

        <View style={styles.mascotRow}>
          <Mascot size={64} />
          <View style={styles.bubble}>
            <Text style={styles.bubbleText}>{r.category === 'food' ? 'Let’s save that food!' : 'Every little bit counts!'}</Text>
          </View>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <PrimaryButton label="Ask another question" onPress={() => router.replace('/assistant')} />
        <PrimaryButton label="Back to home" variant="soft" onPress={() => router.dismissTo('/')} />
      </View>
    </SafeAreaView>
  );
}

function Card({ children, tint }: { children: ReactNode; tint?: boolean }) {
  return <View style={[styles.card, tint && { backgroundColor: Palette.mint, borderColor: Palette.mintDeep }]}>{children}</View>;
}

function Section({ title, items, icon = 'leaf-outline' }: { title: string; items: string[]; icon?: keyof typeof Ionicons.glyphMap }) {
  return (
    <Card>
 <View style={styles.row}>
        <Ionicons name={icon} size={20} color={Palette.forest} />
        <Text style={styles.h2}>{title}</Text>
      </View>
      {items.map((t) => (
        <View key={t} style={styles.row}>
          <Ionicons name="leaf-outline" size={18} color={Palette.leaf} style={{ marginTop: 3 }} />
          <Text style={[styles.body, { flex: 1 }]}>{t}</Text>
        </View>
      ))}
    </Card>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Palette.cream },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 12, paddingVertical: 6 },
  backBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: Palette.card, ...Shadow.card, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 17, fontWeight: '700', color: Palette.forestDark },
  scroll: { padding: 20, gap: 14 },
  image: { width: '100%', height: 220, borderRadius: Radius.card },
  imageFallback: { backgroundColor: Palette.mint, alignItems: 'center', justifyContent: 'center' },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  binBadge: { flexDirection: 'row', alignItems: 'center', gap: 5, borderRadius: 999, paddingHorizontal: 12, paddingVertical: 7 },
  binText: { fontSize: 14, fontWeight: '700', color: Palette.forestDark },
  chips: { flexDirection: 'row', gap: 8 },
  chip: { fontSize: 13, fontWeight: '600', color: Palette.forestDark, borderRadius: 999, paddingHorizontal: 12, paddingVertical: 5, overflow: 'hidden' },
  mascotRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  bubble: { backgroundColor: Palette.tea, borderRadius: 18, paddingHorizontal: 14, paddingVertical: 10 },
  bubbleText: { fontWeight: '600', color: Palette.forestDark, fontSize: 14 },
  h1: { fontSize: 30, fontWeight: '800', color: Palette.forestDark, letterSpacing: -0.6 },
  h2: { fontSize: 18, fontWeight: '700', color: Palette.forestDark, marginBottom: 4 },
  question: { fontSize: 15, color: Palette.muted, fontStyle: 'italic' },
  sample: { fontSize: 13, color: Palette.grey, fontWeight: '600' },
  card: { backgroundColor: Palette.card, borderRadius: Radius.card, borderWidth: 1, borderColor: Palette.border, padding: 18, gap: 6, ...Shadow.card },
  body: { fontSize: 16, lineHeight: 23, color: Palette.ink },
  label: { fontSize: 12, fontWeight: '700', color: Palette.muted, textTransform: 'uppercase', letterSpacing: 0.6 },
  big: { fontSize: 20, fontWeight: '800', color: Palette.forestDark },
  muted: { fontSize: 14, color: Palette.muted },
  row: { flexDirection: 'row', gap: 10, alignItems: 'flex-start' },
  confidence: { flexDirection: 'row', gap: 8, padding: 4 },
  confText: { flex: 1, fontSize: 13, color: Palette.muted, lineHeight: 18 },
  footer: { padding: 20, paddingTop: 8, gap: 10 },
});
