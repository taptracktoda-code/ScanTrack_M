import { ErrorState } from '@/components/error-state';
import { Header } from '@/components/header';
import { LoadingState } from '@/components/loading-state';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { API_BASE_URL } from '@/services/api';
import { useCallback, useEffect, useState } from 'react';
import { RefreshControl, ScrollView, StyleSheet } from 'react-native';

export function Page({ title, children, loading, error, onRetry, onRefresh, refreshing = false }: { title: string; children?: React.ReactNode; loading?: boolean; error?: string | null; onRetry?: () => void; onRefresh?: () => void; refreshing?: boolean }) {
  return <ThemedView style={styles.page}><Header /><ScrollView refreshControl={onRefresh ? <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#208AEF" /> : undefined} contentContainerStyle={styles.content}>{title ? <ThemedText style={styles.title}>{title}</ThemedText> : null}{loading ? <LoadingState message={`Loading ${title.toLowerCase()}...`} /> : error ? <ErrorState message={error} onRetry={onRetry} /> : children}</ScrollView></ThemedView>;
}

export function useApi<T>(request: () => Promise<T>, initial: T) {
  const [data, setData] = useState(initial);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const load = useCallback(async (pull = false) => {
    if (pull) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }
    setError(null);
    try {
      setData(await request());
    } catch (requestError: unknown) {
      const apiError = requestError as {
        code?: string;
        message?: string;
        response?: { status?: number; data?: { message?: string; errors?: Record<string, unknown> } };
      };
      const status = apiError.response?.status;
      const serverMessage = apiError.response?.data?.message;
      const validationMessages = Object.values(apiError.response?.data?.errors || {})
        .flatMap((value) => Array.isArray(value) ? value : [value])
        .filter((value): value is string => typeof value === 'string');

      if (status === 401) {
        setError('Your sign-in session is no longer valid. Sign out and sign in again. Contact your Manager if you do not have a driver account yet.');
      } else if (status === 403) {
        setError(serverMessage || 'This account is not authorized to access this information.');
      } else if (status === 422) {
        setError(validationMessages.join(' ') || serverMessage || 'The server could not process this request. Check the request details and try again.');
      } else if (status) {
        setError(serverMessage || `The server returned HTTP ${status}.`);
      } else if (apiError.code === 'ERR_NETWORK' || apiError.message === 'Network Error') {
        setError(`Cannot reach ${API_BASE_URL}. Check that your phone and computer are on the same Wi-Fi and that Laravel is running. If you use an Android APK with an HTTP API, rebuild and reinstall the app after this update.`);
      } else {
        setError(apiError.message || 'Unable to load data.');
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [request]);
  const retry = useCallback(() => load(), [load]);
  const refresh = useCallback(() => load(true), [load]);
  useEffect(() => {
    const timer = setTimeout(() => { void load(); }, 0);
    return () => clearTimeout(timer);
  }, [load]);
  return { data, loading, error, refreshing, retry, refresh };
}

export const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: '#F4F7FB' },
  content: { paddingHorizontal: 18, paddingTop: 12, paddingBottom: 32 },
  title: { color: '#14243A', fontSize: 27, lineHeight: 33, fontWeight: '800', marginBottom: 18, letterSpacing: -0.4 },
  sectionTitle: { color: '#23354D', fontSize: 15, fontWeight: '800', marginTop: 20, marginBottom: 10 },
  card: { backgroundColor: '#FFF', borderRadius: 18, borderWidth: 1, borderColor: '#E8EDF4', padding: 16, marginBottom: 12 },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  muted: { color: '#748198', fontSize: 12 },
  value: { color: '#14243A', fontSize: 22, fontWeight: '800' },
  grid: { flexDirection: 'row', gap: 10 },
  stat: { flex: 1, minHeight: 88, padding: 14, borderRadius: 16, backgroundColor: '#FFF', borderWidth: 1, borderColor: '#E8EDF4' },
  statLabel: { color: '#748198', fontSize: 11, fontWeight: '700' },
  statValue: { color: '#14243A', fontSize: 21, fontWeight: '800', marginTop: 8 },
});
