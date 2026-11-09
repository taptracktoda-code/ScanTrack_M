import { ThemedText } from '@/components/themed-text';
import { apiService } from '@/services/api';
import type { ManagerDriverAccount } from '@/utils/managerDrivers';
import { useRef, useState } from 'react';
import { KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export function RemoveQueueDriver({ driver, onClose }: { driver: ManagerDriverAccount; onClose: () => void }) {
  const [reason, setReason] = useState<'left_terminal' | 'other'>('left_terminal');
  const [details, setDetails] = useState('');
  const [review, setReview] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const pending = useRef(false);
  const insets = useSafeAreaInsets();
  const valid = reason === 'left_terminal' || details.trim().length > 0;

  const remove = async () => {
    if (pending.current || !valid || !driver.queue_entry_id) return;
    pending.current = true;
    setBusy(true);
    setError(null);
    try {
      await apiService.removeQueueDriver(driver.queue_entry_id, reason, details);
      onClose();
    } catch (failure: any) {
      setError(failure?.response?.data?.message || failure?.message || 'Unable to remove this driver. Refresh and try again.');
    } finally {
      pending.current = false;
      setBusy(false);
    }
  };

  return <Modal visible transparent animationType="fade" onRequestClose={() => { if (!pending.current) onClose(); }}>
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={[styles.overlay, { paddingTop: insets.top + 20, paddingBottom: insets.bottom + 20 }]}>
      <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={styles.content}>
        <View style={styles.dialog} accessibilityViewIsModal>
          <ThemedText style={styles.title}>{review ? 'Confirm removal' : 'Remove from queue'}</ThemedText>
          <ThemedText style={styles.copy}>{driver.full_name}{driver.queue_position ? ` · Position #${driver.queue_position}` : ''}</ThemedText>
          {review ? <>
            <ThemedText style={styles.copy}>Reason: {reason === 'left_terminal' ? 'Left terminal' : details.trim()}</ThemedText>
            <ThemedText style={styles.copy}>The remaining drivers will move up. This driver will be notified and must check in again to join the end of the queue.</ThemedText>
          </> : <>
            {(['left_terminal', 'other'] as const).map((option) => <Pressable key={option} accessibilityRole="radio" accessibilityState={{ checked: reason === option }} onPress={() => setReason(option)} style={[styles.option, reason === option && styles.selected]}>
              <ThemedText style={styles.copy}>{reason === option ? '● ' : '○ '}{option === 'left_terminal' ? 'Left terminal' : 'Other'}</ThemedText>
            </Pressable>)}
            {reason === 'other' && <TextInput accessibilityLabel="Written reason (required)" placeholder="Written reason (required)" placeholderTextColor="#64748B" value={details} onChangeText={setDetails} maxLength={500} multiline style={styles.input} />}
          </>}
          {error && <ThemedText accessibilityRole="alert" style={styles.error}>{error}</ThemedText>}
          <View style={styles.actions}>
            <Pressable accessibilityRole="button" disabled={busy} onPress={onClose} style={styles.button}><ThemedText style={styles.copy}>Cancel</ThemedText></Pressable>
            {review && <Pressable accessibilityRole="button" disabled={busy} onPress={() => { setReview(false); setError(null); }} style={styles.button}><ThemedText style={styles.copy}>Back</ThemedText></Pressable>}
            <Pressable accessibilityRole="button" disabled={!valid || busy} onPress={review ? remove : () => setReview(true)} style={[styles.button, styles.danger, (!valid || busy) && styles.disabled]}>
              <ThemedText style={styles.buttonText}>{busy ? 'Removing...' : review ? 'Confirm removal' : 'Review removal'}</ThemedText>
            </Pressable>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  </Modal>;
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(15,23,42,0.5)', paddingHorizontal: 20 },
  content: { flexGrow: 1, justifyContent: 'center' },
  dialog: { backgroundColor: '#FFF', borderRadius: 18, padding: 20, width: '100%', maxWidth: 520, alignSelf: 'center' },
  title: { color: '#14243A', fontWeight: '800', fontSize: 20, marginBottom: 12 },
  copy: { color: '#334155', fontSize: 14, lineHeight: 22 },
  option: { borderWidth: 1, borderColor: '#CBD5E1', padding: 12, borderRadius: 10, marginTop: 12 },
  selected: { borderColor: '#2563EB', backgroundColor: '#EFF6FF' },
  input: { color: '#14243A', borderWidth: 1, borderColor: '#CBD5E1', borderRadius: 10, padding: 12, minHeight: 90, textAlignVertical: 'top', marginTop: 12 },
  error: { color: '#B42318', marginTop: 12 },
  actions: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'flex-end', gap: 8, marginTop: 20 },
  button: { padding: 12, minHeight: 48, borderRadius: 10, justifyContent: 'center' },
  danger: { backgroundColor: '#B42318' },
  buttonText: { color: '#FFF', fontWeight: '700' },
  disabled: { opacity: 0.5 },
});
