import { Ionicons } from '@expo/vector-icons';
import { router, Tabs } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { Palette, Radius } from '@/constants/palette';

type IconName = keyof typeof Ionicons.glyphMap;
// Active tab gets the filled glyph on a mint pill so the current page is obvious.
const icon = (active: IconName, inactive: IconName) =>
  function TabIcon({ focused, color, size }: { focused: boolean; color: unknown; size: number }) {
    return (
      <View style={[styles.pill, focused && styles.pillActive]}>
        <Ionicons name={focused ? active : inactive} color={color as string} size={size} />
      </View>
    );
  };

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: Palette.forestDark,
        tabBarInactiveTintColor: Palette.muted,
        tabBarLabelStyle: { fontWeight: '700', fontSize: 11 },
        tabBarIconStyle: { width: 56, height: 32 },
        tabBarStyle: { backgroundColor: Palette.cream, borderTopColor: Palette.border },
        sceneStyle: { backgroundColor: Palette.cream },
      }}>
      <Tabs.Screen name="index" options={{ title: 'Home', tabBarIcon: icon('home', 'home-outline') }} />
      <Tabs.Screen
        name="scan"
        options={{ title: 'Scan', tabBarIcon: icon('camera', 'camera-outline') }}
        listeners={{
          tabPress: (e) => {
            e.preventDefault();
            router.navigate('/assistant');
          },
        }}
      />
      <Tabs.Screen name="profile" options={{ title: 'Profile', tabBarIcon: icon('person', 'person-outline') }} />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  pill: { width: 56, height: 32, borderRadius: Radius.pill, alignItems: 'center', justifyContent: 'center' },
  pillActive: { backgroundColor: Palette.mint },
});
