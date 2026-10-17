import { Stack } from 'expo-router';
import { Platform } from 'react-native';

import { Palette } from '@/constants/palette';

export default function AppLayout() {
  return (
    <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: Palette.cream } }}>
      <Stack.Screen name="(tabs)" />
      <Stack.Screen
        name="assistant"
        options={{ animation: 'slide_from_bottom', gestureEnabled: Platform.OS !== 'ios' }}
      />
      <Stack.Screen name="answer" />
    </Stack>
  );
}
