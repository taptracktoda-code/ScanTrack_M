import { DateSelector, EmptyState } from '@/components';
import { Page, styles, useApi } from '@/components/page';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { apiService } from '@/services/api';
import type { OrganizationEvent } from '@/types/schedule';
import { getDateString } from '@/utils/dateFormatter';
import { useCallback, useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';

function eventList(response: any): OrganizationEvent[] {
  const items = response?.data;
  return Array.isArray(items) ? items : Array.isArray(response) ? response : [];
}

function formatEventTime(value: string) {
  const [hourText, minuteText] = value.split(':');
  const date = new Date();
  date.setHours(Number(hourText), Number(minuteText), 0, 0);
  return date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
}

function EventCard({ event }: { event: OrganizationEvent }) {
  return (
    <ThemedView style={eventStyles.card}>
      <ThemedText style={eventStyles.title}>{event.title}</ThemedText>
      <ThemedText style={eventStyles.meta}>
        {formatEventTime(event.start_time)} – {formatEventTime(event.end_time)}
      </ThemedText>
      <View style={eventStyles.detailRow}>
        <ThemedText style={eventStyles.detailLabel}>Location</ThemedText>
        <ThemedText style={eventStyles.detailValue}>{event.location}</ThemedText>
      </View>
      {event.description ? <ThemedText style={eventStyles.description}>{event.description}</ThemedText> : null}
    </ThemedView>
  );
}

export default function ScheduleScreen() {
  const [date, setDate] = useState(new Date());
  const dateString = getDateString(date);
  const request = useCallback(() => apiService.getScheduleByDate(dateString), [dateString]);
  const {
    data: selectedResponse,
    loading,
    error,
    retry,
    refresh,
    refreshing,
  } = useApi(request, {});
  const upcomingRequest = useCallback(() => apiService.getUpcomingSchedule(), []);
  const upcomingState = useApi(upcomingRequest, {});
  const selectedEvents = useMemo(() => eventList(selectedResponse), [selectedResponse]);
  const upcomingEvents = useMemo(() => eventList(upcomingState.data), [upcomingState.data]);
  const today = dateString === getDateString(new Date());

  const shift = (amount: number) => {
    const next = new Date(date);
    next.setDate(next.getDate() + amount);
    setDate(next);
  };
  const refreshSchedules = () => {
    refresh();
    upcomingState.refresh();
  };

  return (
    <Page
      title="My Schedule"
      loading={loading}
      error={error}
      onRetry={retry}
      onRefresh={refreshSchedules}
      refreshing={refreshing || upcomingState.refreshing}
    >
      <DateSelector date={date} onPrevious={() => shift(-1)} onNext={() => shift(1)} label="Selected date" />
      <ThemedText style={styles.sectionTitle}>{today ? "Today's events" : 'Events on selected date'}</ThemedText>
      {selectedEvents.length ? (
        selectedEvents.map((event) => <EventCard key={event.id} event={event} />)
      ) : (
        <EmptyState message="No events are scheduled for this date." icon="□" />
      )}

      <ThemedText style={styles.sectionTitle}>Upcoming events</ThemedText>
      {upcomingState.error ? (
        <ThemedText style={eventStyles.error}>{upcomingState.error}</ThemedText>
      ) : upcomingState.loading ? (
        <ThemedText style={eventStyles.meta}>Loading upcoming events...</ThemedText>
      ) : upcomingEvents.length ? (
        upcomingEvents.map((event) => (
          <View key={`upcoming-${event.id}`}>
            <ThemedText style={eventStyles.date}>
              {event.event_date.slice(0, 10)}
            </ThemedText>
            <EventCard event={event} />
          </View>
        ))
      ) : (
        <EmptyState message="No upcoming events." icon="□" />
      )}
    </Page>
  );
}

const eventStyles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E5EBF3',
  },
  title: { color: '#172A43', fontSize: 16, fontWeight: '800' },
  meta: { color: '#1D4ED8', fontSize: 14, fontWeight: '800', marginTop: 8 },
  date: { color: '#64748B', fontSize: 12, fontWeight: '700', marginBottom: 2, marginTop: 4 },
  detailRow: { flexDirection: 'row', justifyContent: 'space-between', gap: 12, marginTop: 12 },
  detailLabel: { color: '#748198', fontSize: 12 },
  detailValue: { color: '#23354D', fontSize: 12, fontWeight: '700', flexShrink: 1, textAlign: 'right' },
  description: { color: '#526176', fontSize: 13, lineHeight: 19, marginTop: 10 },
  error: { color: '#B91C1C', fontSize: 13, lineHeight: 19, marginBottom: 10 },
});
