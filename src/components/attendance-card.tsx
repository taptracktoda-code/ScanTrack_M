import { Spacing } from '@/constants/theme';
import { StyleSheet } from 'react-native';
import { ThemedText } from './themed-text';
import { ThemedView } from './themed-view';

interface AttendanceCardProps {
  label: string;
  value: string;
  subtext?: string;
  icon?: string;
}

export function AttendanceCard({ label, value, subtext, icon = '🕐' }: AttendanceCardProps) {
  return (
    <ThemedView style={styles.card}>
      <ThemedText style={styles.icon}>{icon}</ThemedText>
      <ThemedText style={styles.label}>{label}</ThemedText>
      <ThemedText style={styles.value}>{value}</ThemedText>
      {subtext && <ThemedText style={styles.subtext}>{subtext}</ThemedText>}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: Spacing.three,
    padding: 12,
    marginBottom: Spacing.two,
    borderWidth: 0,
    borderColor: 'transparent',
    minHeight: 82,
    alignItems: 'center',
  },
  icon: {
    fontSize: 18,
    marginBottom: Spacing.one,
  },
  label: {
    fontSize: 9,
    color: '#666666',
    marginBottom: Spacing.one,
  },
  value: {
    fontSize: 16,
    fontWeight: '700',
    color: '#000000',
  },
  subtext: {
    fontSize: 11,
    color: '#999999',
    marginTop: Spacing.one,
  },
});
