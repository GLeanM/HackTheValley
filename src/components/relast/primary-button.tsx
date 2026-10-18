import { ActivityIndicator, Pressable, StyleSheet, Text, type StyleProp, type ViewStyle } from 'react-native';

import { Palette, Shadow } from '@/constants/palette';

interface Props {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  loading?: boolean;
  variant?: 'solid' | 'soft';
  style?: StyleProp<ViewStyle>;
}

export function PrimaryButton({ label, onPress, disabled, loading, variant = 'solid', style }: Props) {
  const off = disabled || loading;
  const soft = variant === 'soft';
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: !!off, busy: !!loading }}
      onPress={off ? undefined : onPress}
      style={({ pressed }) => [
        styles.base,
        soft ? styles.soft : styles.solid,
        disabled && styles.disabled,
        pressed && !off && { opacity: 0.85, transform: [{ scale: 0.98 }] },
        style,
      ]}>
      {loading ? (
        <ActivityIndicator color={soft ? Palette.forest : Palette.white} />
      ) : (
        <Text style={[styles.label, soft && { color: Palette.forest }]}>{label}</Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: { height: 56, borderRadius: 999, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 24 },
  solid: { backgroundColor: Palette.forest, ...Shadow.card, shadowColor: Palette.forest, shadowOpacity: 0.28 },
  soft: { backgroundColor: Palette.mint, borderWidth: 1.5, borderColor: Palette.mintDeep },
  disabled: { backgroundColor: Palette.disabled, shadowOpacity: 0 },
  label: { color: Palette.white, fontSize: 17, fontWeight: '700', letterSpacing: 0.2 },
});
