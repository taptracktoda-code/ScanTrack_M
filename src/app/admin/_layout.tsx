import { useAuth } from '@/context/auth';
import { Redirect, Tabs } from 'expo-router';
import { ActivityIndicator, Text, View } from 'react-native';

function TextTabIcon({ glyph, color }: { glyph: string; color: string }) {
  return <Text style={{ color, fontSize: 20 }}>{glyph}</Text>;
}

export default function AdminTabsLayout() {
  const { isLoading, isSignedIn, isAdmin } = useAuth();

  if (isLoading) {
    return <View style={{ flex: 1, justifyContent: 'center' }}><ActivityIndicator color="#208AEF" size="large" /></View>;
  }

  if (!isSignedIn) return <Redirect href="/login" />;
  if (!isAdmin) return <Redirect href="/(tabs)" />;

  return (
    <Tabs screenOptions={{
      headerShown: false,
      tabBarActiveTintColor: '#208AEF',
      tabBarInactiveTintColor: '#7B8794',
      tabBarStyle: { backgroundColor: '#FFF', borderTopColor: '#E2E8F0', borderTopWidth: 1, height: 72, paddingTop: 6, paddingBottom: 8 },
      tabBarLabelStyle: { fontSize: 10, fontWeight: '700' },
      tabBarItemStyle: { minWidth: 70 },
    }}>
      <Tabs.Screen
        name="dashboard"
        options={{
          title: 'Dashboard',
          tabBarIcon: ({ color }) => <TextTabIcon glyph="⌂" color={String(color)} />,
        }}
      />
      <Tabs.Screen
        name="scan"
        options={{
          title: 'QR Scan',
          tabBarIcon: ({ color }) => <TextTabIcon glyph="▦" color={String(color)} />,
        }}
      />
      <Tabs.Screen
        name="history"
        options={{
          title: 'History',
          tabBarIcon: ({ color }) => <TextTabIcon glyph="◷" color={String(color)} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color }) => <TextTabIcon glyph="♙" color={String(color)} />,
        }}
      />
    </Tabs>
  );
}
