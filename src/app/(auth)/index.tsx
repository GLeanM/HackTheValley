import { Ionicons } from '@expo/vector-icons';
import { Link, router } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Mascot } from '@/components/relast/mascot';
import { Palette } from '@/constants/palette';

export default function WelcomeScreen() {
  return (
    <View style={styles.safe}>
      <SafeAreaView edges={['top']} style={styles.top}>
        <Text style={styles.brand}>Relast</Text>
        <Text style={styles.tag}>Your sustainable living helper</Text>
      </SafeAreaView>

      <View style={styles.hero}>
        <View style={[styles.halo, styles.haloOuter]} />
        <View style={[styles.halo, styles.haloMid]} />
        <View style={[styles.halo, styles.haloInner]} />
        <Mascot size={170} />
      </View>

      <SafeAreaView edges={['bottom']} style={styles.bottom}>
        <Text style={styles.headline}>Make it last.{'\n'}Waste less.</Text>
        <Text style={styles.sub}>Small choices. Real impact.</Text>

        <Pressable
          accessibilityRole="button"
          onPress={() => router.push('/signup')}
          style={({ pressed }) => [styles.cta, pressed && { opacity: 0.85 }]}>
          <Text style={styles.ctaText}>Get Started</Text>
          <Ionicons name="arrow-forward" size={20} color={Palette.forestDark} />
        </Pressable>
        <Link href="/login" style={styles.link}>
          I already have an account
        </Link>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Palette.cream },
  top: { alignItems: 'center', marginTop: 16 },
  brand: { fontSize: 48, fontWeight: '900', color: Palette.forestDark, letterSpacing: -1.5 },
  tag: { fontSize: 16, color: Palette.charcoal, marginTop: 2 },
  hero: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  halo: { position: 'absolute', borderRadius: 999 },
  haloOuter: { width: 320, height: 320, backgroundColor: Palette.tea, opacity: 0.55 },
  haloMid: { width: 240, height: 240, backgroundColor: Palette.mintDeep, opacity: 0.6 },
  haloInner: { width: 170, height: 170, backgroundColor: Palette.moss, opacity: 0.45 },
  bottom: {
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 28,
    paddingTop: 32,
    paddingBottom: 16,
    backgroundColor: Palette.forestDark,
    borderTopLeftRadius: 40,
    borderTopRightRadius: 40,
  },
  headline: { fontSize: 32, fontWeight: '800', color: Palette.beige, textAlign: 'center', lineHeight: 38, letterSpacing: -0.5 },
  sub: { fontSize: 17, color: Palette.olive, marginBottom: 16 },
  cta: {
    alignSelf: 'stretch',
    height: 58,
    borderRadius: 999,
    backgroundColor: Palette.moss,
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ctaText: { color: Palette.forestDark, fontSize: 17, fontWeight: '800' },
  link: { marginTop: 10, color: Palette.tea, fontWeight: '600', fontSize: 15, padding: 8 },
});
