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
  const textColor = isEntry ? '#08744F' : '#1D4ED8';
  const icon = isEntry ? '↗' : '↘';

  return (
    <ThemedView style={[styles.container, { borderLeftColor: textColor }]}>
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
    borderRadius: 16,
    padding: 15,
    marginBottom: 10,
    borderLeftWidth: 3,
    borderWidth: 1,
    borderColor: '#E5EBF3',
    borderLeftColor: '#08744F',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  header: {
    flexWrap: 'wrap',
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.one,
    gap: Spacing.two,
  },
  type: {
    fontSize: 12,
    fontWeight: '800',
  },
  date: {
    fontSize: 11,
    color: '#748198',
    marginBottom: 2,
  },
  time: {
    fontSize: 16,
    fontWeight: '800',
  },
  verified: {
    fontSize: 10,
    color: '#08744F',
    fontWeight: '800',
    backgroundColor: '#DDF7EC',
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 999,
  },
});
