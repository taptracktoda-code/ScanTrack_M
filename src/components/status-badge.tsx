import { StyleSheet, View } from 'react-native';
import { ThemedText } from './themed-text';

interface StatusBadgeProps {
  status: 'active' | 'completed' | 'in_progress' | 'off_duty' | 'not_checked_in' | 'present' | 'absent' | 'late' | 'pending' | 'cancelled' | 'upcoming';
  label?: string;
}

const statusConfig: Record<string, { backgroundColor: string; textColor: string; label: string }> = {
  active: { backgroundColor: '#DDF7EC', textColor: '#08744F', label: 'Active' },
  completed: { backgroundColor: '#DDF7EC', textColor: '#08744F', label: 'Completed' },
  in_progress: { backgroundColor: '#DBEAFE', textColor: '#1D4ED8', label: 'In Progress' },
  off_duty: { backgroundColor: '#E9EEF4', textColor: '#526176', label: 'Off Duty' },
  not_checked_in: { backgroundColor: '#DBEAFE', textColor: '#1D4ED8', label: 'Not Checked In' },
  present: { backgroundColor: '#DDF7EC', textColor: '#08744F', label: 'Present' },
  absent: { backgroundColor: '#FEE2E2', textColor: '#B42318', label: 'Absent' },
  late: { backgroundColor: '#FEF3C7', textColor: '#A16207', label: 'Late' },
  pending: { backgroundColor: '#E9EEF4', textColor: '#526176', label: 'Pending' },
  cancelled: { backgroundColor: '#FEE2E2', textColor: '#B42318', label: 'Cancelled' },
  upcoming: { backgroundColor: '#DBEAFE', textColor: '#1D4ED8', label: 'Upcoming' },
};

export function StatusBadge({ status, label }: StatusBadgeProps) {
  const config = statusConfig[status];
  if (!config) return null;

  return (
    <View style={[styles.badge, { backgroundColor: config.backgroundColor }]}>
      <ThemedText style={[styles.badgeText, { color: config.textColor }]}>
        {label || config.label}
      </ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: 11,
    paddingVertical: 6,
    borderRadius: 999,
    alignSelf: 'flex-start',
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '800',
  },
});
