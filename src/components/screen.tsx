import { ReactNode } from 'react';
import { RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Header } from './header';
import { ThemedText } from './themed-text';
import { ThemedView } from './themed-view';

export function Screen({ children, refreshing, onRefresh, title }: { children: ReactNode; refreshing?: boolean; onRefresh?: () => void; title?: string }) {
  const insets = useSafeAreaInsets();
  return <ThemedView style={styles.root}><Header /><ScrollView refreshControl={onRefresh ? <RefreshControl refreshing={!!refreshing} onRefresh={onRefresh} tintColor="#1677D2" /> : undefined} contentContainerStyle={{ padding: 20, paddingBottom: insets.bottom + 24 }}>{title && <ThemedText style={styles.title}>{title}</ThemedText>}{children}</ScrollView></ThemedView>;
}
export function SectionTitle({ children }: { children: ReactNode }) { return <View style={styles.section}><ThemedText style={styles.sectionTitle}>{children}</ThemedText></View>; }
const styles = StyleSheet.create({ root: { flex: 1, backgroundColor: '#F7F9FC' }, title: { fontSize: 28, fontWeight: '800', marginBottom: 20 }, section: { marginTop: 12, marginBottom: 12 }, sectionTitle: { fontSize: 17, fontWeight: '800' } });
