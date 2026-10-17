import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Palette } from '@/constants/palette';

interface Props {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  onPress: () => void;
  size?: number;
  filled?: boolean;
}

export function CircleButton({ icon, label, onPress, size = 60, filled }: Props) {
  return (
    <View style={{ alignItems: 'center', gap: 6 }}>
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
  btn: {
    backgroundColor: Palette.card,
    borderWidth: 2,
    borderColor: Palette.mintDeep,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: { fontSize: 12, fontWeight: '600', color: Palette.muted },
});
