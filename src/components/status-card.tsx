import { Spacing } from '@/constants/theme';
import { StyleSheet, View } from 'react-native';
import { StatusBadge } from './status-badge';
import { ThemedText } from './themed-text';
import { ThemedView } from './themed-view';

interface StatusCardProps {
  status: 'active' | 'completed' | 'off_duty' | 'not_checked_in';
  title: string;
  subtitle: string;
  message: string;
}

export function StatusCard({ status, title, subtitle, message }: StatusCardProps) {
  const statusColors: Record<typeof status, string> = {
    active: '#208AEF',
    completed: '#28A745',
    off_duty: '#6C757D',
    not_checked_in: '#123BFF',
  };

  return (
    <ThemedView
      style={[
        styles.card,
        { backgroundColor: status === 'active' ? '#123BFF' : statusColors[status] },
      ]}>
      <View style={styles.header}>
        <ThemedText style={styles.profileIcon}>👤</ThemedText>
        <View style={{ flex: 1 }}>
          <ThemedText style={styles.title}>{title}</ThemedText>
          <ThemedText style={styles.subtitle}>{subtitle}</ThemedText>
        </View>
      </View>

      <ThemedText style={styles.message}>{message}</ThemedText>

      <View style={styles.footer}>
        <StatusBadge status={status} />
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: Spacing.three,
    padding: 14,
    marginBottom: 14,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  profileIcon: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#FFFFFF',
    color: '#7D7D7D',
    fontSize: 25,
    lineHeight: 52,
    textAlign: 'center',
    marginRight: Spacing.three,
  },
  title: {
    fontSize: 10,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  subtitle: {
    fontSize: 9,
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: 2,
  },
  message: {
    fontSize: 10,
    color: '#FFFFFF',
    marginBottom: Spacing.three,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
});
