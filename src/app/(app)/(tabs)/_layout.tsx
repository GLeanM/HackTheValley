import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import { useState } from 'react';

import { CameraCheck } from '@/components/relast/camera-check';
import { Palette } from '@/constants/palette';

type IconName = keyof typeof Ionicons.glyphMap;
const icon = (name: IconName) =>
  function TabIcon({ color, size }: { color: unknown; size: number }) {
    return <Ionicons name={name} color={color as string} size={size} />;
  };

export default function TabsLayout() {
  const [camCheck, setCamCheck] = useState(false);
  return (
    <>
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: Palette.forest,
        tabBarInactiveTintColor: Palette.muted,
        tabBarLabelStyle: { fontWeight: '600', fontSize: 11 },
        tabBarStyle: { backgroundColor: Palette.cream, borderTopColor: Palette.border },
        sceneStyle: { backgroundColor: Palette.cream },
      }}>
      <Tabs.Screen name="index" options={{ title: 'Home', tabBarIcon: icon('home-outline') }} />
      <Tabs.Screen
        name="scan"
        options={{ title: 'Scan', tabBarIcon: icon('camera-outline') }}
        listeners={{
          tabPress: (e) => {
            e.preventDefault();
            setCamCheck(true);
          },
        }}
      />
      <Tabs.Screen name="profile" options={{ title: 'Profile', tabBarIcon: icon('person-outline') }} />
    </Tabs>
    <CameraCheck visible={camCheck} onClose={() => setCamCheck(false)} />
    </>
  );
}
