import { SummaryCard } from '@/components/summary-card';
import { ErrorState } from '@/components/error-state';
import { styles, useApi } from '@/components/page';
import { ThemedText } from '@/components/themed-text';
import { useAuth } from '@/context/auth';
import { useQueueRefresh } from '@/hooks/use-queue-refresh';
import { apiService } from '@/services/api';
import { philippineDate, shiftDate } from '@/utils/philippineDate';
import { useCallback, useState } from 'react';
import { ActivityIndicator, Pressable, TextInput, View } from 'react-native';

export function DailyManagerReport() {
  const { isManager } = useAuth();
  return isManager ? <ManagerReport /> : null;
}

function ManagerReport() {
  const [date, setDate] = useState(philippineDate);
  const [input, setInput] = useState(date);
  const [dateError, setDateError] = useState<string | null>(null);
  const request = useCallback(() => apiService.getDailyManagerReport(date), [date]);
  const { data, loading, error, retry, refresh, refreshing } = useApi<any>(request, {});
  useQueueRefresh(refresh);
  const report = data?.data;
  const changeDate = (value: string) => { setDate(value); setInput(value); setDateError(null); };
  const applyDate = () => {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(input) || Number.isNaN(new Date(`${input}T00:00:00Z`).getTime()) || new Date(`${input}T00:00:00Z`).toISOString().slice(0, 10) !== input) {
      setDateError('Enter a valid date as YYYY-MM-DD.'); return;
    }
    changeDate(input);
  };
  return <View style={styles.card}>
    <ThemedText style={[styles.sectionTitle, { marginTop: 0 }]}>Daily Manager Reports</ThemedText>
    <ThemedText style={styles.muted}>Day boundaries use Philippine time (Asia/Manila).</ThemedText>
    <View style={[styles.row, { marginVertical: 12 }]}>
      <Pressable accessibilityRole="button" accessibilityLabel="Previous report date" onPress={() => changeDate(shiftDate(date, -1))} style={{ padding: 12 }}><ThemedText>Previous</ThemedText></Pressable>
      <TextInput accessibilityLabel="Report date YYYY-MM-DD" value={input} onChangeText={setInput} placeholder="YYYY-MM-DD" style={{ color: '#14243A', borderWidth: 1, borderColor: '#CBD5E1', borderRadius: 8, padding: 10, minWidth: 120 }} />
      <Pressable accessibilityRole="button" accessibilityLabel="Next report date" onPress={() => changeDate(shiftDate(date, 1))} style={{ padding: 12 }}><ThemedText>Next</ThemedText></Pressable>
      <Pressable accessibilityRole="button" onPress={applyDate} style={{ padding: 12 }}><ThemedText>View date</ThemedText></Pressable>
    </View>
    {dateError && <ThemedText style={{ color: '#B42318' }}>{dateError}</ThemedText>}
    {loading ? <ActivityIndicator /> : error ? <ErrorState message={error} onRetry={retry} /> : report && <>
      <ThemedText style={styles.muted}>Report for {report.date}</ThemedText>
      <View style={styles.grid}>
        {([
          ['Completed Trips', 'completed_trips'], ['Passengers', 'passenger_total'],
          ['Unique Drivers Checked In', 'unique_drivers_checked_in'], ['Entry Events', 'entry_events'],
          ['Exit Events', 'exit_events'], ['Queue Removals', 'queue_removals'],
        ] as const).map(([label, key]) => <SummaryCard key={key} label={label} value={report[key] ?? 0} color="blue" icon="•" />)}
      </View>
      <ThemedText style={[styles.muted, { marginTop: 12 }]}>Attendance counts each driver once per day. Entry and exit events count individual records. Passengers include only trips completed that day.</ThemedText>
      {['completed_trips', 'entry_events', 'exit_events', 'queue_removals'].every(key => report[key] === 0) && <ThemedText style={styles.muted}>No activity recorded for this date.</ThemedText>}
    </>}
    <Pressable accessibilityRole="button" disabled={refreshing} onPress={refresh} style={{ paddingVertical: 14 }}><ThemedText>{refreshing ? 'Refreshing report...' : 'Refresh report'}</ThemedText></Pressable>
  </View>;
}
