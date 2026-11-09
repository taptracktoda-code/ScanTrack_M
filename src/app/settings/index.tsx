import { Page, styles, useApi } from '@/components/page';
import { ThemedText } from '@/components/themed-text';
import { useAuth } from '@/context/auth';
import { useQueueRefresh } from '@/hooks/use-queue-refresh';
import { apiService } from '@/services/api';
import { useRouter } from 'expo-router';
import { useCallback } from 'react';
import { Pressable } from 'react-native';

export default function SettingsScreen() {
  const { isManager } = useAuth();
  const router = useRouter();
  const request = useCallback(() => isManager ? apiService.getIssues('manager') : Promise.resolve({ pending_count: 0 }), [isManager]);
  const { data, error, refresh } = useApi<any>(request, {});
  useQueueRefresh(refresh);
  return <Page title="Settings">
    <Pressable accessibilityRole="button" onPress={() => router.replace(isManager ? '/admin/profile' : '/(tabs)/profile')} style={{ paddingVertical: 12 }}><ThemedText>Back to Profile</ThemedText></Pressable>
    {!isManager && <>
      <Pressable accessibilityRole="button" onPress={() => router.push({ pathname: '/change-password', params: { from: 'driver-settings' } })} style={styles.card}><ThemedText>Change Password</ThemedText></Pressable>
      <Pressable accessibilityRole="button" onPress={() => router.push('/settings/report-issue')} style={styles.card}><ThemedText>Report an Issue</ThemedText></Pressable>
    </>}
    <Pressable accessibilityRole="button" onPress={() => router.push('/settings/issues')} style={styles.card}>
      <ThemedText>{isManager ? `Driver Issue Requests${data.pending_count != null && !error ? ` (${data.pending_count} pending)` : ''}` : 'My Requests'}</ThemedText>
    </Pressable>
    {error && <ThemedText style={{ color: '#B42318' }}>Pending count unavailable. Open requests to retry.</ThemedText>}
  </Page>;
}
