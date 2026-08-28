import { Tabs } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import type { ComponentProps } from 'react';
import { Text } from 'react-native';

type SymbolName = ComponentProps<typeof SymbolView>['name'];

function TabIcon({ name, color }: { name: SymbolName; color: string }) {
  return <SymbolView name={name} tintColor={color} size={19} />;
}

function TextTabIcon({ glyph, color }: { glyph: string; color: string }) {
  return <Text style={{ color, fontSize: 19, lineHeight: 21 }}>{glyph}</Text>;
}

export default function TabsLayout() {
  return (
    <Tabs screenOptions={{ headerShown: false, tabBarActiveTintColor: '#123BFF', tabBarInactiveTintColor: '#777777', tabBarLabelStyle: { fontSize: 10, fontWeight: '600' }, tabBarStyle: { height: 64, marginHorizontal: 6, marginBottom: 5, paddingTop: 5, paddingBottom: 8, borderWidth: 1.5, borderColor: '#202020', borderRadius: 8, backgroundColor: '#FFFFFF' } }}>
      <Tabs.Screen name="index" options={{ title: 'Home', tabBarIcon: ({ color }) => <TabIcon name={{ ios: 'house.fill', android: 'home', web: 'home' }} color={color} /> }} />
      <Tabs.Screen name="schedule" options={{ title: 'Schedule', tabBarIcon: ({ color }) => <TextTabIcon glyph="▣" color={color} /> }} />
      <Tabs.Screen name="attendance" options={{ title: 'Attendance', tabBarIcon: ({ color }) => <TabIcon name={{ ios: 'clock.fill', android: 'schedule', web: 'clock' }} color={color} /> }} />
      <Tabs.Screen name="trips" options={{ title: 'Trips', tabBarIcon: ({ color }) => <TextTabIcon glyph="↔" color={color} /> }} />
      <Tabs.Screen name="profile" options={{ title: 'Profile', tabBarIcon: ({ color }) => <TabIcon name={{ ios: 'person.fill', android: 'person', web: 'person' }} color={color} /> }} />
    </Tabs>
  );
}
