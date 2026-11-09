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
    flexGrow: 1,
    flexBasis: 140,
    minWidth: 0,
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 15,
    marginBottom: Spacing.two,
    borderWidth: 1,
    borderColor: '#E8EDF4',
    minHeight: 112,
    alignItems: 'flex-start',
    justifyContent: 'center',
  },
  icon: {
    fontSize: 18,
    marginBottom: 8,
  },
  label: {
    fontSize: 11,
    fontWeight: '700',
    color: '#748198',
    marginBottom: Spacing.one,
  },
  value: {
    fontSize: 18,
    fontWeight: '800',
    color: '#172A43',
  },
  subtext: {
    fontSize: 10,
    color: '#8A96A8',
    marginTop: Spacing.one,
  },
});
