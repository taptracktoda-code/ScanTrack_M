import { useAuth } from '@/context/auth';
import { Redirect, Stack } from 'expo-router';
import { ActivityIndicator } from 'react-native';

export default function SettingsLayout() {
  const { isLoading, isSignedIn, isDriver, isManager } = useAuth();
  if (isLoading) return <ActivityIndicator />;
  if (!isSignedIn || (!isDriver && !isManager)) return <Redirect href="/login" />;
  return <Stack screenOptions={{ headerShown: false }} />;
}
