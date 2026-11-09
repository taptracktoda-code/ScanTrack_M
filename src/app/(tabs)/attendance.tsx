import { AttendanceCard, AttendanceRecord, DateSelector, EmptyState, SegmentedControl, SummaryCard } from '@/components';
import { Page, styles, useApi } from '@/components/page';
import { DailyManagerReport } from '@/components/daily-manager-report';
import { useAuth } from '@/context/auth';
import { ThemedText } from '@/components/themed-text';
import { apiService } from '@/services/api';
import { getDateString } from '@/utils/dateFormatter';
import { useFocusEffect } from 'expo-router';
import { useCallback, useRef, useState } from 'react';
import { View } from 'react-native';

export default function AttendanceScreen() {
  const { isManager } = useAuth();
  return isManager ? <ManagerAttendanceScreen /> : <DriverAttendanceScreen />;
}

function ManagerAttendanceScreen() {
  return <Page title="Attendance">
    <View style={styles.card}>
      <ThemedText style={[styles.sectionTitle, { marginTop: 0 }]}>My Attendance</ThemedText>
      <ThemedText style={styles.muted}>Personal attendance is recorded for driver accounts. Your TODA&apos;s daily report is below.</ThemedText>
    </View>
    <DailyManagerReport />
  </Page>;
}

function DriverAttendanceScreen() {
  const [mode, setMode] = useState(0); const [date, setDate] = useState(new Date());
  const request = useCallback(() => mode === 0 ? apiService.getAttendanceByDate(getDateString(date)) : Promise.resolve({}), [date, mode]); const daily = useApi<any>(request, {});
  const monthlyRequest = useCallback(() => mode === 1 ? apiService.getMonthlyAttendance(date.getFullYear(), date.getMonth() + 1) : Promise.resolve({}), [date, mode]); const monthly = useApi<any>(monthlyRequest, {});
  const summaryRequest = useCallback(() => mode === 2 ? apiService.getAttendanceSummary() : Promise.resolve({}), [mode]); const summary = useApi<any>(summaryRequest, {});
  const state = mode === 0 ? daily : mode === 1 ? monthly : summary; const payload = state.data?.data || state.data || {};
  const hasFocused = useRef(false);
  const refreshActive = state.refresh;
  useFocusEffect(useCallback(() => {
    if (hasFocused.current) refreshActive();
    else hasFocused.current = true;
    const interval = setInterval(refreshActive, 15000);
    return () => clearInterval(interval);
  }, [refreshActive]));
  const shift = (amount: number) => { const next = new Date(date); next.setDate(next.getDate() + amount); setDate(next); };
  return <Page title="My Attendance" loading={state.loading} error={state.error} onRetry={state.retry} onRefresh={state.refresh} refreshing={state.refreshing}>
    <SegmentedControl options={['Daily', 'Monthly', 'Summary']} selectedIndex={mode} onValueChange={setMode} />
    {mode === 0 ? <><DateSelector date={date} onPrevious={() => shift(-1)} onNext={() => shift(1)} label="Attendance date" /><View style={styles.card}><View style={styles.grid}><AttendanceCard label="Entry Time" value={payload.entry_time ? new Date(payload.entry_time).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }) : '--:-- --'} subtext={payload.entry_time ? getDateString(date) : 'Not yet recorded'} icon="↗" /><AttendanceCard label="Exit Time" value={payload.exit_time ? new Date(payload.exit_time).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }) : '--:-- --'} subtext={payload.exit_time ? getDateString(date) : 'Not yet recorded'} icon="↘" /></View>{!payload.exit_time && payload.entry_time ? <ThemedText style={{ color: '#856404', fontSize: 12, marginTop: 10 }}>Please present your QR code at the terminal scanner before checking out.</ThemedText> : null}</View><ThemedText style={styles.sectionTitle}>Attendance History</ThemedText>{(payload.history || []).length ? payload.history.map((item: any) => <AttendanceRecord key={item.id} type="entry" date={item.date} time={item.entry_time} verified={item.entry_verified} />) : <EmptyState message="No attendance records found." icon="◌" />}</> : <><ThemedText style={styles.sectionTitle}>{mode === 1 ? 'Monthly Attendance' : 'Attendance Summary'}</ThemedText><View style={styles.grid}><SummaryCard label="Present" value={payload.present_days ?? payload.total_attendance ?? '—'} color="green" icon="✓" /><SummaryCard label="Absent" value={payload.absent_days ?? payload.total_absences ?? '—'} color="red" icon="×" /></View><View style={[styles.grid, { marginTop: 10 }]}><SummaryCard label="Late" value={payload.late_records ?? payload.total_late ?? '—'} color="orange" icon="!" /><SummaryCard label="Work Hours" value={payload.total_work_hours != null ? `${payload.total_work_hours}h` : '—'} color="blue" icon="◷" /></View></>}
  </Page>;
}
