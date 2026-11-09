import { EmptyState } from '@/components';
import { RemoveQueueDriver } from '@/components/remove-queue-driver';
import { Page } from '@/components/page';
import { ThemedText } from '@/components/themed-text';
import { useQueueRefresh } from '@/hooks/use-queue-refresh';
import { apiService } from '@/services/api';
import type { DriverRegistrationRequest } from '@/types';
import { filterManagerDrivers, getManagerDriverCounts, hasManagerQueueData, managerDriverFilters, normalizeManagerDriver, normalizeManagerDrivers, parseManagerDriverFilter, type ManagerDriverAccount } from '@/utils/managerDrivers';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useRef, useState } from 'react';
import { Alert, Pressable, StyleSheet, TextInput, View } from 'react-native';

const emptyForm: DriverRegistrationRequest = {
  first_name: '',
  last_name: '',
  email: '',
  contact_number: '',
  license_number: '',
  license_expiration_date: '',
  plate_number: '',
  vehicle_type: '',
  address: '',
};

export default function DriverRegistrationScreen() {
  const router = useRouter();
  const { status } = useLocalSearchParams<{ status?: string }>();
  const selectedFilter = parseManagerDriverFilter(status);
  const [search, setSearch] = useState('');
  const [removingDriver, setRemovingDriver] = useState<ManagerDriverAccount | null>(null);
  const [showRegistration, setShowRegistration] = useState(false);
  const [hoveredFilter, setHoveredFilter] = useState<string | null>(null);
  const requestId = useRef(0);
  const [form, setForm] = useState<DriverRegistrationRequest>(emptyForm);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [drivers, setDrivers] = useState<ManagerDriverAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadDrivers = useCallback(async (pull = false) => {
    const currentRequest = ++requestId.current;
    if (pull) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }
    setError(null);

    try {
      const remoteData = await apiService.getManagerDrivers();
      if (currentRequest === requestId.current) setDrivers(normalizeManagerDrivers(remoteData));
    } catch (requestError: any) {
      if (currentRequest !== requestId.current) return;
      setError(requestError?.message || 'Unable to load drivers for this organization.');
      setDrivers([]);
    } finally {
      if (currentRequest === requestId.current) {
        setLoading(false);
        setRefreshing(false);
      }
    }
  }, []);

  const refreshDrivers = useCallback(() => loadDrivers(true), [loadDrivers]);
  useQueueRefresh(refreshDrivers);

  const updateField = (field: keyof DriverRegistrationRequest, value: string) => {
    setForm((current) => ({ ...current, [field]: value }));
    if (error) setError(null);
  };

  const submit = async () => {
    if (
      !form.first_name.trim() ||
      !form.last_name.trim() ||
      !form.email.trim() ||
      !form.contact_number.trim() ||
      !form.license_number.trim() ||
      !form.license_expiration_date.trim() ||
      !form.plate_number.trim() ||
      !form.vehicle_type.trim() ||
      !form.address.trim()
    ) {
      setError('Complete all required driver information.');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const payload: DriverRegistrationRequest = {
        ...form,
        first_name: form.first_name.trim(),
        last_name: form.last_name.trim(),
        email: form.email.trim(),
        contact_number: form.contact_number.trim(),
        license_number: form.license_number.trim(),
        license_expiration_date: form.license_expiration_date.trim(),
        plate_number: form.plate_number.trim(),
        vehicle_type: form.vehicle_type.trim(),
        address: form.address.trim(),
      };

      const response = await apiService.createManagerDriver(payload);
      const result = normalizeManagerDriver(response);
      if (result) {
        setDrivers((current) => [
          result,
          ...current.filter((driver) => driver.id !== result.id),
        ]);
      }
      await loadDrivers(true);
      setForm(emptyForm);
      const temporaryPassword = getTemporaryPassword(response);
      Alert.alert(
        'Driver account created',
        temporaryPassword
          ? `The account is ready. Share this temporary password securely with the driver: ${temporaryPassword}`
          : 'The account is ready. The backend will provide the temporary password to the driver.',
      );
    } catch (requestError: any) {
      const validationErrors = requestError?.response?.data?.errors
        ? Object.values(requestError.response.data.errors).flat().join(' ')
        : null;
      setError(validationErrors || requestError?.response?.data?.message || requestError?.message || 'Unable to create the driver account.');
    } finally {
      setSubmitting(false);
    }
  };

  const counts = getManagerDriverCounts(drivers);
  const filteredDrivers = filterManagerDrivers(drivers, selectedFilter, search);
  const queueUnavailable = (selectedFilter === 'waiting' || selectedFilter === 'on_trip') && !hasManagerQueueData(drivers);

  const driverList = (
        <View style={styles.statusCard}>
          <View style={styles.sectionRow}>
            <ThemedText style={styles.sectionTitle}>Drivers in your organization</ThemedText>
            <Pressable onPress={() => loadDrivers(true)}>
              <ThemedText style={styles.linkText}>Refresh</ThemedText>
            </Pressable>
          </View>
          <TextInput
            accessibilityLabel="Search drivers"
            placeholder="Search by name, email, phone, license or plate"
            placeholderTextColor="#64748B"
            value={search}
            onChangeText={setSearch}
            autoCapitalize="none"
            style={styles.input}
          />
          <View style={styles.filters}>
            {managerDriverFilters.map((filter) => (
              <Pressable
                key={filter.value}
                accessibilityRole="button"
                accessibilityState={{ selected: selectedFilter === filter.value }}
                onPress={() => router.setParams({ status: filter.value })}
                onHoverIn={() => setHoveredFilter(filter.value)}
                onHoverOut={() => setHoveredFilter(null)}
                style={({ pressed }) => [styles.filter, selectedFilter === filter.value && styles.selectedFilter, hoveredFilter === filter.value && styles.hoveredFilter, pressed && styles.pressed]}
              >
                <ThemedText style={[styles.linkText, selectedFilter === filter.value && styles.selectedFilterText]}>{filter.label} ({counts[filter.value] ?? 'Unavailable'})</ThemedText>
              </Pressable>
            ))}
          </View>
          <ThemedText style={styles.helpText}>{queueUnavailable ? 'Queue status unavailable' : `Showing ${filteredDrivers.length} of ${counts[selectedFilter]} drivers`}. Refreshes every 5 seconds</ThemedText>
          {queueUnavailable ? (
            <EmptyState message="Current queue status is unavailable from the server. Try refreshing or contact your administrator." />
          ) : filteredDrivers.length ? filteredDrivers.map((driver) => (
            <View key={driver.id} style={styles.statusRow}>
              <View style={styles.driverSummary}>
                <ThemedText style={styles.driverName}>{driver.full_name}</ThemedText>
                <ThemedText style={styles.driverMeta}>{driver.email}</ThemedText>
                {driver.phone_number ? <ThemedText style={styles.driverMeta}>{driver.phone_number}</ThemedText> : null}
                {driver.queue_status ? <ThemedText style={styles.driverMeta}>Dispatch: {driver.queue_status === 'serving' ? 'On Trip' : formatAccountStatus(driver.queue_status)}</ThemedText> : null}
                {driver.queue_status === 'waiting' && driver.queue_position ? <ThemedText style={styles.driverMeta}>Queue position: #{driver.queue_position}</ThemedText> : null}
                {driver.queue_status === 'waiting' && driver.queue_entry_id ? <Pressable accessibilityRole="button" accessibilityLabel={`Remove ${driver.full_name} from queue`} onPress={() => setRemovingDriver(driver)} style={{ minHeight: 44, justifyContent: 'center' }}><ThemedText style={styles.error}>Remove from queue</ThemedText></Pressable> : null}
                <ThemedText style={styles.driverMeta}>License: {driver.license_number || 'Not provided'}</ThemedText>
                <ThemedText style={styles.driverMeta}>Unit: {driver.unit || 'Not assigned'}</ThemedText>
              </View>
              <View style={[styles.statusBadge, { backgroundColor: driver.account_status.toLowerCase() === 'active' ? '#DCFCE7' : '#FEF3C7' }]}>
                <ThemedText style={[styles.statusBadgeText, { color: driver.account_status.toLowerCase() === 'active' ? '#166534' : '#B45309' }]}>
                  {formatAccountStatus(driver.account_status)}
                </ThemedText>
              </View>
            </View>
          )) : <EmptyState message="No drivers match the selected status and search." icon="◌" />}
        </View>
  );

  return (
    <Page title="Driver Management" loading={loading} error={error} onRetry={() => loadDrivers()} onRefresh={() => loadDrivers(true)} refreshing={refreshing}>
      <View>
        {driverList}
        {removingDriver && <RemoveQueueDriver key={removingDriver.queue_entry_id} driver={removingDriver} onClose={() => setRemovingDriver(null)} />}
        <Pressable accessibilityRole="button" onPress={() => setShowRegistration((value) => !value)} style={styles.registrationToggle}>
          <ThemedText style={styles.linkText}>{showRegistration ? 'Hide registration form' : 'Create a driver account'}</ThemedText>
        </Pressable>
        {showRegistration && <View style={styles.formCard}>
          <ThemedText style={styles.sectionTitle}>Create a driver account</ThemedText>
          <ThemedText style={styles.helpText}>Enter the driver and vehicle details. The backend will assign the driver to your organization and generate and deliver a temporary password.</ThemedText>

          <Field label="First name" value={form.first_name} onChangeText={(value) => updateField('first_name', value)} />
          <Field label="Last name" value={form.last_name} onChangeText={(value) => updateField('last_name', value)} />
          <Field label="Driver email address" value={form.email} onChangeText={(value) => updateField('email', value)} keyboardType="email-address" autoCapitalize="none" />
          <Field label="Contact number" value={form.contact_number} onChangeText={(value) => updateField('contact_number', value)} keyboardType="phone-pad" />
          <Field label="License number" value={form.license_number} onChangeText={(value) => updateField('license_number', value)} />
          <Field label="License expiration date" value={form.license_expiration_date} onChangeText={(value) => updateField('license_expiration_date', value)} placeholder="YYYY-MM-DD" />
          <Field label="Plate number" value={form.plate_number} onChangeText={(value) => updateField('plate_number', value)} autoCapitalize="characters" />
          <Field label="Vehicle type" value={form.vehicle_type} onChangeText={(value) => updateField('vehicle_type', value)} placeholder="e.g. Tricycle" />
          <Field label="Address" value={form.address} onChangeText={(value) => updateField('address', value)} multiline />

          {error ? <ThemedText style={styles.error}>{error}</ThemedText> : null}
          <View style={styles.actions}>
            <Pressable onPress={submit} disabled={submitting} style={({ pressed }) => [styles.primaryButton, pressed && styles.pressed, submitting && styles.disabled]}>
              <ThemedText style={styles.primaryButtonText}>{submitting ? 'Creating account...' : 'Create driver account'}</ThemedText>
            </Pressable>
          </View>
        </View>}

      </View>
    </Page>
  );
}

function Field({
  label,
  value,
  onChangeText,
  keyboardType,
  secureTextEntry,
  multiline,
  autoCapitalize,
  placeholder,
}: {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  keyboardType?: 'default' | 'email-address' | 'phone-pad';
  secureTextEntry?: boolean;
  multiline?: boolean;
  autoCapitalize?: 'none' | 'sentences' | 'characters';
  placeholder?: string;
}) {
  return (
    <View style={styles.field}>
      <ThemedText style={styles.label}>{label}</ThemedText>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        keyboardType={keyboardType}
        secureTextEntry={secureTextEntry}
        multiline={multiline}
        autoCapitalize={autoCapitalize}
        placeholder={placeholder}
        placeholderTextColor="#A0AEC0"
        style={[styles.input, multiline && styles.addressInput]}
      />
    </View>
  );
}

function getTemporaryPassword(value: any): string | null {
  const payload = value?.data?.data || value?.data || value || {};
  const credentials = payload.credentials || payload.driver?.credentials || {};
  const password = payload.temporary_password || payload.temp_password || credentials.temporary_password || credentials.password;
  return typeof password === 'string' && password ? password : null;
}

function formatAccountStatus(value: string) {
  return value.replace(/[_-]+/g, ' ').replace(/\b\w/g, (character) => character.toUpperCase());
}

const styles = StyleSheet.create({
  registrationToggle: { marginBottom: 14, alignSelf: 'flex-start', paddingVertical: 10, cursor: 'pointer' },
  filters: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 12 },
  filter: { minHeight: 44, justifyContent: 'center', paddingHorizontal: 12, borderRadius: 10, borderWidth: 1, borderColor: '#DFE6ED', cursor: 'pointer' },
  selectedFilter: { backgroundColor: '#2563EB', borderColor: '#2563EB' },
  selectedFilterText: { color: '#FFFFFF' },
  hoveredFilter: { opacity: 0.8 },
  formCard: { backgroundColor: '#FFF', borderRadius: 18, padding: 18, marginBottom: 14, borderWidth: 1, borderColor: '#E2E8F0' },
  sectionTitle: { color: '#0F172A', fontSize: 16, fontWeight: '800' },
  helpText: { color: '#64748B', fontSize: 12, lineHeight: 18, marginTop: 6, marginBottom: 16 },
  field: { marginBottom: 12 },
  label: { color: '#33404D', fontSize: 12, fontWeight: '700', marginBottom: 7 },
  input: { minHeight: 50, backgroundColor: '#F8FAFC', borderWidth: 1, borderColor: '#DFE6ED', borderRadius: 12, paddingHorizontal: 14, color: '#14212B', fontSize: 14 },
  addressInput: { minHeight: 84, textAlignVertical: 'top', paddingTop: 12 },
  error: { color: '#B42318', fontSize: 12, fontWeight: '600', marginTop: 4 },
  actions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 10, marginTop: 18 },
  primaryButton: { flex: 1, minHeight: 50, borderRadius: 12, backgroundColor: '#208AEF', alignItems: 'center', justifyContent: 'center' },
  primaryButtonText: { color: '#FFF', fontSize: 14, fontWeight: '800' },
  pressed: { opacity: 0.82 },
  disabled: { opacity: 0.55 },
  statusCard: { backgroundColor: '#FFF', borderRadius: 18, padding: 18, borderWidth: 1, borderColor: '#E2E8F0' },
  sectionRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  linkText: { color: '#2563EB', fontSize: 12, fontWeight: '800' },
  statusRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, justifyContent: 'space-between', alignItems: 'center', paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: '#EDF1F4' },
  driverSummary: { flexGrow: 1, flexBasis: 140, minWidth: 0, paddingRight: 12 },
  driverName: { color: '#0F172A', fontSize: 14, fontWeight: '800' },
  driverMeta: { color: '#64748B', fontSize: 11, marginTop: 3 },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 5, borderRadius: 8 },
  statusBadgeText: { fontSize: 10, fontWeight: '800' },
});
