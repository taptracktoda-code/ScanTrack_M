import { Spacing } from '@/constants/theme';
import { formatDate, formatTime } from '@/utils/dateFormatter';
import { StyleSheet, View } from 'react-native';
import { ThemedText } from './themed-text';
import { ThemedView } from './themed-view';

interface AttendanceRecordProps {
  type: 'entry' | 'exit';
  date: string;
  time: string;
  verified: boolean;
}

export function AttendanceRecord({ type, date, time, verified }: AttendanceRecordProps) {
  const isEntry = type === 'entry';
  const textColor = isEntry ? '#155724' : '#123BFF';
  const icon = isEntry ? '📍' : '🔚';

  return (
    <ThemedView style={[styles.container, { borderLeftColor: isEntry ? '#28A745' : '#123BFF' }]}>
      <View style={styles.row}>
        <View style={{ flex: 1 }}>
          <View style={styles.header}>
            <ThemedText style={[styles.type, { color: textColor }]}>
              {icon} {type.toUpperCase()}
            </ThemedText>
            {verified && (
              <ThemedText style={styles.verified}>✓ Verified</ThemedText>
            )}
          </View>
          <ThemedText style={styles.date}>{formatDate(date)}</ThemedText>
          <ThemedText style={[styles.time, { color: textColor }]}>{formatTime(time)}</ThemedText>
        </View>
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    borderRadius: Spacing.two,
    padding: Spacing.three,
    marginBottom: Spacing.two,
    borderLeftWidth: 4,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.one,
    gap: Spacing.two,
  },
  type: {
    fontSize: 13,
    fontWeight: '700',
  },
  date: {
    fontSize: 12,
    color: '#999999',
    marginBottom: 2,
  },
  time: {
    fontSize: 14,
    fontWeight: '600',
  },
  verified: {
    fontSize: 11,
    color: '#28A745',
    fontWeight: '600',
    backgroundColor: '#D4EDDA',
    paddingHorizontal: Spacing.two,
    paddingVertical: 2,
    borderRadius: Spacing.one,
  },
});
