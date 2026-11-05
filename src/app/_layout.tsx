import { NotificationsPanel } from '@/components/notifications-panel';
import { AuthProvider } from '@/context/auth';
import { NotificationsProvider, useNotifications } from '@/context/notifications';
import { DarkTheme, DefaultTheme, Stack, ThemeProvider } from 'expo-router';
import { useColorScheme } from 'react-native';

function AppShell() {
  const { isPanelOpen, closePanel } = useNotifications();
  return (
    <>
      <Stack screenOptions={{ headerShown: false }} />
      {isPanelOpen ? <NotificationsPanel onClose={closePanel} /> : null}
    </>
  );
}

export default function RootLayout() {
  const colorScheme = useColorScheme();
  return (
    <AuthProvider>
      <NotificationsProvider>
        <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
          <AppShell />
        </ThemeProvider>
      </NotificationsProvider>
    </AuthProvider>
  );
}
