import { Ionicons } from '@expo/vector-icons';
import { Link, router } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Mascot } from '@/components/relast/mascot';
import { Palette } from '@/constants/palette';

export default function WelcomeScreen() {
  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.top}>
        <Text style={styles.brand}>Relast</Text>
        <Text style={styles.tag}>Your sustainable living helper</Text>
      </View>

      <View style={styles.hero}>
        <Mascot size={170} />
      </View>

      <View style={styles.bottom}>
        <Text style={styles.headline}>Make it last.{'\n'}Waste less.</Text>
        <Text style={styles.sub}>Small choices. Real impact.</Text>

        <Pressable
          accessibilityRole="button"
          onPress={() => router.push('/signup')}
          style={({ pressed }) => [styles.cta, pressed && { opacity: 0.85 }]}>
          <Text style={styles.ctaText}>Get Started</Text>
          <Ionicons name="arrow-forward" size={20} color={Palette.white} />
        </Pressable>
        <Link href="/login" style={styles.link}>
          I already have an account
        </Link>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Palette.cream, paddingHorizontal: 24 },
  top: { alignItems: 'center', marginTop: 24 },
  brand: { fontSize: 52, fontWeight: '900', color: Palette.forestDark, letterSpacing: -1 },
  tag: { fontSize: 16, color: Palette.forest, marginTop: 2 },
  hero: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  bottom: { alignItems: 'center', gap: 8, paddingBottom: 16 },
  headline: { fontSize: 32, fontWeight: '800', color: Palette.forestDark, textAlign: 'center', lineHeight: 38 },
  sub: { fontSize: 17, color: Palette.muted, marginBottom: 16 },
  cta: {
    alignSelf: 'stretch',
    height: 56,
    borderRadius: 999,
    backgroundColor: Palette.forest,
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ctaText: { color: Palette.white, fontSize: 17, fontWeight: '700' },
  link: { marginTop: 10, color: Palette.forestDark, fontWeight: '600', fontSize: 15, padding: 8 },
});
