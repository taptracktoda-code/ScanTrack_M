import { useAuth } from '@/context/auth';
import { Redirect, Tabs } from 'expo-router';
import { SymbolView, type SymbolViewProps } from 'expo-symbols';
import { ActivityIndicator, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

function TabIcon({
  name,
  color,
}: {
  name: SymbolViewProps['name'];
  color: string;
}) {
  return <SymbolView name={name} tintColor={color} size={21} />;
}

export default function TabsLayout() {
  const insets = useSafeAreaInsets();
  const bottomPadding = Math.max(insets.bottom, 8);
  const { isLoading, isSignedIn, isManager, isDriver } = useAuth();

  if (isLoading) {
    return <View style={{ flex: 1, justifyContent: 'center' }}><ActivityIndicator color="#208AEF" size="large" /></View>;
  }

  if (!isSignedIn) return <Redirect href="/login" />;
  if (isManager) return <Redirect href="/admin/dashboard" />;
  if (!isDriver) return <Redirect href="/login" />;

  return (
    <Tabs screenOptions={{ headerShown: false, tabBarHideOnKeyboard: true, tabBarLabelPosition: 'below-icon', tabBarActiveTintColor: '#1D4ED8', tabBarInactiveTintColor: '#8793A5', tabBarLabelStyle: { fontSize: 10, fontWeight: '700', marginTop: 2 }, tabBarStyle: { height: 60 + bottomPadding, paddingTop: 7, paddingBottom: bottomPadding, borderTopWidth: 1, borderTopColor: '#E6EBF2', backgroundColor: '#FFFFFF', elevation: 12, shadowColor: '#10233F', shadowOpacity: 0.08, shadowRadius: 12 } }}>
      <Tabs.Screen name="index" options={{ title: 'Home', tabBarIcon: ({ color }) => <TabIcon name={{ ios: 'house.fill', android: 'home', web: 'home' }} color={String(color)} /> }} />
      <Tabs.Screen name="schedule" options={{ title: 'Schedule', tabBarIcon: ({ color }) => <TabIcon name={{ ios: 'calendar', android: 'calendar_month', web: 'calendar_month' }} color={String(color)} /> }} />
      <Tabs.Screen name="attendance" options={{ title: 'Attendance', tabBarIcon: ({ color }) => <TabIcon name={{ ios: 'clock.fill', android: 'schedule', web: 'schedule' }} color={String(color)} /> }} />
      <Tabs.Screen name="trips" options={{ title: 'Trips', tabBarIcon: ({ color }) => <TabIcon name={{ ios: 'car.fill', android: 'directions_car', web: 'directions_car' }} color={String(color)} /> }} />
      <Tabs.Screen name="profile" options={{ title: 'Profile', tabBarIcon: ({ color }) => <TabIcon name={{ ios: 'person.crop.circle.fill', android: 'account_circle', web: 'account_circle' }} color={String(color)} /> }} />
    </Tabs>
  );
}
