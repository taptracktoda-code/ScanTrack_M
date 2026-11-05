import { EmptyState } from '@/components';
import { Page, useApi } from '@/components/page';
import { ThemedText } from '@/components/themed-text';
import { useAuth } from '@/context/auth';
import { apiService, MANAGER_DASHBOARD_CONFIGURED } from '@/services/api';
import type { OrganizationEvent } from '@/types/schedule';
import type { TripDestination } from '@/types/trip';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useRef, useState } from 'react';
import { Alert, Pressable, StyleSheet, TextInput, View } from 'react-native';

type EventForm = {
  title: string;
  description: string;
  event_date: string;
  start_time: string;
  end_time: string;
  location: string;
};

function getTodayDate() {
  const today = new Date();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');
  return `${today.getFullYear()}-${month}-${day}`;
}

function emptyEventForm(): EventForm {
  return {
    title: '',
    description: '',
    event_date: getTodayDate(),
    start_time: '',
    end_time: '',
    location: '',
  };
}

function getApiErrorMessage(error: unknown) {
  const apiError = error as { response?: { data?: { message?: string; errors?: Record<string, string[]> } }; message?: string };
  const validationMessage = Object.values(apiError.response?.data?.errors || {})[0]?.[0];
  return validationMessage || apiError.response?.data?.message || apiError.message || 'Unable to complete the schedule request.';
}

function formatEventDate(value: string) {
  const [year, month, day] = value.split('-').map(Number);
  if (!year || !month || !day) return value;
  const date = new Date(year, month - 1, day);
  if (date.getFullYear() !== year || date.getMonth() !== month - 1 || date.getDate() !== day) return value;
  return date.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
}

function formatEventTime(value: string) {
  const [hourText, minuteText] = value.split(':');
  const hour = Number(hourText);
  const date = new Date();
  date.setHours(hour, Number(minuteText), 0, 0);
  return date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
}

export default function AdminDashboardScreen() {
  const { user } = useAuth();
  const router = useRouter();
  const [managerProfile, setManagerProfile] = useState<any | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [events, setEvents] = useState<OrganizationEvent[]>([]);
  const [tripDestinations, setTripDestinations] = useState<TripDestination[]>([]);
  const [destinationName, setDestinationName] = useState('');
  const [eventForm, setEventForm] = useState<EventForm>(emptyEventForm);
  const [editingEventId, setEditingEventId] = useState<number | null>(null);
  const [eventsLoading, setEventsLoading] = useState(true);
  const [savingEvent, setSavingEvent] = useState(false);
  const [eventError, setEventError] = useState<string | null>(null);
  const [destinationsLoading, setDestinationsLoading] = useState(true);
  const [savingDestination, setSavingDestination] = useState(false);
  const [destinationError, setDestinationError] = useState<string | null>(null);
  const hasFocused = useRef(false);
  const loadEvents = useCallback(async () => {
    setEventsLoading(true);
    setEventError(null);
    try {
      const result = await apiService.getManagerSchedules();
      setEvents(Array.isArray(result?.schedules) ? result.schedules : []);
    } catch (error) {
      setEventError(getApiErrorMessage(error));
    } finally {
      setEventsLoading(false);
    }
  }, []);
  const loadTripDestinations = useCallback(async () => {
    setDestinationsLoading(true);
    setDestinationError(null);
    try {
      const result = await apiService.getManagerTripDestinations();
      setTripDestinations(Array.isArray(result?.destinations) ? result.destinations : []);
    } catch (error) {
      setDestinationError(getApiErrorMessage(error));
    } finally {
      setDestinationsLoading(false);
    }
  }, []);

  const request = useCallback(async () => {
    const [remoteData, profileResponse, driversResponse] = await Promise.all([
      apiService.getAdminDashboardSummary(),
      apiService.getManagerProfile().catch((error: any) => {
        if (error.response?.status === 404) return null;
        throw error;
      }),
      apiService.getManagerDrivers(),
    ]);
    if (profileResponse) {
      const profileData = profileResponse?.data?.data || profileResponse?.data || profileResponse;
      const profile = profileData.user || profileData.manager || profileData;
      if (profile && typeof profile === 'object' && Object.keys(profile).length > 0) setManagerProfile(profile);
    }

    const response = remoteData?.data?.data || remoteData?.data || remoteData || {};
    const driverData = driversResponse?.data?.drivers || driversResponse?.drivers || [];
    if (MANAGER_DASHBOARD_CONFIGURED) setLastUpdated(new Date());
    return {
      ...response,
      drivers: Array.isArray(driverData) ? driverData : [],
    };
  }, []);
  const { data, loading, error, retry, refresh, refreshing } = useApi(request, {} as any);

  useFocusEffect(useCallback(() => {
    if (hasFocused.current) refresh();
    else hasFocused.current = true;
    void loadEvents();
    void loadTripDestinations();
    const interval = setInterval(refresh, 15000);
    const eventsInterval = setInterval(loadEvents, 60000);
    const destinationsInterval = setInterval(loadTripDestinations, 60000);
    return () => {
      clearInterval(interval);
      clearInterval(eventsInterval);
      clearInterval(destinationsInterval);
    };
  }, [loadEvents, loadTripDestinations, refresh]));

  const response = data?.data || data || {};
  const summary = response.summary || response.dashboard || response.statistics || response;
  const transactionCandidate = Array.isArray(summary) ? summary : summary.recent_activity || summary.recent_transactions || summary.transactions || summary.data;
  const transactions = Array.isArray(transactionCandidate) ? transactionCandidate : [];
  const drivers = Array.isArray(response.drivers) ? response.drivers : [];
  const activeUser = managerProfile || user;
  const managerName = activeUser?.name || activeUser?.full_name || user?.name || 'Manager';
  const todaValue = activeUser?.toda_name || activeUser?.toda?.name || activeUser?.organization_name || activeUser?.organization?.name || activeUser?.association_name || (typeof activeUser?.toda === 'string' ? activeUser.toda : null) || (typeof activeUser?.organization === 'string' ? activeUser.organization : null) || summary.toda_name || summary.toda?.name;
  const todaName = typeof todaValue === 'string' && todaValue.trim() ? todaValue : 'TODA not assigned';

  const statCards = [
    { label: 'Total drivers', value: summary.total_drivers ?? summary.drivers_total ?? summary.totalDrivers ?? '—', accent: '#2563EB' },
    { label: 'Active', value: summary.active_drivers ?? summary.drivers_active ?? summary.activeDrivers ?? '—', accent: '#16A34A' },
    { label: 'Waiting', value: summary.waiting_drivers ?? summary.pending_drivers ?? summary.waitingDrivers ?? '—', accent: '#F59E0B' },
    { label: 'On trip', value: summary.on_trip ?? summary.trips_active ?? summary.on_trip_drivers ?? summary.onTrip ?? '—', accent: '#14B8A6' },
  ];

  const submitEvent = async () => {
    const eventDate = eventForm.event_date.trim();
    const dateParts = eventDate.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    const parsedDate = dateParts ? new Date(Number(dateParts[1]), Number(dateParts[2]) - 1, Number(dateParts[3])) : null;
    const dateIsValid = Boolean(parsedDate && dateParts
      && parsedDate.getFullYear() === Number(dateParts[1])
      && parsedDate.getMonth() === Number(dateParts[2]) - 1
      && parsedDate.getDate() === Number(dateParts[3]));
    if (!eventForm.title.trim() || !dateIsValid || !eventForm.location.trim()
      || !/^\d{2}:\d{2}$/.test(eventForm.start_time)
      || !/^\d{2}:\d{2}$/.test(eventForm.end_time)) {
      setEventError('Enter a title, valid date, start and end times, and location.');
      return;
    }
    if (eventForm.end_time <= eventForm.start_time) {
      setEventError('The end time must be later than the start time.');
      return;
    }

    setSavingEvent(true);
    setEventError(null);
    const payload = {
      ...eventForm,
      title: eventForm.title.trim(),
      description: eventForm.description.trim(),
      location: eventForm.location.trim(),
    };
    try {
      if (editingEventId) {
        await apiService.updateManagerSchedule(editingEventId, payload);
      } else {
        await apiService.createManagerSchedule(payload);
      }
      setEventForm(emptyEventForm());
      setEditingEventId(null);
      await loadEvents();
    } catch (error) {
      setEventError(getApiErrorMessage(error));
    } finally {
      setSavingEvent(false);
    }
  };

  const beginEditingEvent = (event: OrganizationEvent) => {
    setEditingEventId(event.id);
    setEventForm({
      title: event.title,
      description: event.description || '',
      event_date: event.event_date.slice(0, 10),
      start_time: event.start_time.slice(0, 5),
      end_time: event.end_time.slice(0, 5),
      location: event.location,
    });
    setEventError(null);
  };

  const deleteEvent = (event: OrganizationEvent) => {
    Alert.alert('Delete event?', `Delete "${event.title}" from your TODA schedule?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await apiService.deleteManagerSchedule(event.id);
            if (editingEventId === event.id) {
              setEditingEventId(null);
              setEventForm(emptyEventForm());
            }
            await loadEvents();
          } catch (error) {
            setEventError(getApiErrorMessage(error));
          }
        },
      },
    ]);
  };

  const submitTripDestination = async () => {
    const name = destinationName.trim();
    if (!name) {
      setDestinationError('Enter a destination name.');
      return;
    }

    setSavingDestination(true);
    setDestinationError(null);
    try {
      await apiService.createManagerTripDestination(name);
      setDestinationName('');
      await loadTripDestinations();
    } catch (error) {
      setDestinationError(getApiErrorMessage(error));
    } finally {
      setSavingDestination(false);
    }
  };

  const deactivateTripDestination = (destination: TripDestination) => {
    Alert.alert('Deactivate destination?', `Drivers will no longer be able to select "${destination.name}" for new trips. Existing trip records will be kept.`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Deactivate',
        style: 'destructive',
        onPress: async () => {
          try {
            await apiService.deactivateManagerTripDestination(destination.id);
            await loadTripDestinations();
          } catch (error) {
            setDestinationError(getApiErrorMessage(error));
          }
        },
      },
    ]);
  };

  return (
    <Page title="Manager Dashboard" loading={loading} error={error} onRetry={retry} onRefresh={refresh} refreshing={refreshing}>
      <View style={screenStyles.heroCard}>
        <View>
          <ThemedText style={screenStyles.eyebrow}>MANAGER</ThemedText>
          <ThemedText style={screenStyles.welcome}>{managerName}</ThemedText>
          <ThemedText style={screenStyles.orgName}>{todaName}</ThemedText>
        </View>
      </View>

      <View style={screenStyles.statsGrid}>
        {statCards.map((card) => (
          <View key={card.label} style={[screenStyles.statCard, { borderTopColor: card.accent }]}>
            <ThemedText style={screenStyles.cardLabel}>{card.label}</ThemedText>
            <ThemedText style={screenStyles.statValue}>{String(card.value)}</ThemedText>
          </View>
        ))}
      </View>

      <ThemedText style={screenStyles.dataStatus}>
        {MANAGER_DASHBOARD_CONFIGURED
          ? `Auto-refreshes every 15 seconds${lastUpdated ? ` · Updated ${lastUpdated.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}` : ''}`
          : 'Live driver counts unavailable: manager dashboard endpoint is not configured.'}
      </ThemedText>

      <View style={screenStyles.scheduleCard}>
        <View style={screenStyles.sectionRow}>
          <View style={screenStyles.eventHeadingCopy}>
            <ThemedText style={screenStyles.sectionHeading}>TODA event schedule</ThemedText>
            <ThemedText style={screenStyles.dataHint}>Events are shared with drivers in {todaName}.</ThemedText>
          </View>
        </View>

        <ThemedText style={screenStyles.inputLabel}>Event title</ThemedText>
        <TextInput
          accessibilityLabel="Event title"
          value={eventForm.title}
          onChangeText={(title) => setEventForm((form) => ({ ...form, title }))}
          placeholder="e.g. Monthly TODA meeting"
          placeholderTextColor="#94A3B8"
          maxLength={150}
          style={screenStyles.eventInput}
        />
        <ThemedText style={screenStyles.inputLabel}>Description (optional)</ThemedText>
        <TextInput
          accessibilityLabel="Event description"
          value={eventForm.description}
          onChangeText={(description) => setEventForm((form) => ({ ...form, description }))}
          placeholder="Add event details"
          placeholderTextColor="#94A3B8"
          multiline
          maxLength={5000}
          style={[screenStyles.eventInput, screenStyles.descriptionInput]}
        />
        <View style={screenStyles.eventFieldRow}>
          <View style={screenStyles.eventFieldHalf}>
            <ThemedText style={screenStyles.inputLabel}>Date (YYYY-MM-DD)</ThemedText>
            <TextInput
              accessibilityLabel="Event date, year month day"
              value={eventForm.event_date}
              onChangeText={(event_date) => setEventForm((form) => ({ ...form, event_date }))}
              placeholder="2026-10-31"
              placeholderTextColor="#94A3B8"
              keyboardType="numbers-and-punctuation"
              style={screenStyles.eventInput}
            />
          </View>
          <View style={screenStyles.eventFieldHalf}>
            <ThemedText style={screenStyles.inputLabel}>Location</ThemedText>
            <TextInput
              accessibilityLabel="Event location"
              value={eventForm.location}
              onChangeText={(location) => setEventForm((form) => ({ ...form, location }))}
              placeholder="North terminal"
              placeholderTextColor="#94A3B8"
              maxLength={255}
              style={screenStyles.eventInput}
            />
          </View>
        </View>
        <View style={screenStyles.eventFieldRow}>
          <View style={screenStyles.eventFieldHalf}>
            <ThemedText style={screenStyles.inputLabel}>Start time (24-hour)</ThemedText>
            <TextInput
              accessibilityLabel="Event start time"
              value={eventForm.start_time}
              onChangeText={(start_time) => setEventForm((form) => ({ ...form, start_time }))}
              placeholder="09:00"
              placeholderTextColor="#94A3B8"
              keyboardType="numbers-and-punctuation"
              style={screenStyles.eventInput}
            />
          </View>
          <View style={screenStyles.eventFieldHalf}>
            <ThemedText style={screenStyles.inputLabel}>End time (24-hour)</ThemedText>
            <TextInput
              accessibilityLabel="Event end time"
              value={eventForm.end_time}
              onChangeText={(end_time) => setEventForm((form) => ({ ...form, end_time }))}
              placeholder="11:00"
              placeholderTextColor="#94A3B8"
              keyboardType="numbers-and-punctuation"
              style={screenStyles.eventInput}
            />
          </View>
        </View>
        {eventError ? <ThemedText accessibilityRole="alert" style={screenStyles.eventError}>{eventError}</ThemedText> : null}
        {eventError && events.length === 0 && !eventsLoading ? (
          <Pressable accessibilityRole="button" onPress={() => { void loadEvents(); }}>
            <ThemedText style={screenStyles.viewAll}>Retry loading events</ThemedText>
          </Pressable>
        ) : null}
        <View style={screenStyles.eventActions}>
          {editingEventId ? (
            <Pressable
              accessibilityRole="button"
              onPress={() => { setEditingEventId(null); setEventForm(emptyEventForm()); setEventError(null); }}
              style={screenStyles.cancelButton}
            >
              <ThemedText style={screenStyles.cancelButtonText}>Cancel edit</ThemedText>
            </Pressable>
          ) : null}
          <Pressable
            accessibilityRole="button"
            disabled={savingEvent}
            onPress={() => { void submitEvent(); }}
            style={({ pressed }) => [screenStyles.saveEventButton, pressed && screenStyles.pressedButton, savingEvent && screenStyles.disabledButton]}
          >
            <ThemedText style={screenStyles.saveEventText}>{savingEvent ? 'Saving...' : editingEventId ? 'Save changes' : 'Add event'}</ThemedText>
          </Pressable>
        </View>

        <ThemedText style={[screenStyles.sectionHeading, screenStyles.eventsListTitle]}>Scheduled events</ThemedText>
        {eventsLoading ? <ThemedText style={screenStyles.dataHint}>Loading events...</ThemedText> : events.length ? events.map((event) => (
          <View key={event.id} style={screenStyles.eventItem}>
            <ThemedText style={screenStyles.eventTitle}>{event.title}</ThemedText>
            <ThemedText style={screenStyles.eventMeta}>{formatEventDate(event.event_date)} · {formatEventTime(event.start_time)}–{formatEventTime(event.end_time)}</ThemedText>
            <ThemedText style={screenStyles.eventMeta}>{event.location}</ThemedText>
            {event.description ? <ThemedText style={screenStyles.eventDescription}>{event.description}</ThemedText> : null}
            <View style={screenStyles.eventActions}>
              <Pressable accessibilityRole="button" onPress={() => beginEditingEvent(event)} style={screenStyles.editEventButton}>
                <ThemedText style={screenStyles.editEventText}>Edit</ThemedText>
              </Pressable>
              <Pressable accessibilityRole="button" onPress={() => deleteEvent(event)} style={screenStyles.deleteEventButton}>
                <ThemedText style={screenStyles.deleteEventText}>Delete</ThemedText>
              </Pressable>
            </View>
          </View>
        )) : <ThemedText style={screenStyles.dataHint}>No events scheduled yet.</ThemedText>}
      </View>

      <View style={screenStyles.scheduleCard}>
        <ThemedText style={screenStyles.sectionHeading}>Trip destinations</ThemedText>
        <ThemedText style={screenStyles.dataHint}>Drivers can start trips only to active destinations configured for {todaName}.</ThemedText>
        <ThemedText style={screenStyles.inputLabel}>Destination name</ThemedText>
        <TextInput
          accessibilityLabel="Trip destination name"
          value={destinationName}
          onChangeText={setDestinationName}
          placeholder="e.g. Central Market"
          placeholderTextColor="#94A3B8"
          maxLength={120}
          style={screenStyles.eventInput}
        />
        {destinationError ? <ThemedText accessibilityRole="alert" style={screenStyles.eventError}>{destinationError}</ThemedText> : null}
        <View style={screenStyles.eventActions}>
          <Pressable
            accessibilityRole="button"
            disabled={savingDestination}
            onPress={() => { void submitTripDestination(); }}
            style={({ pressed }) => [screenStyles.saveEventButton, pressed && screenStyles.pressedButton, savingDestination && screenStyles.disabledButton]}
          >
            <ThemedText style={screenStyles.saveEventText}>{savingDestination ? 'Saving...' : 'Add destination'}</ThemedText>
          </Pressable>
        </View>
        <ThemedText style={[screenStyles.sectionHeading, screenStyles.eventsListTitle]}>Configured destinations</ThemedText>
        {destinationsLoading ? <ThemedText style={screenStyles.dataHint}>Loading destinations...</ThemedText> : tripDestinations.length ? tripDestinations.map((destination) => (
          <View key={destination.id} style={screenStyles.eventItem}>
            <ThemedText style={screenStyles.eventTitle}>{destination.name}</ThemedText>
            <ThemedText style={screenStyles.eventMeta}>{destination.status || 'Active'}</ThemedText>
            {destination.status !== 'Inactive' ? (
              <View style={screenStyles.eventActions}>
                <Pressable accessibilityRole="button" onPress={() => deactivateTripDestination(destination)} style={screenStyles.deleteEventButton}>
                  <ThemedText style={screenStyles.deleteEventText}>Deactivate</ThemedText>
                </Pressable>
              </View>
            ) : null}
          </View>
        )) : <ThemedText style={screenStyles.dataHint}>No destinations configured yet.</ThemedText>}
      </View>

      <View style={screenStyles.queueCard}>
        <View style={screenStyles.sectionRow}>
          <ThemedText style={screenStyles.sectionHeading}>Driver status</ThemedText>
          <Pressable onPress={() => router.push('/admin/history')}>
            <ThemedText style={screenStyles.viewAll}>History</ThemedText>
          </Pressable>
        </View>
        <ThemedText style={screenStyles.dataHint}>Duty status is scoped to your assigned TODA and refreshes every 15 seconds.</ThemedText>
        {drivers.length ? drivers.map((driver: any) => {
          const isOffDuty = driver.duty_status === 'off_duty' || String(driver.shift_status).toLowerCase() === 'off duty';
          const isOnBreak = String(driver.shift_status).toLowerCase() === 'on break';
          const dutyLabel = isOffDuty ? 'Off Duty' : isOnBreak ? 'On Break' : 'On Duty';
          const dutyColor = isOffDuty ? '#64748B' : isOnBreak ? '#B45309' : '#16A34A';

          return (
            <View key={driver.id} style={screenStyles.driverStatusRow}>
              <View style={screenStyles.activityCopy}>
                <ThemedText style={screenStyles.activityName}>{driver.name || 'Driver'}</ThemedText>
                <ThemedText style={screenStyles.activityMeta}>Plate: {driver.vehicle_number || '—'}</ThemedText>
              </View>
              <ThemedText style={[screenStyles.dutyBadge, { color: dutyColor }]}>{dutyLabel}</ThemedText>
            </View>
          );
        }) : <ThemedText style={screenStyles.dataHint}>No drivers are assigned to this TODA yet.</ThemedText>}
      </View>

      <View style={screenStyles.sectionRow}>
        <ThemedText style={screenStyles.sectionHeading}>Recent activity</ThemedText>
        <Pressable onPress={() => router.push('/admin/scan')}>
          <ThemedText style={screenStyles.viewAll}>Scan QR</ThemedText>
        </Pressable>
      </View>
      {transactions.length ? transactions.slice(0, 4).map((item: any, index: number) => <ActivityRow key={`${item.id || index}`} item={item} />) : <EmptyState message="No activity recorded yet." icon="—" />}
    </Page>
  );
}

function ActivityRow({ item }: { item: any }) {
  const timestamp = item.timestamp || item.created_at;
  const entry = isEntry(item);
  return (
    <View style={screenStyles.activityRow}>
      <View style={[screenStyles.activityDot, { backgroundColor: entry ? '#22C55E' : '#2563EB' }]} />
      <View style={screenStyles.activityCopy}>
        <ThemedText style={screenStyles.activityName}>{item.driver?.name || item.driver_name || item.name || 'Driver'}</ThemedText>
        <ThemedText style={screenStyles.activityMeta}>Plate: {item.driver?.plate_number || item.plate_number || item.plate || '—'}</ThemedText>
      </View>
      <View style={screenStyles.activityRight}>
        <ThemedText style={screenStyles.activityType}>{entry ? 'Entry' : 'Exit'}</ThemedText>
        <ThemedText style={screenStyles.activityTime}>{timestamp ? new Date(timestamp).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }) : 'Recent'}</ThemedText>
      </View>
    </View>
  );
}

function isEntry(item: any) {
  const value = String(item.transaction || item.transaction_type || item.type || item.action || '').toLowerCase();
  return value === 'entry' || value === 'in' || value === 'check_in';
}

const screenStyles = StyleSheet.create({
  heroCard: { padding: 18, borderRadius: 18, backgroundColor: '#0F172A', marginBottom: 14 },
  eyebrow: { color: '#93C5FD', fontSize: 10, fontWeight: '800', letterSpacing: 2 },
  welcome: { color: '#F8FAFC', fontSize: 22, fontWeight: '800', marginTop: 6 },
  orgName: { color: '#CBD5E1', fontSize: 12, marginTop: 4 },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', marginBottom: 14 },
  statCard: { width: '48%', backgroundColor: '#FFF', borderRadius: 16, borderTopWidth: 4, padding: 14, marginBottom: 10, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 10, elevation: 2 },
  cardLabel: { color: '#64748B', fontSize: 11, fontWeight: '700', textTransform: 'uppercase' },
  statValue: { color: '#0F172A', fontSize: 22, fontWeight: '800', marginTop: 8 },
  dataStatus: { color: '#64748B', fontSize: 11, marginTop: -4, marginBottom: 12 },
  dataHint: { color: '#64748B', fontSize: 12, lineHeight: 18, paddingTop: 2 },
  scheduleCard: { backgroundColor: '#FFF', borderRadius: 18, padding: 16, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 10, elevation: 2, marginBottom: 14 },
  eventHeadingCopy: { flex: 1, gap: 4 },
  inputLabel: { color: '#334155', fontSize: 12, fontWeight: '700', marginTop: 12, marginBottom: 6 },
  eventInput: { minHeight: 46, borderWidth: 1, borderColor: '#DCE4EE', borderRadius: 12, backgroundColor: '#F8FAFC', paddingHorizontal: 12, paddingVertical: 10, color: '#0F172A', fontSize: 14 },
  descriptionInput: { minHeight: 72, textAlignVertical: 'top' },
  eventFieldRow: { flexDirection: 'row', gap: 10 },
  eventFieldHalf: { flex: 1 },
  eventError: { color: '#B91C1C', fontSize: 12, lineHeight: 18, marginTop: 10 },
  eventActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 8, marginTop: 12 },
  saveEventButton: { minHeight: 42, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 16, borderRadius: 12, backgroundColor: '#1D4ED8' },
  saveEventText: { color: '#FFF', fontSize: 13, fontWeight: '800' },
  cancelButton: { minHeight: 42, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 14, borderRadius: 12, backgroundColor: '#EFF3F8' },
  cancelButtonText: { color: '#475569', fontSize: 13, fontWeight: '700' },
  pressedButton: { opacity: 0.82 },
  disabledButton: { opacity: 0.55 },
  eventsListTitle: { marginTop: 22, marginBottom: 10 },
  eventItem: { borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 14, padding: 13, marginTop: 9 },
  eventTitle: { color: '#0F172A', fontSize: 14, fontWeight: '800' },
  eventMeta: { color: '#64748B', fontSize: 12, marginTop: 4 },
  eventDescription: { color: '#334155', fontSize: 12, lineHeight: 18, marginTop: 7 },
  editEventButton: { paddingHorizontal: 14, paddingVertical: 9, borderRadius: 10, backgroundColor: '#EFF6FF' },
  editEventText: { color: '#1D4ED8', fontSize: 12, fontWeight: '800' },
  deleteEventButton: { paddingHorizontal: 14, paddingVertical: 9, borderRadius: 10, backgroundColor: '#FEF2F2' },
  deleteEventText: { color: '#B91C1C', fontSize: 12, fontWeight: '800' },
  queueCard: { backgroundColor: '#FFF', borderRadius: 18, padding: 16, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 10, elevation: 2, marginBottom: 14 },
  driverStatusRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 11, borderTopWidth: 1, borderTopColor: '#E2E8F0' },
  dutyBadge: { fontSize: 11, fontWeight: '800', marginLeft: 10 },
  sectionRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  sectionHeading: { color: '#0F172A', fontSize: 16, fontWeight: '800' },
  viewAll: { color: '#2563EB', fontSize: 11, fontWeight: '800' },
  activityRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#E2E8F0' },
  activityDot: { width: 8, height: 8, borderRadius: 4, marginRight: 10 },
  activityCopy: { flex: 1 },
  activityName: { color: '#0F172A', fontSize: 14, fontWeight: '800' },
  activityMeta: { color: '#64748B', fontSize: 11, marginTop: 3 },
  activityRight: { alignItems: 'flex-end' },
  activityType: { color: '#0F172A', fontSize: 12, fontWeight: '800' },
  activityTime: { color: '#64748B', fontSize: 11, marginTop: 3 },
  iconText: { color: '#FFF', fontSize: 16 },
});
