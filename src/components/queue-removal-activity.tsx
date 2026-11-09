import { styles, useApi } from '@/components/page';
import { ThemedText } from '@/components/themed-text';
import { useQueueRefresh } from '@/hooks/use-queue-refresh';
import { apiService } from '@/services/api';
import { useCallback, useState } from 'react';
import { ActivityIndicator, Pressable, View } from 'react-native';

type ActivityPage = {
  data: { id: number; driver_name: string; manager_name: string; reason: string; removed_at: string }[];
  current_page: number;
  last_page: number;
};

export function QueueRemovalActivity() {
  const [page, setPage] = useState(1);
  const request = useCallback(async (): Promise<ActivityPage> => {
    const response = await apiService.getQueueRemovalActivity(page);
    if (!Array.isArray(response?.data)) throw new Error('Unable to load queue removal activity.');
    return response;
  }, [page]);
  const { data, loading, error, refresh, refreshing } = useApi<ActivityPage | null>(request, null);
  useQueueRefresh(refresh);

  return <View style={styles.card}>
    <ThemedText style={[styles.sectionTitle, { marginTop: 0 }]}>Queue removal activity</ThemedText>
    {loading ? <ActivityIndicator /> : error ? <>
      <ThemedText accessibilityRole="alert" style={{ color: '#B42318' }}>{error}</ThemedText>
      <Pressable accessibilityRole="button" onPress={refresh} style={{ paddingVertical: 12 }}><ThemedText>Retry</ThemedText></Pressable>
    </> : <>
      {data?.data.length ? data.data.map((item) => <View key={item.id} style={{ paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#EDF1F4' }}>
        <ThemedText style={{ color: '#14243A', fontWeight: '700' }}>{item.driver_name}</ThemedText>
        <ThemedText style={{ color: '#334155' }}>{item.reason}</ThemedText>
        <ThemedText style={styles.muted}>Removed by {item.manager_name}</ThemedText>
        <ThemedText style={styles.muted}>{new Date(item.removed_at).toLocaleString()}</ThemedText>
      </View>) : <ThemedText style={styles.muted}>No queue removals recorded yet.</ThemedText>}
      {data && data.last_page > 1 && <View style={styles.row}>
        <Pressable accessibilityRole="button" disabled={page <= 1 || refreshing} onPress={() => setPage((value) => value - 1)} style={{ paddingVertical: 12 }}><ThemedText>Previous</ThemedText></Pressable>
        <ThemedText style={styles.muted}>Page {data.current_page} of {data.last_page}</ThemedText>
        <Pressable accessibilityRole="button" disabled={page >= data.last_page || refreshing} onPress={() => setPage((value) => value + 1)} style={{ paddingVertical: 12 }}><ThemedText>Next</ThemedText></Pressable>
      </View>}
    </>}
  </View>;
}
