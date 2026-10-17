import { ActivityIndicator, Pressable, StyleSheet, Text, type StyleProp, type ViewStyle } from 'react-native';

import { Palette } from '@/constants/palette';

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
  base: { height: 54, borderRadius: 999, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 24 },
  solid: { backgroundColor: Palette.forest },
  soft: { backgroundColor: Palette.mint },
  disabled: { backgroundColor: '#B9C7B5' },
  label: { color: Palette.white, fontSize: 17, fontWeight: '700' },
});
