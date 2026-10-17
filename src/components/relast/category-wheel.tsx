import { Ionicons } from '@expo/vector-icons';
import { useEffect, useRef } from 'react';
import { Animated, PanResponder, Pressable, StyleSheet, Text, View } from 'react-native';

import { Palette } from '@/constants/palette';
import { CATEGORIES, CATEGORY_META, type Category } from '@/services/ai';

const COUNT = CATEGORIES.length;
const ITEM_SIZE = 124;
const SIDE_SCALE = 0.55;
const ORBIT_RADIUS = 104;
const OVAL_MARGIN = 24;
const SWIPE_DISTANCE = 32;
const SWIPE_VELOCITY = 0.35;
type ChangeSource = 'swipe' | 'tap';
export const WHEEL_HEIGHT = ITEM_SIZE + 8;

interface Props {
  value: Category;
  onChange: (category: Category, source: ChangeSource) => void;
  onSelectedPress: () => void;
  dimmed?: boolean;
}

interface WheelItemProps {
  category: Category;
  selected: boolean;
  offset: number;
  onPress: () => void;
}

function WheelItem({ category, selected, offset, onPress }: WheelItemProps) {
  const meta = CATEGORY_META[category];
  const translateX = useRef(new Animated.Value(offset * ORBIT_RADIUS)).current;
  const scale = useRef(new Animated.Value(selected ? 1 : SIDE_SCALE)).current;
  const opacity = useRef(new Animated.Value(selected ? 1 : 0.45)).current;

  useEffect(() => {
    const animation = Animated.parallel([
      Animated.spring(translateX, {
        toValue: offset * ORBIT_RADIUS,
        stiffness: 140,
        damping: 18,
        mass: 0.8,
        useNativeDriver: true,
      }),
      Animated.spring(scale, {
        toValue: selected ? 1 : SIDE_SCALE,
        stiffness: 140,
        damping: 18,
        mass: 0.8,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: selected ? 1 : 0.45,
        duration: 180,
        useNativeDriver: true,
      }),
    ]);

    animation.start();
    return () => animation.stop();
  }, [offset, opacity, scale, selected, translateX]);

  return (
    <Animated.View
      pointerEvents="box-none"
      style={[
        styles.item,
        { zIndex: selected ? 2 : 1 },
        { opacity, transform: [{ translateX }, { scale }] },
      ]}>
      <Pressable
        onPress={onPress}
        accessibilityRole="button"
        accessibilityLabel={`${meta.label} category${selected ? ', selected' : ''}`}
        accessibilityState={{ selected }}
        style={({ pressed }) => [styles.disc, selected && styles.discSelected, pressed && styles.discPressed]}>
        <Ionicons name={meta.icon} size={36} color={selected ? Palette.white : Palette.forest} />
        <Text style={[styles.itemLabel, selected && styles.itemLabelSelected]}>{meta.label}</Text>
      </Pressable>
    </Animated.View>
  );
}

/** Circular category selector using the built-in responder system for phone-safe swipes. */
export function CategoryWheel({ value, onChange, onSelectedPress, dimmed }: Props) {
  const selectedIndex = Math.max(0, CATEGORIES.indexOf(value));
  const selectedIndexRef = useRef(selectedIndex);
  const onChangeRef = useRef(onChange);

  selectedIndexRef.current = selectedIndex;
  onChangeRef.current = onChange;

  const panResponderRef = useRef<ReturnType<typeof PanResponder.create> | null>(null);
  if (!panResponderRef.current) {
    panResponderRef.current = PanResponder.create({
      onMoveShouldSetPanResponder: (_event, gesture) =>
        Math.abs(gesture.dx) > 12 && Math.abs(gesture.dx) > Math.abs(gesture.dy) * 1.2,
      onPanResponderRelease: (_event, gesture) => {
        if (Math.abs(gesture.dx) < SWIPE_DISTANCE && Math.abs(gesture.vx) < SWIPE_VELOCITY) return;

        const step = gesture.dx < 0 ? 1 : -1;
        const nextIndex = (selectedIndexRef.current + step + COUNT) % COUNT;
        selectedIndexRef.current = nextIndex;
        onChangeRef.current(CATEGORIES[nextIndex], 'swipe');
      },
    });
  }

  return (
    <View
      {...panResponderRef.current.panHandlers}
      style={[styles.wrap, dimmed && styles.dimmed]}
      accessibilityLabel="Category selector. Swipe left or right to change category.">
      <View pointerEvents="none" style={styles.ring} />
      {CATEGORIES.map((category, index) => {
        const offset = ((index - selectedIndex + COUNT + Math.floor(COUNT / 2)) % COUNT) - Math.floor(COUNT / 2);
        const selected = category === value;

        return (
          <WheelItem
            key={category}
            category={category}
            selected={selected}
            offset={offset}
            onPress={() => (selected ? onSelectedPress() : onChange(category, 'tap'))}
          />
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { height: WHEEL_HEIGHT, flex: 1, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  dimmed: { opacity: 0.8 },
  ring: {
    position: 'absolute',
    width: ORBIT_RADIUS * 2 + ITEM_SIZE * SIDE_SCALE + OVAL_MARGIN,
    height: ITEM_SIZE + 8,
    borderRadius: 999,
    zIndex: 0,
    backgroundColor: Palette.mint,
    opacity: 0.6,
  },
  item: { position: 'absolute', width: ITEM_SIZE, height: ITEM_SIZE },
  disc: {
    flex: 1,
    borderRadius: ITEM_SIZE / 2,
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
  discPressed: { transform: [{ scale: 0.96 }] },
  itemLabel: { fontSize: 15, fontWeight: '700', color: Palette.forest },
  itemLabelSelected: { color: Palette.white },
});