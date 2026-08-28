import { Spacing } from '@/constants/theme';
import { StyleSheet, View } from 'react-native';
import { StatusBadge } from './status-badge';
import { ThemedText } from './themed-text';
import { ThemedView } from './themed-view';

interface TripCardProps {
  tripId: string;
  status: 'completed' | 'pending' | 'cancelled';
  destination: string;
  passengerCount: number;
  driver?: string;
  departureTime?: string;
  date?: string;
}

export function TripCard({
  tripId,
  status,
  destination,
  passengerCount,
  driver,
  departureTime,
  date,
}: TripCardProps) {
  return (
    <ThemedView style={styles.card}>
      <View style={styles.header}>
        <StatusBadge status={status} />
      </View>

      <ThemedText style={styles.tripId}>Trip # {tripId}</ThemedText>

      {driver && (
        <ThemedText style={styles.info}>Driver: {driver}</ThemedText>
      )}

      <View style={styles.infoRow}>
        <View style={{ flex: 1 }}>
          <ThemedText style={styles.label}>Drop-off Area</ThemedText>
          <ThemedText style={styles.value}>{destination}</ThemedText>
        </View>
      </View>

      <View style={styles.infoRow}>
        <View>
          <ThemedText style={styles.label}>Passengers</ThemedText>
          <ThemedText style={styles.value}>{passengerCount}</ThemedText>
        </View>
        {departureTime && (
          <View style={{ marginLeft: Spacing.four }}>
            <ThemedText style={styles.label}>Departure</ThemedText>
            <ThemedText style={styles.value}>{departureTime}</ThemedText>
          </View>
        )}
      </View>

      {date && (
        <ThemedText style={styles.date}>{date}</ThemedText>
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
    marginBottom: Spacing.two,
  },
  tripId: {
    fontSize: 14,
    fontWeight: '700',
    color: '#000000',
    marginBottom: Spacing.one,
  },
  info: {
    fontSize: 12,
    color: '#666666',
    marginBottom: Spacing.two,
  },
  infoRow: {
    flexDirection: 'row',
    marginBottom: Spacing.two,
  },
  label: {
    fontSize: 11,
    color: '#999999',
    marginBottom: 2,
  },
  value: {
    fontSize: 13,
    fontWeight: '600',
    color: '#000000',
  },
  date: {
    fontSize: 11,
    color: '#CCCCCC',
    marginTop: Spacing.two,
  },
});
