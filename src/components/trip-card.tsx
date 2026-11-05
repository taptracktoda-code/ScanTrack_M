import { Spacing } from '@/constants/theme';
import type { Trip } from '@/types';
import { StyleSheet, View } from 'react-native';
import { StatusBadge } from './status-badge';
import { ThemedText } from './themed-text';
import { ThemedView } from './themed-view';

interface TripCardProps {
  tripId: string;
  status: Trip['status'];
  destination: string;
  passengerCount: number;
  driver?: string;
  departureTime?: string;
  arrivalTime?: string;
  date?: string;
}

export function TripCard({
  tripId,
  status,
  destination,
  passengerCount,
  driver,
  departureTime,
  arrivalTime,
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
        {arrivalTime && (
          <View style={{ marginLeft: Spacing.four }}>
            <ThemedText style={styles.label}>Arrival</ThemedText>
            <ThemedText style={styles.value}>{arrivalTime}</ThemedText>
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
    borderRadius: 18,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E5EBF3',
  },
  header: {
    marginBottom: 10,
  },
  tripId: {
    fontSize: 15,
    fontWeight: '800',
    color: '#172A43',
    marginBottom: 6,
  },
  info: {
    fontSize: 12,
    color: '#748198',
    marginBottom: 11,
  },
  infoRow: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  label: {
    fontSize: 10,
    color: '#748198',
    fontWeight: '700',
    marginBottom: 4,
  },
  value: {
    fontSize: 13,
    fontWeight: '700',
    color: '#23354D',
  },
  date: {
    fontSize: 11,
    color: '#8793A5',
    marginTop: 2,
  },
});
