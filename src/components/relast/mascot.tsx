import React from 'react';
import { Image, StyleSheet, ImageStyle, StyleProp } from 'react-native';

interface MascotProps {
  size?: number;
  style?: StyleProp<ImageStyle>;
}

export function Mascot({ size = 120, style }: MascotProps) {
  return (
    <Image
      source={require('@/assets/images/mascot-ray.png')}
      style={[
        {
          width: size,
          height: size,
        },
        style,
      ]}
      resizeMode="contain"
    />
  );
}