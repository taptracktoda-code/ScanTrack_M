import { ErrorState } from '@/components/error-state';
import { Header } from '@/components/header';
import { LoadingState } from '@/components/loading-state';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useCallback, useEffect, useState } from 'react';
import { RefreshControl, ScrollView, StyleSheet } from 'react-native';

export function Page({ title, children, loading, error, onRetry, onRefresh, refreshing = false }: { title: string; children?: React.ReactNode; loading?: boolean; error?: string | null; onRetry?: () => void; onRefresh?: () => void; refreshing?: boolean }) {
  return <ThemedView style={styles.page}><Header /><ScrollView refreshControl={onRefresh ? <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#208AEF" /> : undefined} contentContainerStyle={styles.content}>{title ? <ThemedText style={styles.title}>{title}</ThemedText> : null}{loading ? <LoadingState message={`Loading ${title.toLowerCase()}...`} /> : error ? <ErrorState message={error} onRetry={onRetry} /> : children}</ScrollView></ThemedView>;
}

export function useApi<T>(request: () => Promise<T>, initial: T) { const [data, setData] = useState(initial); const [loading, setLoading] = useState(true); const [error, setError] = useState<string | null>(null); const [refreshing, setRefreshing] = useState(false); const load = useCallback(async (pull = false) => { pull ? setRefreshing(true) : setLoading(true); setError(null); try { setData(await request()); } catch { setError('Unable to connect to server. Please check your Internet connection.'); } finally { setLoading(false); setRefreshing(false); } }, [request]); const retry = useCallback(() => load(), [load]); const refresh = useCallback(() => load(true), [load]); useEffect(() => { load(); }, [load]); return { data, loading, error, refreshing, retry, refresh }; }

export const styles = StyleSheet.create({ page: { flex: 1, backgroundColor: '#F7F7F7' }, content: { padding: 16, paddingBottom: 28 }, title: { color: '#14212B', fontSize: 24, fontWeight: '800', marginBottom: 16 }, sectionTitle: { color: '#242424', fontSize: 11, fontWeight: '800', marginTop: 14, marginBottom: 8 }, card: { backgroundColor: '#FFF', borderRadius: 15, borderWidth: 0, padding: 14, marginBottom: 10 }, row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }, muted: { color: '#7B8794', fontSize: 11 }, value: { color: '#14212B', fontSize: 21, fontWeight: '800' }, grid: { flexDirection: 'row', gap: 8 }, stat: { flex: 1, minHeight: 82, padding: 11, borderRadius: 14, backgroundColor: '#FFF', borderWidth: 0 }, statLabel: { color: '#7B8794', fontSize: 10, fontWeight: '700' }, statValue: { color: '#14212B', fontSize: 19, fontWeight: '800', marginTop: 8 } });
