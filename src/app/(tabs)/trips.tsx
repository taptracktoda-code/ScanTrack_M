import { EmptyState, SegmentedControl, SummaryCard, TripCard } from '@/components';
import { Page, styles, useApi } from '@/components/page';
import { ThemedText } from '@/components/themed-text';
import { useAuth } from '@/context/auth';
import { apiService } from '@/services/api';
import { useCallback, useState } from 'react';
import { View } from 'react-native';

export default function TripsScreen() {
  const { driver } = useAuth(); const [history, setHistory] = useState(0);
  const request = useCallback(() => history ? apiService.getTripHistory() : apiService.getTodayTrips(), [history]);
  const { data, loading, error, retry, refresh, refreshing } = useApi<any>(request, []);
  const trips = data?.data || data?.trips || data || [];
  const summaryRequest = useCallback(() => apiService.getTripSummary(), []);
  const summaryState = useApi<any>(summaryRequest, {}); const summary = summaryState.data?.data || summaryState.data || {};
  return <Page title="My Trips" loading={loading} error={error} onRetry={retry} onRefresh={refresh} refreshing={refreshing}>
    <SegmentedControl options={["Today's Trips", 'Trip History']} selectedIndex={history} onValueChange={setHistory} />
    <View style={styles.grid}><SummaryCard label="Total Trips" value={summary.total_trips ?? '—'} color="green" icon="↔" /><SummaryCard label="Completed" value={summary.completed_trips ?? '—'} color="orange" icon="✓" /><SummaryCard label="Cancelled" value={summary.cancelled_trips ?? '—'} color="blue" icon="×" /></View>
    <ThemedText style={styles.sectionTitle}>{history ? 'Trip History' : "Today's Trip"}</ThemedText>
    {trips.length ? trips.map((trip: any) => <TripCard key={trip.id} tripId={trip.trip_id} status={trip.status} destination={trip.destination} passengerCount={trip.passenger_count} driver={trip.driver_name || driver?.name} departureTime={trip.departure_time} date={trip.date} />) : <EmptyState message={history ? 'No trip history found.' : 'No trips found.'} icon="↔" />}
  </Page>;
}
