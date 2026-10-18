import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Palette, Shadow } from '@/constants/palette';

interface Props {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  onPress: () => void;
  size?: number;
  filled?: boolean;
  alignIconToCenter?: boolean;
}

export function CircleButton({ icon, label, onPress, size = 60, filled, alignIconToCenter = false }: Props) {
  return (
    <View style={[styles.wrap, alignIconToCenter && styles.iconCentered]}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={label}
        onPress={onPress}
        style={({ pressed }) => [
          styles.btn,
          { width: size, height: size, borderRadius: size / 2 },
          filled && { backgroundColor: Palette.forest, borderColor: Palette.forest },
          pressed && { transform: [{ scale: 0.94 }] },
        ]}>
        <Ionicons name={icon} size={size * 0.44} color={filled ? Palette.white : Palette.forest} />
      </Pressable>
      <Text style={styles.label}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: 'center', gap: 6 },
  iconCentered: { transform: [{ translateY: 10 }] },
  btn: {
    backgroundColor: Palette.card,
    borderWidth: 1.5,
    borderColor: Palette.mintDeep,
    ...Shadow.card,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: { fontSize: 12, fontWeight: '600', color: Palette.muted },
});
