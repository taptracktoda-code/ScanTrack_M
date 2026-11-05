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
  const statusColors: Record<typeof status, { background: string; accent: string; label: string }> = {
    active: { background: '#ECFDF5', accent: '#059669', label: 'Checked in' },
    completed: { background: '#EFF6FF', accent: '#2563EB', label: 'Shift complete' },
    off_duty: { background: '#F1F5F9', accent: '#64748B', label: 'Off duty' },
    not_checked_in: { background: '#EFF6FF', accent: '#2563EB', label: 'Ready to check in' },
  };
  const colors = statusColors[status];

  return (
    <ThemedView style={[styles.card, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <View style={[styles.statusMark, { backgroundColor: colors.accent }]} />
        <View style={{ flex: 1 }}>
          <ThemedText style={[styles.eyebrow, { color: colors.accent }]}>{title}</ThemedText>
          <ThemedText style={styles.title}>{subtitle}</ThemedText>
        </View>
        <StatusBadge status={status} label={colors.label} />
      </View>

      <ThemedText style={styles.message}>{message}</ThemedText>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 20,
    padding: 18,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#E4EBF3',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 13,
  },
  statusMark: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 12,
  },
  eyebrow: {
    fontSize: 10,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  title: {
    fontSize: 18,
    lineHeight: 24,
    fontWeight: '800',
    color: '#172A43',
    marginTop: 3,
  },
  message: {
    fontSize: 13,
    lineHeight: 19,
    color: '#52647B',
  },
});
