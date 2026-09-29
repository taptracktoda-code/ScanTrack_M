import { AttendanceCard, AttendanceRecord, DateSelector, EmptyState, SegmentedControl, SummaryCard } from '@/components';
import { Page, styles, useApi } from '@/components/page';
import { ThemedText } from '@/components/themed-text';
import { apiService } from '@/services/api';
import { getDateString } from '@/utils/dateFormatter';
import { useCallback, useState } from 'react';
import { View } from 'react-native';

export default function AttendanceScreen() {
  const [mode, setMode] = useState(0); const [date, setDate] = useState(new Date());
  const request = useCallback(() => apiService.getAttendanceByDate(getDateString(date)), [date]); const daily = useApi<any>(request, {});
  const monthlyRequest = useCallback(() => apiService.getMonthlyAttendance(date.getFullYear(), date.getMonth() + 1), [date]); const monthly = useApi<any>(monthlyRequest, {});
  const summaryRequest = useCallback(() => apiService.getAttendanceSummary(), []); const summary = useApi<any>(summaryRequest, {});
  const state = mode === 0 ? daily : mode === 1 ? monthly : summary; const payload = state.data?.data || state.data || {};
  const shift = (amount: number) => { const next = new Date(date); next.setDate(next.getDate() + amount); setDate(next); };
  return <Page title="My Attendance" loading={state.loading} error={state.error} onRetry={state.retry} onRefresh={state.refresh} refreshing={state.refreshing}>
    <SegmentedControl options={['Daily', 'Monthly', 'Summary']} selectedIndex={mode} onValueChange={setMode} />
    {mode === 0 ? <><DateSelector date={date} onPrevious={() => shift(-1)} onNext={() => shift(1)} label="Attendance date" /><View style={styles.card}><View style={styles.grid}><AttendanceCard label="Entry Time" value={payload.entry_time ? new Date(payload.entry_time).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }) : '--:-- --'} subtext={payload.entry_time ? getDateString(date) : 'Not yet recorded'} icon="↗" /><AttendanceCard label="Exit Time" value={payload.exit_time ? new Date(payload.exit_time).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }) : '--:-- --'} subtext={payload.exit_time ? getDateString(date) : 'Not yet recorded'} icon="↘" /></View>{!payload.exit_time && payload.entry_time ? <ThemedText style={{ color: '#856404', fontSize: 12, marginTop: 10 }}>Please present your QR code at the terminal scanner before checking out.</ThemedText> : null}</View><ThemedText style={styles.sectionTitle}>Attendance History</ThemedText>{(payload.history || []).length ? payload.history.map((item: any) => <AttendanceRecord key={item.id} type="entry" date={item.date} time={item.entry_time} verified={item.entry_verified} />) : <EmptyState message="No attendance records found." icon="◌" />}</> : <><ThemedText style={styles.sectionTitle}>{mode === 1 ? 'Monthly Attendance' : 'Attendance Summary'}</ThemedText><View style={styles.grid}><SummaryCard label="Present" value={payload.present_days ?? payload.total_attendance ?? '—'} color="green" icon="✓" /><SummaryCard label="Absent" value={payload.absent_days ?? payload.total_absences ?? '—'} color="red" icon="×" /></View><View style={[styles.grid, { marginTop: 10 }]}><SummaryCard label="Late" value={payload.late_records ?? payload.total_late ?? '—'} color="orange" icon="!" /><SummaryCard label="Work Hours" value={payload.total_work_hours != null ? `${payload.total_work_hours}h` : '—'} color="blue" icon="◷" /></View></>}
  </Page>;
}
