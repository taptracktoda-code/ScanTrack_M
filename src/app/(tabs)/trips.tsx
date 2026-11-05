import { EmptyState, SegmentedControl, SummaryCard, TripCard } from '@/components';
import { Page, styles, useApi } from '@/components/page';
import { ThemedText } from '@/components/themed-text';
import { useAuth } from '@/context/auth';
import { apiService } from '@/services/api';
import type { Trip, TripDestination, TripSummary } from '@/types';
import { useFocusEffect } from 'expo-router';
import { useCallback, useRef, useState } from 'react';
import { Alert, KeyboardTypeOptions, Pressable, StyleSheet, TextInput, View } from 'react-native';

interface TripListResponse {
  data?: { trips?: Trip[] };
}

interface ActiveTripResponse {
  data?: Trip | null;
}

interface TripSummaryResponse {
  data?: Partial<TripSummary>;
}

interface TripDestinationsResponse {
  data?: { destinations?: TripDestination[] };
}

function formatTime(value?: string) {
  if (!value) return undefined;
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? value
    : date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
}

function getRequestErrorMessage(error: unknown) {
  if (typeof error !== 'object' || error === null) {
    return error instanceof Error ? error.message : 'Unable to update the trip. Please try again.';
  }

  const response = (error as {
    response?: {
      data?: {
        message?: string;
        errors?: Record<string, string | string[]>;
      };
    };
  }).response;
  const validationMessages = Object.values(response?.data?.errors || {}).flat();

  return validationMessages.join(' ') ||
    response?.data?.message ||
    (error instanceof Error ? error.message : 'Unable to update the trip. Please try again.');
}

function FormField({
  label,
  value,
  onChangeText,
  placeholder,
  keyboardType,
}: {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  placeholder: string;
  keyboardType?: KeyboardTypeOptions;
}) {
  return (
    <View style={tripStyles.field}>
      <ThemedText style={tripStyles.fieldLabel}>{label}</ThemedText>
      <TextInput
        accessibilityLabel={label}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor="#8793A5"
        keyboardType={keyboardType}
        style={tripStyles.input}
      />
    </View>
  );
}

export default function TripsScreen() {
  const { driver } = useAuth();
  const [history, setHistory] = useState(0);
  const [destinationId, setDestinationId] = useState<number | null>(null);
  const [passengerCount, setPassengerCount] = useState('1');
  const [saving, setSaving] = useState(false);
  const [completing, setCompleting] = useState(false);
  const hasFocused = useRef(false);

  const listRequest = useCallback(
    () => history ? apiService.getTripHistory() : apiService.getTodayTrips(),
    [history],
  );
  const listState = useApi<TripListResponse>(listRequest, {});
  const activeRequest = useCallback(() => apiService.getActiveTrip(), []);
  const activeState = useApi<ActiveTripResponse>(activeRequest, {});
  const summaryRequest = useCallback(() => apiService.getTripSummary(), []);
  const summaryState = useApi<TripSummaryResponse>(summaryRequest, {});
  const destinationsRequest = useCallback(() => apiService.getDriverTripDestinations(), []);
  const destinationsState = useApi<TripDestinationsResponse>(destinationsRequest, {});
  const refreshList = listState.refresh;
  const refreshActive = activeState.refresh;
  const refreshSummary = summaryState.refresh;
  const refreshDestinations = destinationsState.refresh;
  const retryList = listState.retry;
  const retryActive = activeState.retry;
  const retrySummary = summaryState.retry;
  const retryDestinations = destinationsState.retry;

  const refreshAll = useCallback(() => {
    void refreshList();
    void refreshActive();
    void refreshSummary();
    void refreshDestinations();
  }, [refreshActive, refreshDestinations, refreshList, refreshSummary]);

  useFocusEffect(useCallback(() => {
    if (hasFocused.current) refreshAll();
    else hasFocused.current = true;

    const interval = setInterval(refreshAll, 10000);
    return () => clearInterval(interval);
  }, [refreshAll]));

  const trips = listState.data.data?.trips || [];
  const activeTrip = activeState.data.data || null;
  const visibleTrips = trips.filter((trip) => trip.trip_id !== activeTrip?.trip_id);
  const summary = summaryState.data.data || {};
  const destinations = destinationsState.data.data?.destinations || [];
  const selectedDestination = destinations.find((destination) => destination.id === destinationId);
  const error = listState.error || activeState.error || summaryState.error || destinationsState.error;
  const retry = useCallback(() => {
    void retryList();
    void retryActive();
    void retrySummary();
    void retryDestinations();
  }, [retryActive, retryDestinations, retryList, retrySummary]);

  const startTrip = async () => {
    const passengers = Number(passengerCount);
    if (!selectedDestination || !Number.isInteger(passengers) || passengers < 1) {
      Alert.alert('Check trip details', 'Choose an available destination and enter at least 1 passenger.');
      return;
    }

    setSaving(true);
    try {
      await apiService.startTrip(selectedDestination.id, passengers);
      setDestinationId(null);
      setPassengerCount('1');
      refreshAll();
      Alert.alert('Trip started', 'Your trip has been recorded.');
    } catch (requestError) {
      Alert.alert('Unable to start trip', getRequestErrorMessage(requestError));
    } finally {
      setSaving(false);
    }
  };

  const completeTrip = async () => {
    if (!activeTrip) return;

    setCompleting(true);
    try {
      await apiService.completeTrip(activeTrip.trip_id);
      refreshAll();
      Alert.alert('Trip completed', 'Your trip has been marked as completed.');
    } catch (requestError) {
      Alert.alert('Unable to complete trip', getRequestErrorMessage(requestError));
    } finally {
      setCompleting(false);
    }
  };

  const confirmCompleteTrip = () => Alert.alert(
    'Complete this trip?',
    'This records the trip arrival time and lets you start another trip.',
    [
      { text: 'Keep Trip Active', style: 'cancel' },
      { text: 'Complete Trip', onPress: () => { void completeTrip(); } },
    ],
  );

  return (
    <Page
      title="My Trips"
      loading={listState.loading || activeState.loading || destinationsState.loading}
      error={error}
      onRetry={retry}
      onRefresh={refreshAll}
      refreshing={listState.refreshing || activeState.refreshing || summaryState.refreshing}
    >
      <ThemedText style={tripStyles.liveHint}>Trip updates refresh every 10 seconds while this screen is open.</ThemedText>
      <View style={styles.grid}>
        <SummaryCard label="Total Trips" value={summary.total_trips ?? '—'} color="green" icon="↔" />
        <SummaryCard label="Completed" value={summary.completed_trips ?? '—'} color="blue" icon="✓" />
      </View>
      <View style={[styles.grid, tripStyles.summarySecondRow]}>
        <SummaryCard label="In Progress" value={summary.in_progress_trips ?? '—'} color="orange" icon="◷" />
        <SummaryCard label="Cancelled" value={summary.cancelled_trips ?? '—'} color="red" icon="×" />
      </View>

      {activeTrip ? (
        <View style={tripStyles.activeSection}>
          <ThemedText style={styles.sectionTitle}>Active Trip</ThemedText>
          <TripCard
            tripId={activeTrip.trip_id}
            status={activeTrip.status}
            destination={activeTrip.destination}
            passengerCount={activeTrip.passenger_count}
            driver={driver?.name}
            departureTime={formatTime(activeTrip.departure_time)}
            date={activeTrip.date}
          />
          <Pressable
            accessibilityRole="button"
            onPress={confirmCompleteTrip}
            disabled={completing}
            style={({ pressed }) => [tripStyles.completeButton, pressed && tripStyles.pressed, completing && tripStyles.disabled]}
          >
            <ThemedText style={tripStyles.completeButtonText}>{completing ? 'Completing...' : 'Complete Trip'}</ThemedText>
          </Pressable>
        </View>
      ) : (
        <View style={tripStyles.startCard}>
          <ThemedText style={tripStyles.cardTitle}>Start a Trip</ThemedText>
          <ThemedText style={tripStyles.cardHint}>Choose a destination configured by your manager and enter the passenger count.</ThemedText>
          <ThemedText style={tripStyles.fieldLabel}>Destination</ThemedText>
          {destinations.length ? destinations.map((destination) => (
            <Pressable
              accessibilityRole="radio"
              accessibilityState={{ selected: destination.id === destinationId }}
              key={destination.id}
              onPress={() => setDestinationId(destination.id)}
              style={[tripStyles.destinationOption, destination.id === destinationId && tripStyles.destinationOptionSelected]}
            >
              <ThemedText style={[tripStyles.destinationText, destination.id === destinationId && tripStyles.destinationTextSelected]}>
                {destination.name}
              </ThemedText>
              {destination.id === destinationId ? <ThemedText style={tripStyles.selectedMark}>Selected</ThemedText> : null}
            </Pressable>
          )) : (
            <ThemedText style={tripStyles.noDestinations}>
              No destinations are available. Ask your manager to add destinations for your TODA.
            </ThemedText>
          )}
          <FormField
            label="Passengers"
            value={passengerCount}
            onChangeText={setPassengerCount}
            placeholder="1"
            keyboardType="number-pad"
          />
          <Pressable
            accessibilityRole="button"
            onPress={() => { void startTrip(); }}
            disabled={saving || !selectedDestination}
            style={({ pressed }) => [tripStyles.startButton, pressed && tripStyles.pressed, (saving || !selectedDestination) && tripStyles.disabled]}
          >
            <ThemedText style={tripStyles.startButtonText}>{saving ? 'Starting...' : 'Start Trip'}</ThemedText>
          </Pressable>
        </View>
      )}

      <SegmentedControl options={["Today's Trips", 'Trip History']} selectedIndex={history} onValueChange={setHistory} />
      <ThemedText style={styles.sectionTitle}>{history ? 'Trip History' : "Today's Trips"}</ThemedText>
      {visibleTrips.length ? visibleTrips.map((trip) => (
        <TripCard
          key={trip.trip_id || trip.id}
          tripId={trip.trip_id}
          status={trip.status}
          destination={trip.destination}
          passengerCount={trip.passenger_count}
          driver={trip.driver_name || driver?.name}
          departureTime={formatTime(trip.departure_time)}
          arrivalTime={formatTime(trip.arrival_time)}
          date={trip.date}
        />
      )) : <EmptyState message={history ? 'No trip history found.' : 'No trips recorded today.'} icon="↔" />}
    </Page>
  );
}

const tripStyles = StyleSheet.create({
  liveHint: { color: '#748198', fontSize: 11, marginBottom: 12 },
  summarySecondRow: { marginTop: 10, marginBottom: 8 },
  activeSection: { marginBottom: 16 },
  startCard: { backgroundColor: '#FFFFFF', borderRadius: 18, padding: 16, marginBottom: 18, borderWidth: 1, borderColor: '#E5EBF3' },
  cardTitle: { color: '#172A43', fontSize: 17, fontWeight: '800' },
  cardHint: { color: '#748198', fontSize: 12, marginTop: 5 },
  field: { marginTop: 14 },
  fieldLabel: { color: '#33404D', fontSize: 12, fontWeight: '700', marginBottom: 7 },
  destinationOption: { minHeight: 46, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderWidth: 1, borderColor: '#DFE6ED', borderRadius: 12, paddingHorizontal: 13, marginTop: 8, backgroundColor: '#F8FAFC' },
  destinationOptionSelected: { borderColor: '#208AEF', backgroundColor: '#EFF6FF' },
  destinationText: { color: '#33404D', fontSize: 14, fontWeight: '600' },
  destinationTextSelected: { color: '#1D4ED8', fontWeight: '800' },
  selectedMark: { color: '#1D4ED8', fontSize: 11, fontWeight: '800' },
  noDestinations: { color: '#A16207', fontSize: 12, lineHeight: 18, marginTop: 8, padding: 12, backgroundColor: '#FFFBEB', borderRadius: 12 },
  input: { height: 48, backgroundColor: '#F8FAFC', borderWidth: 1, borderColor: '#DFE6ED', borderRadius: 12, paddingHorizontal: 13, fontSize: 14, color: '#14212B' },
  startButton: { height: 50, borderRadius: 13, backgroundColor: '#208AEF', alignItems: 'center', justifyContent: 'center', marginTop: 18 },
  startButtonText: { color: '#FFFFFF', fontSize: 15, fontWeight: '800' },
  completeButton: { height: 50, borderRadius: 13, backgroundColor: '#16A34A', alignItems: 'center', justifyContent: 'center', marginTop: 4 },
  completeButtonText: { color: '#FFFFFF', fontSize: 15, fontWeight: '800' },
  pressed: { opacity: 0.82 },
  disabled: { opacity: 0.55 },
});
