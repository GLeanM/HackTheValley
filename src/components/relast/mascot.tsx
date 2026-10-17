import { StyleSheet, View } from 'react-native';

import { Palette } from '@/constants/palette';

/** Temporary placeholder mascot: a friendly leaf built from Views. */
export function Mascot({ size = 80 }: { size?: number }) {
  const s = size / 80;
  return (
    <View style={{ width: size, height: size }} accessibilityLabel="Relast mascot" accessible>
      <View
        style={[
          styles.leaf,
          {
            width: 60 * s,
            height: 60 * s,
            left: 10 * s,
            top: 8 * s,
            borderTopLeftRadius: 40 * s,
            borderBottomRightRadius: 40 * s,
            borderTopRightRadius: 8 * s,
            borderBottomLeftRadius: 8 * s,
          },
        ]}>
        <View style={[styles.eye, { left: 14 * s, top: 24 * s, width: 6 * s, height: 6 * s }]} />
        <View style={[styles.eye, { left: 36 * s, top: 24 * s, width: 6 * s, height: 6 * s }]} />
        <View
          style={{
            position: 'absolute',
            left: 22 * s,
            top: 32 * s,
            width: 14 * s,
            height: 8 * s,
            borderBottomWidth: 2 * s,
            borderLeftWidth: 2 * s,
            borderRightWidth: 2 * s,
            borderColor: Palette.forestDark,
            borderBottomLeftRadius: 8 * s,
            borderBottomRightRadius: 8 * s,
          }}
        />
      </View>
      <View style={[styles.stem, { left: 38 * s, top: 66 * s, height: 12 * s }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  leaf: { position: 'absolute', backgroundColor: Palette.leaf, transform: [{ rotate: '-8deg' }] },
  eye: { position: 'absolute', borderRadius: 10, backgroundColor: Palette.forestDark },
  stem: { position: 'absolute', width: 4, backgroundColor: Palette.forest, borderRadius: 2 },
});
