import { useAuth } from '@/context/auth';
import { Redirect } from 'expo-router';
import { ActivityIndicator, View } from 'react-native';

export default function Index() {
  const { isLoading, isSignedIn } = useAuth();
  if (isLoading) return <View style={{ flex: 1, justifyContent: 'center' }}><ActivityIndicator color="#208AEF" size="large" /></View>;
  return <Redirect href={isSignedIn ? '/(tabs)' : '/login'} />;
}
