import AttendanceScreen from '@/app/(tabs)/attendance';
import { useAuth } from '@/context/auth';
import { Redirect } from 'expo-router';
import { ActivityIndicator } from 'react-native';

export default function ManagerAttendanceRoute() {
  const { isLoading, isSignedIn, isManager } = useAuth();
  if (isLoading) return <ActivityIndicator />;
  if (!isSignedIn) return <Redirect href="/login" />;
  if (!isManager) return <Redirect href="/(tabs)/attendance" />;
  return <AttendanceScreen />;
}
