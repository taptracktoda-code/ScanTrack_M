import { EmptyState } from '@/components';
import { Page, useApi } from '@/components/page';
import { ThemedText } from '@/components/themed-text';
import { useAuth } from '@/context/auth';
import { apiService } from '@/services/api';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

export default function AdminDashboardScreen() {
  const { user } = useAuth();
  const router = useRouter();
  const request = useCallback(async () => {
    const localTransactions = await apiService.getLocalAdminTransactions();
    try {
      const remoteData = await apiService.getAdminDashboardSummary();
      const response = remoteData?.data || remoteData || {};
      const summary = response.summary || response.dashboard || response.statistics || response;
      const remoteCandidate = Array.isArray(summary) ? summary : summary.recent_activity || summary.recent_transactions || summary.transactions || summary.data;
      const transactions = [...localTransactions, ...(Array.isArray(remoteCandidate) ? remoteCandidate : [])];
      return { ...response, summary: { ...summary, recent_activity: transactions } };
    } catch (error) {
      if (localTransactions.length) return { summary: { recent_activity: localTransactions } };
      throw error;
    }
  }, []);
  const { data, loading, error, retry, refresh, refreshing } = useApi(request, {} as any);
  useFocusEffect(useCallback(() => {
    refresh();
  }, [refresh]));
  const response = data?.data || data || {};
  const summary = response.summary || response.dashboard || response.statistics || response;
  const transactionCandidate = Array.isArray(summary) ? summary : summary.recent_activity || summary.recent_transactions || summary.transactions || summary.data;
  const transactions = Array.isArray(transactionCandidate) ? transactionCandidate : [];
  const today = new Date().toDateString();
  const todayTransactions = transactions.filter((item: any) => {
    const timestamp = item.timestamp || item.created_at || item.date;
    return timestamp && new Date(timestamp).toString() !== 'Invalid Date' && new Date(timestamp).toDateString() === today;
  });
  const entries = summary.today_entries ?? summary.entries_today ?? todayTransactions.filter((item: any) => isEntry(item)).length;
  const exits = summary.today_exits ?? summary.exits_today ?? todayTransactions.filter((item: any) => !isEntry(item)).length;
  const configuredInsideDrivers = Array.isArray(summary.inside_drivers) ? summary.inside_drivers : Array.isArray(summary.drivers_currently_inside) ? summary.drivers_currently_inside : [];
  const derivedInsideDrivers = getInsideDrivers(transactions);
  const insideDrivers = derivedInsideDrivers.length ? derivedInsideDrivers : configuredInsideDrivers;
  const configuredInsideCount = summary.currently_inside ?? summary.drivers_inside ?? summary.inside_now;
  const currentlyInside = derivedInsideDrivers.length ? derivedInsideDrivers.length : configuredInsideCount ?? Math.max(0, Number(entries) - Number(exits));

  return (
    <Page title="Admin Dashboard" loading={loading} error={error} onRetry={retry} onRefresh={refresh} refreshing={refreshing}>
      <ThemedText style={screenStyles.eyebrow}>OPERATIONS OVERVIEW</ThemedText>
      <ThemedText style={screenStyles.welcome}>Welcome back, {user?.name || 'Admin'}</ThemedText>

      <ThemedText style={screenStyles.sectionHeading}>Overview</ThemedText>
      <View style={screenStyles.statsGrid}>
        <StatCard icon="♙" value={summary.total_drivers ?? summary.drivers_total ?? '—'} label="Registered drivers" />
        <StatCard icon="✓" value={summary.active_drivers ?? summary.drivers_active ?? '—'} label="Active drivers" />
        <StatCard icon="↗" value={entries} label="Scanned entries" />
        <StatCard icon="↙" value={exits} label="Scanned exits" />
      </View>

      <View style={screenStyles.insideCard}>
        <View style={screenStyles.insideIcon}><ThemedText style={screenStyles.iconText}>⌂</ThemedText></View>
        <View style={screenStyles.insideCopy}>
          <ThemedText style={screenStyles.cardLabel}>Drivers inside</ThemedText>
          <ThemedText style={screenStyles.insideValue}>{String(currentlyInside)}</ThemedText>
        </View>
        <ThemedText style={screenStyles.insideHint}>LIVE</ThemedText>
      </View>

      <ThemedText style={screenStyles.sectionHeading}>Quick action</ThemedText>
      <Pressable onPress={() => router.push('/admin/scan')} style={({ pressed }) => [screenStyles.scanButton, pressed && screenStyles.pressed]}>
        <View style={screenStyles.scanIcon}><ThemedText style={screenStyles.scanIconText}>▣</ThemedText></View>
        <View style={screenStyles.scanCopy}>
          <ThemedText style={screenStyles.scanButtonText}>Scan driver QR</ThemedText>
          <ThemedText style={screenStyles.scanDescription}>Record an entry or exit</ThemedText>
        </View>
        <ThemedText style={screenStyles.arrow}>›</ThemedText>
      </Pressable>

      <SectionHeader title="Today's activity" />
      {todayTransactions.length ? todayTransactions.slice(0, 5).map((item: any, index: number) => <ActivityRow key={`${item.id || index}`} item={item} />) : <EmptyState message="No activity recorded today." icon="—" />}

      <View style={screenStyles.driversHeader}>
        <ThemedText style={screenStyles.sectionHeading}>Drivers inside</ThemedText>
        <ThemedText style={screenStyles.viewAll}>View all</ThemedText>
      </View>
      {insideDrivers.length ? insideDrivers.slice(0, 4).map((driver: any, index: number) => (
        <View key={`${driver.id || index}`} style={screenStyles.driverRow}>
          <ThemedText style={screenStyles.driverName}>{driver.name || driver.driver_name || driver.driver?.name || 'Driver'}</ThemedText>
          <ThemedText style={screenStyles.status}>Inside</ThemedText>
        </View>
      )) : <EmptyState message="No drivers currently inside." icon="—" />}
    </Page>
  );
}

function StatCard({ icon, value, label }: { icon: string; value: unknown; label: string }) {
  return <View style={screenStyles.statCard}><View style={screenStyles.statIcon}><ThemedText style={screenStyles.iconText}>{icon}</ThemedText></View><ThemedText style={screenStyles.statValue}>{String(value)}</ThemedText><ThemedText style={screenStyles.statLabel}>{label}</ThemedText></View>;
}

function SectionHeader({ title }: { title: string }) {
  return <View style={screenStyles.sectionRow}><ThemedText style={screenStyles.sectionHeading}>{title}</ThemedText><ThemedText style={screenStyles.viewAll}>Latest</ThemedText></View>;
}

function ActivityRow({ item }: { item: any }) {
  const timestamp = item.timestamp || item.created_at;
  const entry = isEntry(item);
  return <View style={screenStyles.activityRow}><View style={[screenStyles.activityDot, { backgroundColor: entry ? '#22C55E' : '#2563EB' }]} /><View style={screenStyles.activityCopy}><ThemedText style={screenStyles.activityName}>{item.driver?.name || item.driver_name || item.name || 'Driver'}</ThemedText><ThemedText style={screenStyles.activityMeta}>Plate: {item.driver?.plate_number || item.plate_number || item.plate || '—'}</ThemedText></View><View style={screenStyles.activityRight}><ThemedText style={screenStyles.activityType}>{entry ? 'Entry' : 'Exit'}</ThemedText><ThemedText style={screenStyles.activityTime}>{timestamp ? new Date(timestamp).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }) : 'Recent'}</ThemedText></View></View>;
}

function isEntry(item: any) {
  const value = String(item.transaction || item.transaction_type || item.type || item.action || '').toLowerCase();
  return value === 'entry' || value === 'in' || value === 'check_in';
}

function getInsideDrivers(transactions: any[]) {
  const states = new Map<string, { id: string; name: string; plate?: string }>();
  [...transactions].sort((left, right) => getTimestamp(left) - getTimestamp(right)).forEach((item) => {
    const driver = item.driver || {};
    const name = String(driver.name || item.driver_name || item.name || 'Driver');
    const id = String(driver.id || item.driver_id || name);
    const record = { id, name, plate: driver.plate_number || item.plate_number || item.vehicle_number };
    const hasEntry = Boolean(item.entry_time) || isEntry(item);
    const hasExit = Boolean(item.exit_time) || (!isEntry(item) && Boolean(item.timestamp || item.created_at));
    if (hasEntry && !item.exit_time) states.set(id, record);
    if (hasExit && !item.entry_time && !isEntry(item)) states.delete(id);
  });
  return Array.from(states.values());
}

function getTimestamp(item: any) {
  const value = item.timestamp || item.created_at || item.entry_time || item.exit_time;
  const timestamp = value ? new Date(value).getTime() : 0;
  return Number.isNaN(timestamp) ? 0 : timestamp;
}

const screenStyles = StyleSheet.create({
  eyebrow: { color: '#2563EB', fontSize: 11, fontWeight: '800', letterSpacing: 1.1, marginTop: -5 },
  welcome: { color: '#64748B', fontSize: 14, marginTop: 4 },
  sectionHeading: { color: '#0F172A', fontSize: 16, fontWeight: '800' },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 12 },
  statCard: { flex: 1, minWidth: '46%', minHeight: 112, padding: 13, borderRadius: 14, backgroundColor: '#FFF', borderWidth: 1, borderColor: '#E2E8F0' },
  statIcon: { width: 30, height: 30, borderRadius: 9, backgroundColor: '#EFF6FF', alignItems: 'center', justifyContent: 'center' },
  iconText: { color: '#2563EB', fontSize: 17, fontWeight: '800' },
  statValue: { color: '#0F172A', fontSize: 25, fontWeight: '800', marginTop: 10 },
  statLabel: { color: '#64748B', fontSize: 11, fontWeight: '700', marginTop: 2 },
  insideCard: { flexDirection: 'row', alignItems: 'center', marginTop: 10, padding: 14, borderRadius: 14, backgroundColor: '#FFF', borderWidth: 1, borderColor: '#E2E8F0' },
  insideIcon: { width: 38, height: 38, borderRadius: 11, backgroundColor: '#EFF6FF', alignItems: 'center', justifyContent: 'center' },
  insideCopy: { flex: 1, marginLeft: 11 },
  cardLabel: { color: '#64748B', fontSize: 12, fontWeight: '700' },
  insideValue: { color: '#0F172A', fontSize: 22, fontWeight: '800', marginTop: 2 },
  insideHint: { color: '#22C55E', fontSize: 10, fontWeight: '800' },
  sectionRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 22, marginBottom: 9 },
  viewAll: { color: '#2563EB', fontSize: 11, fontWeight: '800' },
  scanButton: { flexDirection: 'row', alignItems: 'center', padding: 14, borderRadius: 14, backgroundColor: '#2563EB', marginTop: 10 },
  pressed: { opacity: 0.84 },
  scanIcon: { width: 38, height: 38, borderRadius: 11, backgroundColor: 'rgba(255,255,255,0.18)', alignItems: 'center', justifyContent: 'center' },
  scanIconText: { color: '#FFF', fontSize: 20 },
  scanCopy: { flex: 1, marginLeft: 11 },
  scanButtonText: { color: '#FFF', fontSize: 15, fontWeight: '800' },
  scanDescription: { color: '#DBEAFE', fontSize: 11, marginTop: 3 },
  arrow: { color: '#FFF', fontSize: 28, fontWeight: '300' },
  activityRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#E2E8F0' },
  activityDot: { width: 8, height: 8, borderRadius: 4, marginRight: 10 },
  activityCopy: { flex: 1 },
  activityName: { color: '#0F172A', fontSize: 14, fontWeight: '800' },
  activityMeta: { color: '#64748B', fontSize: 11, marginTop: 3 },
  activityRight: { alignItems: 'flex-end' },
  activityType: { color: '#0F172A', fontSize: 12, fontWeight: '800' },
  activityTime: { color: '#64748B', fontSize: 11, marginTop: 3 },
  driversHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 22, marginBottom: 9 },
  driverRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 11, borderBottomWidth: 1, borderBottomColor: '#E2E8F0' },
  driverName: { color: '#0F172A', fontSize: 14, fontWeight: '700' },
  status: { color: '#16A34A', fontSize: 11, fontWeight: '800' },
});
