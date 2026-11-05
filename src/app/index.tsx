import { useAuth } from '@/context/auth';
import { Redirect } from 'expo-router';
import { ActivityIndicator, View } from 'react-native';

export default function Index() {
  const { isLoading, isSignedIn, role } = useAuth();
  if (isLoading) return <View style={{ flex: 1, justifyContent: 'center' }}><ActivityIndicator color="#208AEF" size="large" /></View>;
  if (!isSignedIn) return <Redirect href="/login" />;
  if (role !== 'manager' && role !== 'driver') return <Redirect href="/login" />;
  return <Redirect href={role === 'manager' ? '/admin/dashboard' : '/(tabs)'} />;
}
