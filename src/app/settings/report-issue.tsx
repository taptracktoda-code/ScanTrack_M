import { Page, styles, useApi } from '@/components/page';
import { ThemedText } from '@/components/themed-text';
import { useAuth } from '@/context/auth';
import { useQueueRefresh } from '@/hooks/use-queue-refresh';
import { apiService } from '@/services/api';
import { issueTypeLabels, type IssueType } from '@/types/issue';
import { Redirect, useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { useCallback, useRef, useState } from 'react';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';

export default function ReportIssueScreen() {
  const { isDriver } = useAuth();
  return isDriver ? <DriverIssueForm /> : <Redirect href="/settings" />;
}

function DriverIssueForm() {
  const router = useRouter();
  const [type, setType] = useState<IssueType>('vehicle_breakdown');
  const [explanation, setExplanation] = useState('');
  const [busy, setBusy] = useState(false);
  const [attachments, setAttachments] = useState<NonNullable<Parameters<typeof apiService.submitIssue>[0]['attachments']>>([]);
  const [locked, setLocked] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const pending = useRef(false);
  const payload = useRef<Parameters<typeof apiService.submitIssue>[0] | null>(null);
  const request = useCallback(() => apiService.getDashboardData(), []);
  const { data, loading, error, refresh, retry, refreshing } = useApi<any>(request, {});
  useQueueRefresh(refresh);
  const queue = (data?.data ?? data)?.queue;
  const waiting = queue?.status?.toUpperCase() === 'WAITING';
  const entryId = Number(queue?.entry_id);
  const hasEntry = Number.isSafeInteger(entryId) && entryId > 0;
  const generalReport = type === 'other';
  const canSubmit = !busy && (locked || (!!explanation.trim() && (generalReport || (!loading && !refreshing && !error && waiting && hasEntry))));
  const pickAttachment = async () => {
    if (locked || attachments.length >= 3) return;
    setActionError(null);
    try {
      const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.8 });
      if (result.canceled) return;
      const asset = result.assets[0];
      const mime = asset.mimeType || 'image/jpeg';
      if (!['image/jpeg', 'image/png', 'image/webp'].includes(mime)) {
        setActionError('Choose a JPG, PNG or WebP image.'); return;
      }
      if (asset.fileSize && asset.fileSize > 5 * 1024 * 1024) {
        setActionError('Each attachment must be 5 MB or smaller.'); return;
      }
      setAttachments(files => [...files, { uri: asset.uri, name: asset.fileName || 'report-photo.jpg', type: mime, file: asset.file }].slice(0, 3));
    } catch { setActionError('Unable to open photos. Please try again.'); }
  };
  const submit = async () => {
    if (pending.current || !canSubmit) return;
    if (!payload.current) payload.current = { attachments, type, explanation: explanation.trim(), queue_entry_id: generalReport ? null : entryId, client_request_id: `issue-${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}` };
    pending.current = true; setBusy(true); setLocked(true); setActionError(null);
    try {
      await apiService.submitIssue(payload.current);
      router.replace({ pathname: '/settings/issues', params: { submitted: '1' } });
    } catch (failure: any) {
      setActionError(Object.values(failure?.response?.data?.errors || {}).flat().join(' ') || failure?.response?.data?.message || failure?.message || 'Request unconfirmed. Check My Requests before retrying.');
      if (failure?.response && failure.response.status < 500) { payload.current = null; setLocked(false); }
      await refresh();
    } finally { pending.current = false; setBusy(false); }
  };
  return <Page title="Report an Issue" onRefresh={refresh} refreshing={refreshing}>
    <Pressable accessibilityRole="button" onPress={() => router.back()} style={{ paddingVertical: 12 }}><ThemedText>Back to Settings</ThemedText></Pressable>
    <View style={styles.card}>
      <ThemedText style={styles.muted}>Choose Others to report a concern at any time, even outside the queue. Your manager will review your report.</ThemedText>
      {(Object.keys(issueTypeLabels) as IssueType[]).map(value => <Pressable key={value} accessibilityRole="radio" accessibilityState={{ checked: type === value, disabled: locked }} disabled={locked} onPress={() => setType(value)} style={{ paddingVertical: 14 }}><ThemedText>{type === value ? '● ' : '○ '}{value === 'other' ? 'Others (reason)' : issueTypeLabels[value]}</ThemedText></Pressable>)}
      <ThemedText style={formStyles.label}>{type === 'other' ? 'Reason / other details (required)' : 'Details (required)'}</ThemedText>
      <TextInput accessibilityLabel={type === 'other' ? 'Other reason (required)' : 'Issue explanation (required)'} value={explanation} onChangeText={setExplanation} editable={!locked} maxLength={500} multiline textAlignVertical="top" placeholder={type === 'other' ? 'Enter your reason and other reporting details' : 'Explain what happened (required)'} placeholderTextColor="#64748B" style={{ minHeight: 110, padding: 12, color: '#14243A', borderWidth: 1, borderColor: '#CBD5E1', borderRadius: 10 }} />
      <ThemedText style={styles.muted}>{explanation.length}/500 characters</ThemedText>
      <ThemedText style={formStyles.label}>Attachments (optional)</ThemedText>
      <ThemedText style={styles.muted}>Up to 3 photos. JPG, PNG or WebP, 5 MB each.</ThemedText>
      {attachments.map((file, index) => <View key={index} style={styles.row}>
        <ThemedText style={{ flex: 1 }}>{file.name}</ThemedText>
        <Pressable accessibilityRole="button" accessibilityLabel={'Remove attachment ' + (index + 1)} disabled={locked} onPress={() => setAttachments(files => files.filter((_, i) => i !== index))} style={{ padding: 12 }}><ThemedText>Remove</ThemedText></Pressable>
      </View>)}
      <Pressable accessibilityRole="button" disabled={locked || attachments.length >= 3} onPress={pickAttachment} style={{ paddingVertical: 12 }}><ThemedText>Add photo</ThemedText></Pressable>
      {generalReport && <ThemedText style={styles.muted}>This report is not linked to a queue entry. Approval will not change your queue status.</ThemedText>}
      {!generalReport && (loading || refreshing ? <ThemedText style={styles.muted}>Checking your queue...</ThemedText> : error ? <View><ThemedText style={styles.muted}>{error}</ThemedText><Pressable accessibilityRole="button" onPress={retry} style={{ paddingVertical: 12 }}><ThemedText>Retry queue check</ThemedText></Pressable></View> : !waiting ? <ThemedText style={styles.muted}>This request requires a waiting queue entry. Choose Others for a general report.</ThemedText> : !hasEntry ? <ThemedText style={styles.muted}>Queue entry unavailable. Refresh your queue before submitting.</ThemedText> : null)}
      {!locked && !explanation.trim() && <ThemedText style={styles.muted}>Enter {generalReport ? 'a reason' : 'details'} to enable submission.</ThemedText>}
      {actionError && <ThemedText accessibilityRole="alert" style={{ color: '#B42318', marginTop: 12 }}>{actionError}</ThemedText>}
      <Pressable accessibilityRole="button" accessibilityState={{ disabled: !canSubmit, busy }} disabled={!canSubmit} onPress={submit} style={({ pressed }) => [formStyles.submit, !canSubmit && formStyles.disabled, pressed && canSubmit && { opacity: 0.85 }]}><ThemedText style={formStyles.submitText}>{busy ? 'Submitting...' : locked ? 'Retry original request' : 'Submit report'}</ThemedText></Pressable>
      <Pressable accessibilityRole="button" onPress={() => router.push('/settings/issues')} style={{ paddingVertical: 12 }}><ThemedText>View My Requests</ThemedText></Pressable>
    </View>
  </Page>;
}

const formStyles = StyleSheet.create({
  label: { color: '#14243A', fontWeight: '700', marginBottom: 8 },
  submit: { backgroundColor: '#1D4ED8', borderRadius: 12, minHeight: 48, alignItems: 'center', justifyContent: 'center', padding: 14, marginTop: 16 },
  disabled: { backgroundColor: '#64748B', opacity: 0.6 },
  submitText: { color: '#FFFFFF', fontWeight: '700' },
});
