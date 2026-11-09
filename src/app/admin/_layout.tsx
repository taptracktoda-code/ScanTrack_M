import { useAuth } from '@/context/auth';
import { Redirect, Tabs } from 'expo-router';
import { SymbolView, type SymbolViewProps } from 'expo-symbols';
import { ActivityIndicator, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

function ManagerTabIcon({ name, color }: { name: SymbolViewProps['name']; color: string }) {
  return <SymbolView name={name} tintColor={color} size={21} />;
}

export default function ManagerTabsLayout() {
  const insets = useSafeAreaInsets();
  const bottomPadding = Math.max(insets.bottom, 8);
  const { isLoading, isSignedIn, isManager } = useAuth();

  if (isLoading) {
    return <View style={{ flex: 1, justifyContent: 'center' }}><ActivityIndicator color="#208AEF" size="large" /></View>;
  }

  if (!isSignedIn) return <Redirect href="/login" />;
  if (!isManager) return <Redirect href="/(tabs)" />;

  return (
    <Tabs screenOptions={{
      headerShown: false, tabBarHideOnKeyboard: true, tabBarLabelPosition: 'below-icon',
      tabBarActiveTintColor: '#1D4ED8',
      tabBarInactiveTintColor: '#8793A5',
      tabBarStyle: { height: 60 + bottomPadding, paddingTop: 7, paddingBottom: bottomPadding, borderTopWidth: 1, borderTopColor: '#E6EBF2', backgroundColor: '#FFFFFF', elevation: 12, shadowColor: '#10233F', shadowOpacity: 0.08, shadowRadius: 12 },
      tabBarLabelStyle: { fontSize: 10, fontWeight: '700', marginTop: 2 },
      tabBarItemStyle: { minWidth: 0 },
    }}>
      <Tabs.Screen
        name="dashboard"
        options={{
          title: 'Dashboard',
          tabBarIcon: ({ color }) => <ManagerTabIcon name={{ ios: 'house.fill', android: 'home', web: 'home' }} color={String(color)} />,
        }}
      />
      <Tabs.Screen
        name="scan"
        options={{
          title: 'QR Scan',
          tabBarIcon: ({ color }) => <ManagerTabIcon name={{ ios: 'qrcode.viewfinder', android: 'qr_code_scanner', web: 'qr_code_scanner' }} color={String(color)} />,
        }}
      />
      <Tabs.Screen
        name="history"
        options={{
          title: 'History',
          tabBarIcon: ({ color }) => <ManagerTabIcon name={{ ios: 'clock.arrow.circlepath', android: 'history', web: 'history' }} color={String(color)} />,
        }}
      />
      <Tabs.Screen
        name="driver-registration"
        options={{
          title: 'Driver Management',
          tabBarAccessibilityLabel: 'Driver Management',
          tabBarLabel: ({ color }) => (
            <Text numberOfLines={2} style={{ color, fontSize: 9, lineHeight: 11, fontWeight: '700', textAlign: 'center', marginTop: 2 }}>
              {'Driver\nManagement'}
            </Text>
          ),
          tabBarIcon: ({ color }) => <ManagerTabIcon name={{ ios: 'person.2.fill', android: 'manage_accounts', web: 'manage_accounts' }} color={String(color)} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color }) => <ManagerTabIcon name={{ ios: 'person.crop.circle.fill', android: 'account_circle', web: 'account_circle' }} color={String(color)} />,
        }}
      />
    </Tabs>
  );
}
