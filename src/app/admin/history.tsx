import { EmptyState } from '@/components';
import { Page, styles, useApi } from '@/components/page';
import { ThemedText } from '@/components/themed-text';
import { apiService } from '@/services/api';
import { useFocusEffect } from 'expo-router';
import { useCallback } from 'react';
import { View } from 'react-native';

type DriverHistory = {
  key: string;
  name: string;
  plate: string;
  organization: string;
  date: string;
  entry?: string;
  exit?: string;
  latest: number;
};

function resolveTransactions(data: any) {
  const payload = data?.data || data || [];
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload.items)) return payload.items;
  if (Array.isArray(payload.data)) return payload.data;
  if (Array.isArray(payload.transactions)) return payload.transactions;
  return [];
}

function formatTime(value?: string) {
  if (!value) return 'Not recorded';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
}

function isEntry(item: any) {
  const value = String(item.transaction || item.transaction_type || item.type || item.action || '').toLowerCase();
  return value === 'entry' || value === 'in' || value === 'check_in';
}

function getDriverHistory(transactions: any[]): DriverHistory[] {
  const groups = new Map<string, DriverHistory>();

  transactions.forEach((item, index) => {
    const driver = item.driver || {};
    const name = String(driver.name || item.driver_name || item.name || 'Unknown Driver');
    const plate = String(driver.plate_number || item.vehicle_number || item.plate_number || 'Vehicle unavailable');
    const organization = String(item.organization || driver.organization || 'Organization unavailable');
    const sourceDate = item.date || item.timestamp || item.created_at || item.entry_time || item.exit_time;
    const date = sourceDate ? new Date(sourceDate).toDateString() : 'Unknown date';
    const driverId = driver.id || item.driver_id || name;
    const key = `${driverId}-${date}`;
    const existing = groups.get(key) || { key, name, plate, organization, date, latest: 0 };
    const entryTime = item.entry_time || (isEntry(item) ? item.timestamp || item.created_at : undefined);
    const exitTime = item.exit_time || (!isEntry(item) && (item.timestamp || item.created_at));

    if (entryTime) existing.entry = existing.entry || entryTime;
    if (exitTime) existing.exit = existing.exit || exitTime;
    const latestValue = [entryTime, exitTime, item.updated_at, item.created_at].filter(Boolean).map((value) => new Date(value).getTime()).find((value) => !Number.isNaN(value));
    existing.latest = Math.max(existing.latest, latestValue || index);
    groups.set(key, existing);
  });

  return Array.from(groups.values()).sort((left, right) => right.latest - left.latest);
}

export default function AdminHistoryScreen() {
  const request = useCallback(async () => {
    const localTransactions = await apiService.getLocalAdminTransactions();
    try {
      const remoteData = await apiService.getAdminTransactions();
      return [...localTransactions, ...resolveTransactions(remoteData)];
    } catch (error) {
      if (localTransactions.length) return localTransactions;
      throw error;
    }
  }, []);
  const { data, loading, error, retry, refresh, refreshing } = useApi(request, {} as any);
  const transactions = resolveTransactions(data);
  const driverHistory = getDriverHistory(transactions);

  useFocusEffect(useCallback(() => {
    refresh();
  }, [refresh]));

  return (
    <Page title="Activity" loading={loading} error={error} onRetry={retry} onRefresh={refresh} refreshing={refreshing}>
      {driverHistory.length ? driverHistory.map((record) => (
        <View key={record.key} style={styles.card}>
          <ThemedText style={{ fontSize: 16, fontWeight: '800', color: '#14212B' }}>{record.name}</ThemedText>
          <ThemedText style={{ color: '#4B5866', marginTop: 5 }}>{record.plate}</ThemedText>
          <ThemedText style={{ color: '#6B7785', marginTop: 3 }}>{record.organization}</ThemedText>
          <ThemedText style={{ color: '#7B8794', fontSize: 12, marginTop: 10 }}>{record.date}</ThemedText>
          <View style={{ marginTop: 8, borderTopWidth: 1, borderTopColor: '#EDF1F4' }}>
            <HistoryTimeRow label="Entry" value={record.entry} color="#1B8F5A" />
            <HistoryTimeRow label="Exit" value={record.exit} color="#208AEF" />
          </View>
        </View>
      )) : <EmptyState message="No scans recorded yet." icon="-" />}
    </Page>
  );
}

function HistoryTimeRow({ label, value, color }: { label: string; value?: string; color: string }) {
  return (
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: 10 }}>
      <ThemedText style={{ color, fontSize: 13, fontWeight: '800' }}>{label}</ThemedText>
      <ThemedText style={{ color: value ? '#14212B' : '#A0AAB5', fontSize: 13, fontWeight: '700' }}>{formatTime(value)}</ThemedText>
    </View>
  );
}
