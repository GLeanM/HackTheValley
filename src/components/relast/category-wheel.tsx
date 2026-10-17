import { Ionicons } from '@expo/vector-icons';
import { useEffect } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
    useAnimatedReaction,
    useAnimatedStyle,
    useSharedValue,
    withSpring,
    type SharedValue,
} from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';

import { Palette } from '@/constants/palette';
import { CATEGORIES, CATEGORY_META, type Category } from '@/services/ai';

const N = CATEGORIES.length;
const ITEM = 124; // diameter of the front item
const RADIUS = 104; // horizontal orbit radius
const DRAG_PER_ITEM = 110; // px of swipe per category step
export const WHEEL_HEIGHT = ITEM + 8;

interface Props {
  value: Category;
  onChange: (c: Category) => void;
  onSelectedPress: () => void;
  /** Dim the wheel when the AI is auto-detecting the category. */
  dimmed?: boolean;
}

const mod = (n: number, m: number) => ((n % m) + m) % m;

function WheelItem({ index, pos, selected, onPress }: { index: number; pos: SharedValue<number>; selected: boolean; onPress: () => void }) {
  const meta = CATEGORY_META[CATEGORIES[index]];
  const style = useAnimatedStyle(() => {
    // Signed circular distance from the current position, in [-N/2, N/2).
    const d = mod(index - pos.get() + N / 2, N) - N / 2;
    const angle = (d * 2 * Math.PI) / N;
    const depth = (Math.cos(angle) + 1) / 2; // 1 = front, 0 = back
    const scale = 0.55 + 0.45 * depth;
    return {
      transform: [{ translateX: Math.sin(angle) * RADIUS }, { scale }],
      opacity: 0.45 + 0.55 * depth,
      zIndex: Math.round(depth * 100),
    };
  });

  return (
    <Animated.View style={[styles.item, style]}>
      <Pressable
        onPress={onPress}
        accessibilityRole="button"
        accessibilityLabel={`${meta.label} category${selected ? ', selected' : ''}`}
        style={[styles.disc, selected && styles.discSelected]}>
        <Ionicons name={meta.icon} size={36} color={selected ? Palette.white : Palette.forest} />
        <Text style={[styles.itemLabel, selected && { color: Palette.white }]}>{meta.label}</Text>
      </Pressable>
    </Animated.View>
  );
}

/** Rotating circular carousel: swipe left/right or tap a neighbour. Loops endlessly. */
export function CategoryWheel({ value, onChange, onSelectedPress, dimmed }: Props) {
  const pos = useSharedValue(CATEGORIES.indexOf(value));
  const start = useSharedValue(0);

  // Keep the wheel in sync if the parent changes the value.
  useEffect(() => {
    const target = CATEGORIES.indexOf(value);
    const cur = pos.get();
    if (mod(Math.round(cur), N) !== target) {
      // shortest way round
      const diff = mod(target - cur + N / 2, N) - N / 2;
      pos.set(withSpring(Math.round(cur + diff), { damping: 16, stiffness: 140 }));
    }
  }, [value, pos]);

  useAnimatedReaction(
    () => mod(Math.round(pos.get()), N),
    (idx, prev) => {
      if (prev !== null && idx !== prev) scheduleOnRN(onChange, CATEGORIES[idx]);
    },
  );

  const pan = Gesture.Pan()
    .activeOffsetX([-10, 10])
    .onBegin(() => {
      start.set(pos.get());
    })
    .onUpdate((e) => {
      pos.set(start.get() - e.translationX / DRAG_PER_ITEM);
    })
    .onEnd((e) => {
      const projected = pos.get() - (e.velocityX / DRAG_PER_ITEM) * 0.15;
      pos.set(withSpring(Math.round(projected), { damping: 16, stiffness: 140 }));
    });

  const goTo = (index: number) => {
    const cur = pos.get();
    const diff = mod(index - cur + N / 2, N) - N / 2;
    pos.set(withSpring(Math.round(cur + diff), { damping: 16, stiffness: 140 }));
  };

  return (
    <GestureDetector gesture={pan}>
      <View style={[styles.wrap, dimmed && { opacity: 0.8 }]} accessibilityLabel="Category selector. Swipe to change.">
        <View style={styles.ring} pointerEvents="none" />
        {CATEGORIES.map((c, i) => (
          <WheelItem
            key={c}
            index={i}
            pos={pos}
            selected={c === value}
            onPress={() => (c === value ? onSelectedPress() : goTo(i))}
          />
        ))}
      </View>
    </GestureDetector>
  );
}

const styles = StyleSheet.create({
  wrap: { height: WHEEL_HEIGHT, flex: 1, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  ring: {
    position: 'absolute',
    width: RADIUS * 2 + 40,
    height: ITEM + 8,
    borderRadius: 999,
    backgroundColor: Palette.mint,
    opacity: 0.6,
  },
  item: { position: 'absolute', width: ITEM, height: ITEM },
  disc: {
    flex: 1,
    borderRadius: ITEM / 2,
    backgroundColor: Palette.card,
    borderWidth: 3,
    borderColor: Palette.mintDeep,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  discSelected: {
    backgroundColor: Palette.forest,
    borderColor: Palette.leaf,
    shadowColor: Palette.forestDark,
    shadowOpacity: 0.25,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 6,
  },
  itemLabel: { fontSize: 15, fontWeight: '700', color: Palette.forest },
});
