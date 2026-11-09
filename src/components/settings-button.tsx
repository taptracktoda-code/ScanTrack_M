import { ThemedText } from '@/components/themed-text';
import { useRouter } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { Pressable } from 'react-native';

export function SettingsButton() {
  const router = useRouter();
  return <Pressable accessibilityRole="button" accessibilityLabel="Settings" onPress={() => router.push('/settings')} style={{ minHeight: 52, borderRadius: 14, backgroundColor: '#EFF6FF', alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 10, marginBottom: 14 }}>
    <SymbolView name={{ ios: 'gearshape.fill', android: 'settings', web: 'settings' }} tintColor="#1D4ED8" size={20} />
    <ThemedText style={{ color: '#1D4ED8', fontWeight: '800' }}>Settings</ThemedText>
  </Pressable>;
}
