import { Spacing } from '@/constants/theme';
import { StyleSheet, View } from 'react-native';
import { StatusBadge } from './status-badge';
import { ThemedText } from './themed-text';
import { ThemedView } from './themed-view';

interface ScheduleCardProps {
  date: string;
  startTime: string;
  endTime: string;
  terminal?: string;
  unitId?: string;
  status: 'present' | 'absent' | 'upcoming' | 'completed';
  isToday?: boolean;
}

export function ScheduleCard({
  date,
  startTime,
  endTime,
  terminal,
  unitId,
  status,
  isToday,
}: ScheduleCardProps) {
  return (
    <ThemedView style={styles.card}>
      <View style={styles.header}>
        <ThemedText style={styles.date}>
          {date}
          {isToday && <ThemedText style={styles.today}> (Today)</ThemedText>}
        </ThemedText>
        <StatusBadge status={status} />
      </View>

      <ThemedText style={styles.timeRange}>
        {startTime} - {endTime}
      </ThemedText>

      {unitId && (
        <View style={styles.infoRow}>
          <ThemedText style={styles.label}>Unit</ThemedText>
          <ThemedText style={styles.value}>{unitId}</ThemedText>
        </View>
      )}

      {terminal && (
        <View style={styles.infoRow}>
          <ThemedText style={styles.label}>Terminal</ThemedText>
          <ThemedText style={styles.value}>{terminal}</ThemedText>
        </View>
      )}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: Spacing.three,
    padding: Spacing.three,
    marginBottom: Spacing.three,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.two,
  },
  date: {
    fontSize: 13,
    fontWeight: '700',
    color: '#000000',
    flex: 1,
  },
  today: {
    fontSize: 11,
    color: '#208AEF',
    fontWeight: '600',
  },
  timeRange: {
    fontSize: 14,
    fontWeight: '600',
    color: '#208AEF',
    marginBottom: Spacing.two,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: Spacing.one,
  },
  label: {
    fontSize: 11,
    color: '#999999',
  },
  value: {
    fontSize: 12,
    fontWeight: '600',
    color: '#000000',
  },
});
