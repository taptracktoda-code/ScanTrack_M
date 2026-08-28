import { AttendanceCard, AttendanceRecord, EmptyState, StatusCard } from '@/components';
import { Page, styles, useApi } from '@/components/page';
import { ThemedText } from '@/components/themed-text';
import { useAuth } from '@/context/auth';
import { apiService } from '@/services/api';
import type { AttendanceRecord as AttendanceRecordType } from '@/types';
import { useCallback } from 'react';
import { StyleSheet, View } from 'react-native';

export default function DashboardScreen() {
  const { driver } = useAuth();
  const request = useCallback(() => apiService.getDashboardData(), []);
  const { data, loading, error, retry, refresh, refreshing } = useApi<any>(request, {});
  const dashboard = data?.data || data || {};
  const attendance = dashboard.attendance || dashboard.today_attendance || {};
  const records: AttendanceRecordType[] = dashboard.recent_records || dashboard.records || [];
  const status = attendance.status || dashboard.status || 'not_checked_in';
  const statusCopy: Record<string, { title: string; subtitle: string; message: string }> = {
    active: { title: 'INSIDE TERMINAL', subtitle: 'Attendance Status', message: "You're currently checked in." },
    completed: { title: 'COMPLETED', subtitle: 'Attendance Status', message: 'Your shift has been completed.' },
    off_duty: { title: 'OFF DUTY', subtitle: 'Attendance Status', message: 'You are currently off duty.' },
    not_checked_in: { title: 'NOT CHECKED IN', subtitle: 'Attendance Status', message: 'Tap your card at the terminal scanner to begin.' },
  };
  const copy = statusCopy[status] || statusCopy.not_checked_in;

  return <Page title="" loading={loading} error={error} onRetry={retry} onRefresh={refresh} refreshing={refreshing}>
    <View style={dashStyles.greeting}><ThemedText style={dashStyles.hello}>Hello, {driver?.name?.split(' ')[0] || 'Driver'}</ThemedText><ThemedText style={styles.muted}>Welcome back!</ThemedText></View>
    <StatusCard status={status} title={copy.subtitle} subtitle={copy.title} message={copy.message} />
    <View style={dashStyles.summary}><View style={dashStyles.summaryItem}><ThemedText style={dashStyles.summaryIcon}>●</ThemedText><View><ThemedText style={dashStyles.summaryLabel}>My Daily Position</ThemedText><ThemedText style={dashStyles.summaryValue}>{dashboard.daily_position ? `#${dashboard.daily_position}` : '—'}</ThemedText><ThemedText style={dashStyles.summaryHint}>You are in top line</ThemedText></View></View><View style={dashStyles.divider} /><View style={dashStyles.summaryItem}><ThemedText style={dashStyles.summaryIcon}>▣</ThemedText><View><ThemedText style={dashStyles.summaryLabel}>Total Trips</ThemedText><ThemedText style={dashStyles.summaryValue}>{dashboard.total_trips ?? '—'}</ThemedText><ThemedText style={dashStyles.summaryHint}>Total trips riding</ThemedText></View></View></View>
    <ThemedText style={styles.sectionTitle}>Today's Attendance</ThemedText>
    <View style={styles.grid}><AttendanceCard label="Entry Time" value={attendance.entry_time ? new Date(attendance.entry_time).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }) : '--:-- --'} subtext={attendance.entry_time ? 'Verified by terminal' : 'Not yet recorded'} icon="↗" /><AttendanceCard label="Exit Time" value={attendance.exit_time ? new Date(attendance.exit_time).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }) : '--:-- --'} subtext={attendance.exit_time ? 'Verified by terminal' : 'Not yet recorded'} icon="↘" /></View>
    {!attendance.exit_time && attendance.entry_time ? <View style={dashStyles.notice}><ThemedText style={dashStyles.noticeText}>Please tap your NFC card at the terminal scanner before checking out.</ThemedText></View> : null}
    <ThemedText style={styles.sectionTitle}>Recent Records</ThemedText>
    {records.length ? records.slice(0, 4).map((record) => <AttendanceRecord key={record.id} type={record.entry_time ? 'entry' : 'exit'} date={record.date} time={record.entry_time || record.exit_time || ''} verified={record.entry_verified || record.exit_verified} />) : <EmptyState message="No attendance records found." icon="◌" />}
  </Page>;
}
const dashStyles = StyleSheet.create({ greeting: { marginBottom: 14 }, hello: { color: '#1D1D1F', fontSize: 17, fontWeight: '800', marginBottom: 2 }, summary: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F0F0F0', borderRadius: 15, padding: 12, marginBottom: 18 }, summaryItem: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8 }, summaryIcon: { width: 34, height: 34, borderRadius: 10, backgroundColor: '#E5C8F4', color: '#111', fontSize: 18, textAlign: 'center', lineHeight: 34 }, summaryLabel: { color: '#5A5A5A', fontSize: 8 }, summaryValue: { color: '#222', fontSize: 16, fontWeight: '800', marginTop: 2 }, summaryHint: { color: '#777', fontSize: 7, marginTop: 2 }, divider: { width: 1, height: 42, backgroundColor: '#C8C8C8', marginHorizontal: 8 }, notice: { backgroundColor: '#EEF7FF', borderRadius: 12, padding: 10, marginTop: 2 }, noticeText: { color: '#58718A', fontSize: 10, lineHeight: 15 } });
