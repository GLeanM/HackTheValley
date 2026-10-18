import { Ionicons } from '@expo/vector-icons';
import * as WebBrowser from 'expo-web-browser';
import { useEffect, useRef, useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
} from 'react-native';

import { Palette, Radius } from '@/constants/palette';

const FACTS = [
  {
    title: 'Food waste accounts for 8-10% of global GHG emissions',
    body: 'This staggering amount of greenhouse gas emissions highlights the need for better food management. This includes the need for systems that prevent waste at every level, from farms right through to households.',
  },
  {
    title: 'Electronic waste is the fastest-growing global waste stream',
    body: 'E-Waste volumes hit 62 million tonnes globally in 2022. This is projected to reach 80 million tonnes by 2030! With rapidly advancing technology, ensuring proper recycling and disposal of old devices is critical to prevent environmental contamination.',
  },
  {
    title: 'Plastic can take 500+ years to decompose',
    body: 'Everyday plastics persist in the environment, slowly breaking down and contributing to pollution. This longevity is why reducing plastic waste is crucial.',
  },
  {
    title: 'Plastics pollute the deepest parts of the oceans',
    body: 'Researchers have found plastic waste even in remote, deep-sea trenches, highlighting the far-reaching impact of our waste on marine ecosystems.',
  },
  {
    title: 'Soil nutrient levels are in decline',
    body: 'Intensive farming practices are depleting the quality of soils. Consequently, the food we eat today is less nutritious than the food earlier generations ate. Regenerative farming practices are helping to restore soils, though currently at a relative low scale.',
  },
  {
    title: 'One cotton T-shirt can consume up to 2,700 litres of water',
    body: 'This water-intensive process is a major drain on available resources. Consider higher quality, sustainable fashion, sources where possible to limit your contribution to this water demand.',
  },
] as const;

const FACTS_SOURCE = {
  name: 'Greener Insights',
  url: 'https://www.greenerinsights.com/blog/fascinating-facts-about-sustainability',
} as const;

const INTERVAL_MS = 10_000;
const SETTLE_MS = 150;
// Space between neighbouring cards while swiping. The track overhangs by half
// of it on each side so the visible card still lines up with the screen column.
const PAGE_GAP = 12;
const N = FACTS.length;

// The last and first facts are cloned onto either end so swiping past an end
// loops around: once a scroll settles on a clone we jump to its real twin.
const PAGES = [FACTS[N - 1], ...FACTS, FACTS[0]];

export function FactCarousel() {
  const scroller = useRef<ScrollView>(null);
  const settle = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [width, setWidth] = useState(0);
  const [page, setPage] = useState(1);
  const [positioned, setPositioned] = useState(false);
  const index = (page - 1 + N) % N;

  useEffect(() => {
    if (!width) return;
    scroller.current?.scrollTo({ x: width, animated: false });
    setPage(1);
    setPositioned(true);
  }, [width]);

  useEffect(
    () => () => {
      if (settle.current) clearTimeout(settle.current);
    },
    [],
  );

  // Restarts whenever the visible page changes, so a manual swipe resets the timer.
  useEffect(() => {
    if (!width || !positioned) return;
    const t = setInterval(() => {
      scroller.current?.scrollTo({ x: (page + 1) * width, animated: true });
    }, INTERVAL_MS);
    return () => clearInterval(t);
  }, [page, width, positioned]);

  const onScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    if (!width) return;
    const p = Math.max(0, Math.min(N + 1, Math.round(e.nativeEvent.contentOffset.x / width)));
    setPage(p);
    if (settle.current) clearTimeout(settle.current);
    settle.current = setTimeout(() => {
      const twin = p === 0 ? N : p === N + 1 ? 1 : null;
      if (twin === null) return;
      scroller.current?.scrollTo({ x: twin * width, animated: false });
      setPage(twin);
    }, SETTLE_MS);
  };

  return (
    <View style={styles.wrap}>
      <View
        onLayout={(e) => setWidth(e.nativeEvent.layout.width)}
        style={[styles.track, !positioned && styles.hidden]}>
        <ScrollView
          ref={scroller}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onScroll={onScroll}
          scrollEventThrottle={32}>
          {PAGES.map((f, p) => (
            <View
              key={`${p}-${f.title}`}
              accessibilityElementsHidden={p === 0 || p === N + 1}
              importantForAccessibility={p === 0 || p === N + 1 ? 'no-hide-descendants' : 'auto'}
              accessible
              accessibilityLabel={`${f.title}. ${f.body}`}
              style={[styles.page, { width }]}>
              <View style={styles.card}>
                <View style={styles.titleRow}>
                  <View style={styles.icon}>
                    <Ionicons name="leaf" size={20} color={Palette.forest} />
                  </View>
                  <Text style={styles.title}>{f.title}</Text>
                </View>
                <Text style={styles.body}>{f.body}</Text>
              </View>
            </View>
          ))}
        </ScrollView>
      </View>

      <View style={styles.footer}>
        <View style={styles.dots} importantForAccessibility="no-hide-descendants" accessibilityElementsHidden>
          {FACTS.map((f, i) => (
            <View key={f.title} style={[styles.dot, i === index && styles.dotActive]} />
          ))}
        </View>
        <Pressable
          accessibilityRole="link"
          accessibilityLabel={`Facts source: ${FACTS_SOURCE.name}`}
          onPress={() => WebBrowser.openBrowserAsync(FACTS_SOURCE.url)}
          hitSlop={8}>
          <Text style={styles.credit}>Facts: {FACTS_SOURCE.name}</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 10 },
  hidden: { opacity: 0 },
  track: { marginHorizontal: -PAGE_GAP / 2 },
  page: { alignItems: 'stretch', paddingHorizontal: PAGE_GAP / 2 },
  card: {
    flex: 1,
    backgroundColor: Palette.tea,
    borderRadius: Radius.card,
    borderWidth: 1.5,
    borderColor: Palette.mintDeep,
    padding: 18,
    gap: 10,
    minHeight: 210,
  },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  icon: { width: 40, height: 40, borderRadius: 20, backgroundColor: Palette.moss, alignItems: 'center', justifyContent: 'center' },
  title: { flex: 1, fontSize: 18, fontWeight: '800', color: Palette.ink },
  body: { fontSize: 14, lineHeight: 20, color: Palette.muted },
  footer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 4 },
  dots: { flexDirection: 'row', gap: 6 },
  dot: { width: 7, height: 7, borderRadius: 4, backgroundColor: Palette.olive },
  dotActive: { width: 18, backgroundColor: Palette.forest },
  credit: { fontSize: 12, color: Palette.muted, textDecorationLine: 'underline' },
});
