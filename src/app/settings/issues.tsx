import { Page, styles, useApi } from '@/components/page';
import { ThemedText } from '@/components/themed-text';
import { useAuth } from '@/context/auth';
import { useQueueRefresh } from '@/hooks/use-queue-refresh';
import { apiService } from '@/services/api';
import { issueTypeLabels, type IssuePage } from '@/types/issue';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useRef, useState } from 'react';
import { Linking, Pressable, TextInput, View } from 'react-native';

export default function IssuesScreen() {
  const { isManager } = useAuth();
  const router = useRouter();
  const { submitted } = useLocalSearchParams<{ submitted?: string }>();
  const [success, setSuccess] = useState(submitted === '1' ? 'Report submitted successfully. Your manager can now review it.' : null);
  const [page, setPage] = useState(1);
  const [review, setReview] = useState<{ id: number; decision: 'approved' | 'rejected' } | null>(null);
  const [reason, setReason] = useState('');
  const [busy, setBusy] = useState(false);
  const pending = useRef(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const request = useCallback(() => apiService.getIssues(isManager ? 'manager' : 'driver', page), [isManager, page]);
  const { data, loading, error, retry, refresh, refreshing } = useApi<IssuePage | null>(request, null);
  useQueueRefresh(refresh);
  const selected = data?.data.find(item => item.id === review?.id);
  const decide = async () => {
    if (!review || !reason.trim() || pending.current || !selected || selected.status !== 'pending' || error || (review.decision === 'approved' && !selected.can_approve)) return;
    pending.current = true; setBusy(true); setActionError(null);
    try {
      await apiService.decideIssue(review.id, review.decision, reason, selected.queue_entry_id != null);
      setReview(null); setReason(''); setSuccess('Review saved successfully.'); await refresh();
    } catch (failure: any) {
      setActionError(Object.values(failure?.response?.data?.errors || {}).flat().join(' ') || failure?.message || 'Unable to review this request.');
      await refresh();
    } finally { pending.current = false; setBusy(false); }
  };
  return <Page title={isManager ? 'Driver Issue Requests' : 'My Requests'} loading={loading} error={error} onRetry={retry} onRefresh={refresh} refreshing={refreshing}>
    <Pressable accessibilityRole="button" onPress={() => router.back()} style={{ paddingVertical: 12 }}><ThemedText>Back to Settings</ThemedText></Pressable>
    {success && <ThemedText accessibilityRole="alert" style={{ color: '#166534', paddingVertical: 12 }}>{success}</ThemedText>}
    {actionError && !review && <ThemedText accessibilityRole="alert" style={{ color: '#B42318' }}>{actionError}</ThemedText>}
    {review && selected && <View style={styles.card}>
      <ThemedText style={styles.sectionTitle}>{review.decision === 'approved' ? selected.queue_entry_id != null ? 'Confirm approval and queue removal' : 'Confirm report approval' : 'Confirm rejection'}</ThemedText>
      <ThemedText>{selected.driver_name} — {issueTypeLabels[selected.type] || selected.type}</ThemedText>
      <ThemedText>{selected.explanation}</ThemedText>
      <ThemedText>{selected.queue_entry_id == null ? 'General report — no queue entry' : `Current original entry status: ${selected.queue_status || 'Unavailable'}`}</ThemedText>
      {selected.status !== 'pending' && <ThemedText style={{ color: '#B42318' }}>This request has already been reviewed. Cancel to see the recorded decision.</ThemedText>}
      <ThemedText>{review.decision === 'approved' ? selected.queue_entry_id != null ? 'Approval removes this driver from the waiting queue. They must check in again to join the end.' : 'Approval records your response to this report. Queue status stays unchanged.' : 'Rejection keeps the queue unchanged.'}</ThemedText>
      <TextInput accessibilityLabel="Decision reason (required)" value={reason} onChangeText={setReason} editable={!busy} maxLength={500} multiline placeholder="Decision reason (required)" placeholderTextColor="#64748B" style={{ color: '#14243A', borderWidth: 1, borderColor: '#CBD5E1', borderRadius: 10, padding: 12, minHeight: 80, marginVertical: 12 }} />
      {review.decision === 'approved' && !selected.can_approve && <ThemedText style={{ color: '#B42318' }}>This request is no longer eligible for approval. Cancel and refresh the request.</ThemedText>}
      {actionError && <ThemedText accessibilityRole="alert" style={{ color: '#B42318' }}>{actionError}</ThemedText>}
      <View style={styles.row}>
        <Pressable accessibilityRole="button" disabled={busy} onPress={() => setReview(null)} style={{ padding: 12 }}><ThemedText>Cancel</ThemedText></Pressable>
        <Pressable accessibilityRole="button" disabled={busy || !reason.trim() || selected.status !== 'pending' || (review.decision === 'approved' && !selected.can_approve)} onPress={decide} style={{ padding: 12 }}><ThemedText>{busy ? 'Saving...' : review.decision === 'approved' ? selected.queue_entry_id != null ? 'Confirm approval and removal' : 'Confirm approval' : 'Confirm rejection'}</ThemedText></Pressable>
      </View>
    </View>}
    {!loading && !error && !data?.data.length && <ThemedText style={styles.muted}>No requests yet.</ThemedText>}
    {data?.data.map(item => <View key={item.id} style={styles.card}>
      <ThemedText style={{ color: '#14243A', fontWeight: '800' }}>{issueTypeLabels[item.type] || item.type}</ThemedText>
      {isManager && <ThemedText>{item.driver_name}</ThemedText>}
      <ThemedText>{item.explanation}</ThemedText>
      {item.attachments?.map((file, index) => <Pressable key={index} accessibilityRole="link" onPress={async () => {
        try { await Linking.openURL(file.url); }
        catch { setActionError('Unable to open attachment. Refresh the reports to renew the download link and try again.'); }
      }} style={{ paddingVertical: 12 }}><ThemedText>Download {file.name} ({Math.ceil(file.size / 1024)} KB)</ThemedText></Pressable>)}
      <ThemedText style={{ textTransform: 'capitalize', color: '#1D4ED8' }}>{item.status}</ThemedText>
      <ThemedText style={styles.muted}>Submitted: {new Date(item.created_at).toLocaleString()}</ThemedText>
      <ThemedText style={styles.muted}>{item.queue_entry_id == null ? 'General report — no queue entry' : `Original queue entry: ${item.queue_status || 'Unavailable'}`}</ThemedText>
      {item.decision_reason && <ThemedText>Decision: {item.decision_reason}</ThemedText>}
      {item.decided_at && <ThemedText style={styles.muted}>Reviewed by {item.manager_name || 'Manager'}: {new Date(item.decided_at).toLocaleString()}</ThemedText>}
      {isManager && item.status === 'pending' && !review && <View style={styles.row}>
        <Pressable accessibilityRole="button" disabled={!item.can_approve} onPress={() => { setReview({ id: item.id, decision: 'approved' }); setReason(''); setActionError(null); }} style={{ paddingVertical: 12, opacity: item.can_approve ? 1 : 0.4 }}><ThemedText>Review approval</ThemedText></Pressable>
        <Pressable accessibilityRole="button" onPress={() => { setReview({ id: item.id, decision: 'rejected' }); setReason(''); setActionError(null); }} style={{ paddingVertical: 12 }}><ThemedText>Review rejection</ThemedText></Pressable>
      </View>}
      {isManager && item.status === 'pending' && !item.can_approve && <ThemedText style={styles.muted}>This request is no longer eligible for approval in your TODA. You can reject it with an explanation.</ThemedText>}
    </View>)}
    {data && data.last_page > 1 && <View style={styles.row}>
      <Pressable accessibilityRole="button" disabled={page === 1 || refreshing || busy} onPress={() => { setReview(null); setPage(p => p - 1); }} style={{ padding: 12 }}><ThemedText>Previous</ThemedText></Pressable>
      <ThemedText>{data.current_page} / {data.last_page}</ThemedText>
      <Pressable accessibilityRole="button" disabled={page >= data.last_page || refreshing || busy} onPress={() => { setReview(null); setPage(p => p + 1); }} style={{ padding: 12 }}><ThemedText>Next</ThemedText></Pressable>
    </View>}
  </Page>;
}
