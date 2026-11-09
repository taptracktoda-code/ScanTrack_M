import { ThemedText } from '@/components/themed-text';
import { useNotifications } from '@/context/notifications';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useMemo } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, View } from 'react-native';

export function NotificationsPanel({ onClose }: { onClose: () => void }) {
  const insets = useSafeAreaInsets();
  const { notifications, loading, error, pushError, markAsRead, markAllAsRead, refresh, openNotification } = useNotifications();
  const sortedNotifications = useMemo(
    () => [...notifications].sort((left, right) => new Date(right.created_at).getTime() - new Date(left.created_at).getTime()),
    [notifications],
  );

  return (
    <View style={styles.overlay}>
      <Pressable style={styles.backdrop} onPress={onClose} />
      <View style={[styles.panel, { paddingTop: insets.top + 20, paddingBottom: insets.bottom + 14, paddingRight: insets.right }]}>
        <View style={styles.header}>
          <View>
            <ThemedText style={styles.title}>Notifications</ThemedText>
            <ThemedText style={styles.subtitle}>{sortedNotifications.length ? `${sortedNotifications.length} total` : 'No notifications yet'}</ThemedText>
          </View>
          <Pressable onPress={onClose} style={styles.closeButton}>
            <ThemedText style={styles.closeButtonText}>Close</ThemedText>
          </Pressable>
        </View>

        {loading ? <ActivityIndicator style={styles.spinner} color="#208AEF" /> : null}
        {error ? <ThemedText style={styles.error}>{error}</ThemedText> : null}
        {pushError ? <ThemedText style={styles.error}>{pushError}</ThemedText> : null}

        {sortedNotifications.length ? (
          <Pressable onPress={() => void markAllAsRead()} style={styles.markAllButton}>
            <ThemedText style={styles.markAllButtonText}>Mark all as read</ThemedText>
          </Pressable>
        ) : null}

        <ScrollView style={styles.list} contentContainerStyle={styles.listContent}>
          {sortedNotifications.length ? sortedNotifications.map((notification) => (
            <Pressable
              key={String(notification.id)}
              onPress={() => {
                if (!notification.is_read) void markAsRead(String(notification.id));
                openNotification(notification.data);
              }}
              style={({ pressed }) => [styles.item, !notification.is_read && styles.unreadItem, pressed && styles.pressed]}
            >
              <View style={[styles.dot, { backgroundColor: notification.type === 'system' ? '#2563EB' : '#16A34A' }]} />
              <View style={styles.itemCopy}>
                <ThemedText style={styles.itemTitle}>{notification.title}</ThemedText>
                <ThemedText style={styles.itemMessage}>{notification.message}</ThemedText>
                <ThemedText style={styles.itemTime}>{formatTime(notification.created_at)}</ThemedText>
              </View>
              {!notification.is_read ? <View style={styles.unreadMarker} /> : null}
            </Pressable>
          )) : (
            <View style={styles.emptyState}>
              <ThemedText style={styles.emptyIcon}>🔔</ThemedText>
              <ThemedText style={styles.emptyTitle}>{error ? 'Notifications unavailable' : 'You’re all caught up'}</ThemedText>
              <ThemedText style={styles.emptyMessage}>{error ? 'Check the notification API route and try again.' : 'New account, registration, and security updates will appear here.'}</ThemedText>
            </View>
          )}
        </ScrollView>

        <Pressable onPress={() => void refresh()} style={styles.refreshButton}>
          <ThemedText style={styles.refreshButtonText}>Refresh notifications</ThemedText>
        </Pressable>
      </View>
    </View>
  );
}

function formatTime(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Recent';
  return date.toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' });
}

const styles = StyleSheet.create({
  overlay: { ...StyleSheet.absoluteFill, zIndex: 50, flexDirection: 'row', justifyContent: 'flex-end', backgroundColor: 'rgba(15, 23, 42, 0.28)' },
  backdrop: { ...StyleSheet.absoluteFill },
  panel: { width: '92%', maxWidth: 440, height: '100%', backgroundColor: '#FFF', paddingTop: 20, paddingBottom: 14, shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 18, elevation: 15 },
  header: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 18, paddingBottom: 14, borderBottomWidth: 1, borderBottomColor: '#E2E8F0' },
  title: { color: '#14212B', fontSize: 20, fontWeight: '800' },
  subtitle: { color: '#64748B', fontSize: 11, marginTop: 3 },
  closeButton: { paddingVertical: 6, paddingHorizontal: 10 },
  closeButtonText: { color: '#208AEF', fontSize: 12, fontWeight: '800' },
  markAllButton: { alignSelf: 'flex-end', marginRight: 18, marginTop: 12 },
  markAllButtonText: { color: '#2563EB', fontSize: 11, fontWeight: '800' },
  list: { flex: 1, marginTop: 8 },
  listContent: { paddingHorizontal: 18, paddingBottom: 18 },
  item: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
  unreadItem: { backgroundColor: '#F8FBFF' },
  pressed: { opacity: 0.82 },
  dot: { width: 9, height: 9, borderRadius: 5, marginTop: 5 },
  itemCopy: { flex: 1 },
  itemTitle: { color: '#0F172A', fontSize: 14, fontWeight: '800' },
  itemMessage: { color: '#64748B', fontSize: 12, lineHeight: 18, marginTop: 4 },
  itemTime: { color: '#94A3B8', fontSize: 10, marginTop: 6 },
  unreadMarker: { width: 8, height: 8, marginTop: 4, backgroundColor: '#2563EB', borderRadius: 4 },
  refreshButton: { marginHorizontal: 18, paddingVertical: 12, borderRadius: 12, backgroundColor: '#0F172A', alignItems: 'center' },
  refreshButtonText: { color: '#FFF', fontSize: 12, fontWeight: '800' },
  spinner: { marginTop: 18 },
  error: { color: '#B42318', marginHorizontal: 18, marginTop: 12, fontSize: 12 },
  emptyState: { alignItems: 'center', paddingVertical: 40 },
  emptyIcon: { fontSize: 26 },
  emptyTitle: { color: '#0F172A', fontSize: 16, fontWeight: '800', marginTop: 10 },
  emptyMessage: { color: '#64748B', fontSize: 12, textAlign: 'center', marginTop: 6, lineHeight: 18 },
});
