import { Stack } from 'expo-router';

import { ClassifierHost } from '@/components/relast/classifier-host';
import { Palette } from '@/constants/palette';

export default function AppLayout() {
  return (
    <>
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: Palette.cream } }}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="assistant" options={{ animation: 'slide_from_bottom' }} />
        <Stack.Screen name="answer" />
      </Stack>
      {/* Loads the on-device trash classifier in the background once signed in. */}
      <ClassifierHost />
    </>
  );
}
