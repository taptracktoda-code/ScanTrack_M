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
    borderRadius: 18,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E5EBF3',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  date: {
    fontSize: 14,
    fontWeight: '800',
    color: '#172A43',
    flex: 1,
  },
  today: {
    fontSize: 11,
    color: '#1D4ED8',
    fontWeight: '800',
  },
  timeRange: {
    fontSize: 18,
    lineHeight: 25,
    fontWeight: '800',
    color: '#1D4ED8',
    marginBottom: 13,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 9,
  },
  label: {
    fontSize: 11,
    color: '#748198',
  },
  value: {
    fontSize: 12,
    fontWeight: '700',
    color: '#23354D',
  },
});
