import { DateSelector, EmptyState, ScheduleCard } from '@/components';
import { Page, styles, useApi } from '@/components/page';
import { ThemedText } from '@/components/themed-text';
import { apiService } from '@/services/api';
import { getDateString } from '@/utils/dateFormatter';
import { useCallback, useState } from 'react';

export default function ScheduleScreen() {
  const [date, setDate] = useState(new Date());
  const request = useCallback(() => apiService.getScheduleByDate(getDateString(date)), [date]);
  const { data, loading, error, retry, refresh, refreshing } = useApi<any>(request, {});
  const schedule = data?.data || data || {}; const today = schedule.today || schedule.schedule || schedule;
  const upcomingRequest = useCallback(() => apiService.getUpcomingSchedule(), []); const upcomingState = useApi<any>(upcomingRequest, []); const upcoming = upcomingState.data?.data || upcomingState.data || [];
  const shift = (amount: number) => { const next = new Date(date); next.setDate(next.getDate() + amount); setDate(next); };
  return <Page title="My Schedule" loading={loading} error={error} onRetry={retry} onRefresh={refresh} refreshing={refreshing}>
    <DateSelector date={date} onPrevious={() => shift(-1)} onNext={() => shift(1)} label="Selected date" />
    <ThemedText style={styles.sectionTitle}>Today's Schedule</ThemedText>
    {today?.id ? <ScheduleCard date={today.date} startTime={today.start_time} endTime={today.end_time} unitId={today.vehicle_number} terminal={today.terminal_name} status={today.status} isToday /> : <EmptyState message="No schedule available." icon="□" />}
    <ThemedText style={styles.sectionTitle}>Upcoming Schedule</ThemedText>
    {upcoming.length ? upcoming.map((item: any) => <ScheduleCard key={item.id} date={item.date} startTime={item.start_time} endTime={item.end_time} unitId={item.vehicle_number} terminal={item.terminal_name} status={item.status || 'upcoming'} />) : <EmptyState message="No upcoming schedule." icon="□" />}
  </Page>;
}
