import { Stack } from 'expo-router';
import { Platform } from 'react-native';

import { ClassifierHost } from '@/components/relast/classifier-host';
import { TripTracker } from '@/components/relast/trip-tracker';
import { Palette } from '@/constants/palette';

export default function AppLayout() {
  return (
    <>
      <TripTracker />
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: Palette.cream } }}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen
          name="assistant"
          options={{ animation: 'slide_from_bottom', gestureEnabled: Platform.OS !== 'ios' }}
        />
        <Stack.Screen name="answer" />
      </Stack>
      {/* Loads the on-device trash classifier in the background once signed in. */}
      <ClassifierHost />
    </>
  );
}
