import { useAuth } from '@/context/auth';
import { Redirect, Tabs } from 'expo-router';
import { ActivityIndicator, Text, View } from 'react-native';

function TextTabIcon({ glyph, color }: { glyph: string; color: string }) {
  return <Text style={{ color, fontSize: 19, lineHeight: 21 }}>{glyph}</Text>;
}

export default function TabsLayout() {
  const { isLoading, isSignedIn, isAdmin } = useAuth();

  if (isLoading) {
    return <View style={{ flex: 1, justifyContent: 'center' }}><ActivityIndicator color="#208AEF" size="large" /></View>;
  }

  if (!isSignedIn) return <Redirect href="/login" />;
  if (isAdmin) return <Redirect href="/admin/dashboard" />;

  return (
    <Tabs screenOptions={{ headerShown: false, tabBarActiveTintColor: '#123BFF', tabBarInactiveTintColor: '#777777', tabBarLabelStyle: { fontSize: 10, fontWeight: '600' }, tabBarStyle: { height: 64, marginHorizontal: 6, marginBottom: 5, paddingTop: 5, paddingBottom: 8, borderWidth: 1.5, borderColor: '#202020', borderRadius: 8, backgroundColor: '#FFFFFF' } }}>
      <Tabs.Screen name="index" options={{ title: 'Home', tabBarIcon: ({ color }) => <TextTabIcon glyph="⌂" color={String(color)} /> }} />
      <Tabs.Screen name="schedule" options={{ title: 'Schedule', tabBarIcon: ({ color }) => <TextTabIcon glyph="▣" color={String(color)} /> }} />
      <Tabs.Screen name="attendance" options={{ title: 'Attendance', tabBarIcon: ({ color }) => <TextTabIcon glyph="◔" color={String(color)} /> }} />
      <Tabs.Screen name="trips" options={{ title: 'Trips', tabBarIcon: ({ color }) => <TextTabIcon glyph="↔" color={String(color)} /> }} />
      <Tabs.Screen name="profile" options={{ title: 'Profile', tabBarIcon: ({ color }) => <TextTabIcon glyph="◌" color={String(color)} /> }} />
    </Tabs>
  );
}
