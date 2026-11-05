import { AttendanceCard, AttendanceRecord, EmptyState, StatusCard } from '@/components';
import { Page, styles, useApi } from '@/components/page';
import { ThemedText } from '@/components/themed-text';
import { useAuth } from '@/context/auth';
import { apiService } from '@/services/api';
import type { AttendanceRecord as AttendanceRecordType } from '@/types';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useRef, useState } from 'react';
import { Alert, Pressable, StyleSheet, View } from 'react-native';

export default function DashboardScreen() {
  const { driver, updateDutyStatus } = useAuth();
  const router = useRouter();
  const request = useCallback(() => apiService.getDashboardData(), []);
  const { data, loading, error, retry, refresh, refreshing } = useApi<any>(request, {});
  const hasFocused = useRef(false);
  useFocusEffect(useCallback(() => {
    if (hasFocused.current) refresh();
    else hasFocused.current = true;
    const interval = setInterval(refresh, 15000);
    return () => clearInterval(interval);
  }, [refresh]));
  const dashboard = data?.data || data || {};
  const attendance = dashboard.attendance || dashboard.today_attendance || {};
  const records: AttendanceRecordType[] = dashboard.recent_records || dashboard.records || [];
  const status = attendance.status || dashboard.status || 'not_checked_in';
  const dailyPosition = getDailyPosition(dashboard, records, driver?.id, driver?.name);
  const [statusUpdating, setStatusUpdating] = useState(false);
  const [statusError, setStatusError] = useState<string | null>(null);
  const dutyStatus = driver?.duty_status || dashboard.duty_status || dashboard.driver?.duty_status || 'on_duty';
  const isOffDuty = dutyStatus === 'off_duty';
  const changeDutyStatus = () => {
    const nextStatus = isOffDuty ? 'on_duty' : 'off_duty';
    Alert.alert(nextStatus === 'off_duty' ? 'Go Off Duty?' : 'Go On Duty?', nextStatus === 'off_duty' ? 'Are you sure you want to go off duty?' : 'You will be available for attendance again.', [
      { text: 'Cancel', style: 'cancel' },
      { text: nextStatus === 'off_duty' ? 'Go Off Duty' : 'Go On Duty', onPress: async () => {
        setStatusUpdating(true);
        setStatusError(null);
        try { await updateDutyStatus(nextStatus); await refresh(); } catch { setStatusError('Unable to update your duty status. Please try again.'); } finally { setStatusUpdating(false); }
      } },
    ]);
  };
  const statusCopy: Record<string, { title: string; subtitle: string; message: string }> = {
    active: { title: 'INSIDE TERMINAL', subtitle: 'Attendance Status', message: "You're currently checked in." },
    completed: { title: 'COMPLETED', subtitle: 'Attendance Status', message: 'Your shift has been completed.' },
    off_duty: { title: 'OFF DUTY', subtitle: 'Attendance Status', message: 'You are currently off duty.' },
    not_checked_in: { title: 'NOT CHECKED IN', subtitle: 'Attendance Status', message: 'Show your QR code at the terminal scanner to begin.' },
  };
  const copy = statusCopy[status] || statusCopy.not_checked_in;

  return <Page title="" loading={loading} error={error} onRetry={retry} onRefresh={refresh} refreshing={refreshing}>
    <View style={dashStyles.greeting}><ThemedText style={dashStyles.hello}>Hello, {driver?.name?.split(' ')[0] || 'Driver'}</ThemedText><ThemedText style={styles.muted}>Welcome back!</ThemedText></View>
    <Pressable onPress={() => router.push('/my-qr')} style={({ pressed }) => [dashStyles.qrButton, pressed && { opacity: 0.85 }]}>
      <ThemedText style={dashStyles.qrButtonIcon}>▦</ThemedText>
      <View style={dashStyles.qrButtonCopy}>
        <ThemedText style={dashStyles.qrButtonTitle}>View My QR Code</ThemedText>
        <ThemedText style={dashStyles.qrButtonHint}>Show your code at the terminal</ThemedText>
      </View>
      <ThemedText style={dashStyles.qrButtonArrow}>›</ThemedText>
    </Pressable>
    <StatusCard status={status} title={copy.subtitle} subtitle={copy.title} message={copy.message} />
    <View style={dashStyles.dutyCard}>
      <View style={dashStyles.dutyHeader}><ThemedText style={dashStyles.dutyLabel}>Driver Status</ThemedText><ThemedText style={[dashStyles.dutyStatus, { color: isOffDuty ? '#64748B' : '#16A34A' }]}>{isOffDuty ? '○ Off Duty' : '● On Duty'}</ThemedText></View>
      <ThemedText style={dashStyles.dutyMessage}>{isOffDuty ? 'Attendance actions are unavailable while off duty.' : 'You are available for terminal attendance.'}</ThemedText>
      <Pressable onPress={changeDutyStatus} disabled={statusUpdating} style={({ pressed }) => [dashStyles.dutyButton, isOffDuty && dashStyles.onDutyButton, pressed && { opacity: 0.8 }, statusUpdating && { opacity: 0.55 }]}><ThemedText style={[dashStyles.dutyButtonText, isOffDuty && dashStyles.onDutyButtonText]}>{statusUpdating ? 'Updating...' : isOffDuty ? 'Go On Duty' : 'Go Off Duty'}</ThemedText></Pressable>
      {statusError ? <ThemedText style={dashStyles.statusError}>{statusError}</ThemedText> : null}
    </View>
    <View style={dashStyles.summary}><View style={dashStyles.summaryItem}><ThemedText style={dashStyles.summaryIcon}>●</ThemedText><View><ThemedText style={dashStyles.summaryLabel}>My Daily Position</ThemedText><ThemedText style={dashStyles.summaryValue}>{dailyPosition ? `#${dailyPosition}` : '—'}</ThemedText><ThemedText style={dashStyles.summaryHint}>{dailyPosition ? 'Position in the queue today' : 'Position unavailable'}</ThemedText></View></View><View style={dashStyles.divider} /><View style={dashStyles.summaryItem}><ThemedText style={dashStyles.summaryIcon}>▣</ThemedText><View><ThemedText style={dashStyles.summaryLabel}>Total Trips</ThemedText><ThemedText style={dashStyles.summaryValue}>{dashboard.total_trips ?? '—'}</ThemedText><ThemedText style={dashStyles.summaryHint}>Total trips riding</ThemedText></View></View></View>
    <ThemedText style={styles.sectionTitle}>Today&apos;s Attendance</ThemedText>
    <View style={styles.grid}><AttendanceCard label="Entry Time" value={attendance.entry_time ? new Date(attendance.entry_time).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }) : '--:-- --'} subtext={attendance.entry_time ? 'Verified by terminal' : 'Not yet recorded'} icon="↗" /><AttendanceCard label="Exit Time" value={attendance.exit_time ? new Date(attendance.exit_time).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }) : '--:-- --'} subtext={attendance.exit_time ? 'Verified by terminal' : 'Not yet recorded'} icon="↘" /></View>
    {!attendance.exit_time && attendance.entry_time ? <View style={dashStyles.notice}><ThemedText style={dashStyles.noticeText}>Please present your QR code at the terminal scanner before checking out.</ThemedText></View> : null}
    <ThemedText style={styles.sectionTitle}>Recent Records</ThemedText>
    {records.length ? records.slice(0, 4).map((record) => <AttendanceRecord key={record.id} type={record.entry_time ? 'entry' : 'exit'} date={record.date} time={record.entry_time || record.exit_time || ''} verified={record.entry_verified || record.exit_verified} />) : <EmptyState message="No attendance records found." icon="◌" />}
  </Page>;
}
const dashStyles = StyleSheet.create({
  greeting: { marginBottom: 18 },
  hello: { color: '#14243A', fontSize: 26, lineHeight: 32, fontWeight: '800', marginBottom: 4, letterSpacing: -0.4 },
  qrButton: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#1D4ED8', borderRadius: 18, padding: 16, marginBottom: 16 },
  qrButtonIcon: { width: 46, height: 46, borderRadius: 14, backgroundColor: 'rgba(255,255,255,0.16)', color: '#FFFFFF', fontSize: 25, textAlign: 'center', lineHeight: 46, marginRight: 13 },
  qrButtonCopy: { flex: 1 },
  qrButtonTitle: { color: '#FFFFFF', fontSize: 15, fontWeight: '800' },
  qrButtonHint: { color: '#DBEAFE', fontSize: 11, marginTop: 4 },
  qrButtonArrow: { color: '#FFFFFF', fontSize: 28, fontWeight: '500' },
  dutyCard: { backgroundColor: '#FFFFFF', borderRadius: 18, padding: 16, marginBottom: 16, borderWidth: 1, borderColor: '#E5EBF3' },
  dutyHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  dutyLabel: { color: '#52647B', fontSize: 13, fontWeight: '800' },
  dutyStatus: { fontSize: 13, fontWeight: '800' },
  dutyMessage: { color: '#748198', fontSize: 12, lineHeight: 18, marginTop: 9 },
  dutyButton: { backgroundColor: '#14243A', borderRadius: 12, paddingVertical: 12, alignItems: 'center', marginTop: 14 },
  dutyButtonText: { color: '#FFFFFF', fontSize: 13, fontWeight: '800' },
  onDutyButton: { backgroundColor: '#EFF6FF' },
  onDutyButtonText: { color: '#1D4ED8' },
  statusError: { color: '#B42318', fontSize: 12, marginTop: 9 },
  summary: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFFFFF', borderRadius: 18, padding: 15, marginBottom: 18, borderWidth: 1, borderColor: '#E5EBF3' },
  summaryItem: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 10 },
  summaryIcon: { width: 36, height: 36, borderRadius: 12, backgroundColor: '#EFF6FF', color: '#1D4ED8', fontSize: 17, textAlign: 'center', lineHeight: 36 },
  summaryLabel: { color: '#748198', fontSize: 10, fontWeight: '700' },
  summaryValue: { color: '#14243A', fontSize: 19, fontWeight: '800', marginTop: 3 },
  summaryHint: { color: '#8A96A8', fontSize: 9, marginTop: 3 },
  divider: { width: 1, height: 48, backgroundColor: '#E5EBF3', marginHorizontal: 10 },
  notice: { backgroundColor: '#EFF6FF', borderRadius: 14, padding: 13, marginTop: 2, borderWidth: 1, borderColor: '#DBEAFE' },
  noticeText: { color: '#1E40AF', fontSize: 12, lineHeight: 18 },
});
function getDailyPosition(dashboard: any, records: AttendanceRecordType[], driverId?: string, driverName?: string) {
  const suppliedPosition = dashboard.daily_position ?? dashboard.queue_position ?? dashboard.position ?? dashboard.rank;
  if (typeof suppliedPosition === 'number' && suppliedPosition > 0) return suppliedPosition;

  const queue = dashboard.daily_queue || dashboard.queue || dashboard.drivers || dashboard.active_drivers;
  if (Array.isArray(queue)) {
    const orderedQueue = [...queue].sort((left, right) => {
      const leftTime = new Date(left.entry_time || left.timestamp || left.created_at || 0).getTime();
      const rightTime = new Date(right.entry_time || right.timestamp || right.created_at || 0).getTime();
      return leftTime - rightTime;
    });
    const index = orderedQueue.findIndex((item) => String(item.id || item.driver_id || item.driver?.id) === String(driverId) || (driverName && String(item.name || item.driver_name || item.driver?.name).toLowerCase() === driverName.toLowerCase()));
    if (index >= 0) return index + 1;
  }

  const today = new Date().toDateString();
  const todayEntries = records.filter((record) => record.entry_time && new Date(record.entry_time).toDateString() === today).sort((left, right) => new Date(left.entry_time || 0).getTime() - new Date(right.entry_time || 0).getTime());
  const ownEntry = todayEntries.findIndex((record) => String(record.driver_id) === String(driverId));
  return ownEntry >= 0 ? ownEntry + 1 : undefined;
}
