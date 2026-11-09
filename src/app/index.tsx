import { useAuth } from '@/context/auth';
import { WelcomeOnboarding } from '@/components/welcome-onboarding';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Redirect } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';

export default function Index() {
  const { isLoading, isSignedIn, role } = useAuth();
  const [introduced, setIntroduced] = useState<boolean | null>(null);
  useEffect(() => {
    let active = true;
    AsyncStorage.getItem('scantrack.onboarding.completed.v1')
      .then(value => { if (active) setIntroduced(value === 'true'); })
      .catch(() => { if (active) setIntroduced(false); });
    return () => { active = false; };
  }, []);
  const completeIntroduction = async () => {
    try { await AsyncStorage.setItem('scantrack.onboarding.completed.v1', 'true'); }
    catch { /* Keep login accessible if device storage is unavailable. */ }
    setIntroduced(true);
  };
  if (isLoading || (!isSignedIn && introduced === null)) return <View style={{ flex: 1, justifyContent: 'center' }}><ActivityIndicator color="#208AEF" size="large" /></View>;
  if (!isSignedIn && !introduced) return <WelcomeOnboarding onComplete={completeIntroduction} />;
  if (!isSignedIn) return <Redirect href="/login" />;
  if (role !== 'manager' && role !== 'driver') return <Redirect href="/login" />;
  return <Redirect href={role === 'manager' ? '/admin/dashboard' : '/(tabs)'} />;
}
