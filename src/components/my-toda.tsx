import { styles, useApi } from '@/components/page';
import { ThemedText } from '@/components/themed-text';
import { useQueueRefresh } from '@/hooks/use-queue-refresh';
import { apiService } from '@/services/api';
import { Image } from 'expo-image';
import { useCallback } from 'react';
import { ActivityIndicator, Pressable, View } from 'react-native';

type Toda = {
  id: number | null;
  name: string | null;
  official_contact_number: string | null;
  managers: { id: number; name: string; avatar: string | null }[];
};

export function MyToda() {
  const request = useCallback(async (): Promise<Toda> => {
    const response = await apiService.getMyToda();
    const result = response?.data;
    if (!result || !Array.isArray(result.managers)) throw new Error('Unable to load your TODA information.');
    return result;
  }, []);
  const { data, loading, error, refresh } = useApi<Toda | null>(request, null);
  useQueueRefresh(refresh);

  return <View style={styles.card}>
    <ThemedText style={[styles.sectionTitle, { marginTop: 0 }]}>My TODA</ThemedText>
    {loading ? <ActivityIndicator accessibilityLabel="Loading My TODA" /> : error ? <>
      <ThemedText accessibilityRole="alert" style={{ color: '#B42318' }}>{error}</ThemedText>
      <Pressable accessibilityRole="button" onPress={refresh} style={{ minHeight: 44, justifyContent: 'center' }}><ThemedText>Retry</ThemedText></Pressable>
    </> : <>
      <ThemedText style={{ color: '#14243A', fontWeight: '700' }}>{data?.name || 'No TODA assigned yet'}</ThemedText>
      {data?.managers.length ? data.managers.map((manager) => <View key={manager.id} style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 14 }}>
        {manager.avatar ? <Image source={{ uri: manager.avatar }} accessibilityLabel={`${manager.name}'s profile photo`} style={{ width: 48, height: 48, borderRadius: 24 }} contentFit="cover" /> : <View style={{ width: 48, height: 48, borderRadius: 24, backgroundColor: '#EFF6FF', alignItems: 'center', justifyContent: 'center' }}><ThemedText>{manager.name.charAt(0)}</ThemedText></View>}
        <View style={{ flex: 1 }}><ThemedText style={styles.muted}>TODA Manager</ThemedText><ThemedText style={{ color: '#14243A', fontWeight: '700' }}>{manager.name}</ThemedText></View>
      </View>) : <ThemedText style={[styles.muted, { marginTop: 10 }]}>No manager assigned yet.</ThemedText>}
      {data?.official_contact_number ? <View style={{ marginTop: 14 }}><ThemedText style={styles.muted}>Official TODA contact number</ThemedText><ThemedText style={{ color: '#14243A' }}>{data.official_contact_number}</ThemedText></View> : null}
    </>}
  </View>;
}
