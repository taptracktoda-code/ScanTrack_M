import { EmptyState } from '@/components';
import { Page } from '@/components/page';
import { ThemedText } from '@/components/themed-text';
import { apiService } from '@/services/api';
import type { DriverRegistrationRequest } from '@/types';
import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, Pressable, StyleSheet, TextInput, View } from 'react-native';

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

type ManagerDriverAccount = {
  id: string;
  full_name: string;
  email: string;
  phone_number: string;
  license_number: string;
  unit: string;
  account_status: string;
};

export default function DriverRegistrationScreen() {
  const [form, setForm] = useState<DriverRegistrationRequest>(emptyForm);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [drivers, setDrivers] = useState<ManagerDriverAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadDrivers = useCallback(async (pull = false) => {
    if (pull) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }
    setError(null);

    try {
      const remoteData = await apiService.getManagerDrivers();
      setDrivers(normalizeManagerDrivers(remoteData));
    } catch (requestError: any) {
      setError(requestError?.message || 'Unable to load drivers for this organization.');
      setDrivers([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(useCallback(() => {
    loadDrivers();
  }, [loadDrivers]));

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
      } else {
        await loadDrivers(true);
      }
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

  return (
    <Page title="Add Driver" loading={loading} error={error} onRetry={() => loadDrivers()} onRefresh={() => loadDrivers(true)} refreshing={refreshing}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={styles.formCard}>
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
        </View>

        <View style={styles.statusCard}>
          <View style={styles.sectionRow}>
            <ThemedText style={styles.sectionTitle}>Drivers in your organization</ThemedText>
            <Pressable onPress={() => loadDrivers(true)}>
              <ThemedText style={styles.linkText}>Refresh</ThemedText>
            </Pressable>
          </View>
          {drivers.length ? drivers.map((driver) => (
            <View key={driver.id} style={styles.statusRow}>
              <View style={styles.driverSummary}>
                <ThemedText style={styles.driverName}>{driver.full_name}</ThemedText>
                <ThemedText style={styles.driverMeta}>{driver.email}</ThemedText>
                <ThemedText style={styles.driverMeta}>License: {driver.license_number || 'Not provided'}</ThemedText>
                <ThemedText style={styles.driverMeta}>Unit: {driver.unit || 'Not assigned'}</ThemedText>
              </View>
              <View style={[styles.statusBadge, { backgroundColor: driver.account_status.toLowerCase() === 'active' ? '#DCFCE7' : '#FEF3C7' }]}>
                <ThemedText style={[styles.statusBadgeText, { color: driver.account_status.toLowerCase() === 'active' ? '#166534' : '#B45309' }]}>
                  {formatAccountStatus(driver.account_status)}
                </ThemedText>
              </View>
            </View>
          )) : <EmptyState message="No driver accounts found for your organization." icon="◌" />}
        </View>
      </KeyboardAvoidingView>
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

function normalizeManagerDriver(value: any): ManagerDriverAccount | null {
  const payload = value?.data?.data || value?.data || value || {};
  const driver = payload.driver || payload;
  const email = String(driver.email || '');
  const name = String(driver.full_name || driver.name || [driver.first_name, driver.last_name].filter(Boolean).join(' '));
  if (!email && !name && !driver.id) return null;

  return {
    id: String(driver.id ?? driver.driver_id ?? email),
    full_name: name || 'Driver',
    email,
    phone_number: String(driver.contact_number || driver.phone_number || driver.phone || ''),
    license_number: String(driver.license_number || ''),
    unit: String(driver.plate_number || driver.unit || driver.vehicle_number || ''),
    account_status: String(driver.account_status || driver.status || 'active'),
  };
}

function normalizeManagerDrivers(value: any): ManagerDriverAccount[] {
  const payload = value?.data?.data || value?.data || value || {};
  const list = Array.isArray(payload) ? payload : payload.drivers || payload.data || [];
  return Array.isArray(list)
    ? list.map(normalizeManagerDriver).filter((driver): driver is ManagerDriverAccount => driver !== null)
    : [];
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
  sectionRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  linkText: { color: '#2563EB', fontSize: 12, fontWeight: '800' },
  statusRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: '#EDF1F4' },
  driverSummary: { flex: 1, paddingRight: 12 },
  driverName: { color: '#0F172A', fontSize: 14, fontWeight: '800' },
  driverMeta: { color: '#64748B', fontSize: 11, marginTop: 3 },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 5, borderRadius: 8 },
  statusBadgeText: { fontSize: 10, fontWeight: '800' },
});
