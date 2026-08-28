import { Spacing } from '@/constants/theme';
import { StyleSheet, View } from 'react-native';
import { ThemedText } from './themed-text';

interface StatusBadgeProps {
  status: 'active' | 'completed' | 'off_duty' | 'not_checked_in' | 'present' | 'absent' | 'late' | 'pending' | 'cancelled' | 'upcoming';
  label?: string;
}

const statusConfig: Record<string, { backgroundColor: string; textColor: string; label: string }> = {
  active: { backgroundColor: '#D4EDDA', textColor: '#155724', label: 'Active' },
  completed: { backgroundColor: '#D4EDDA', textColor: '#155724', label: 'Completed' },
  off_duty: { backgroundColor: '#E2E3E5', textColor: '#383D41', label: 'Off Duty' },
  not_checked_in: { backgroundColor: '#DCE5FF', textColor: '#123BFF', label: 'Not Checked In' },
  present: { backgroundColor: '#D4EDDA', textColor: '#155724', label: 'Present' },
  absent: { backgroundColor: '#DCE5FF', textColor: '#123BFF', label: 'Absent' },
  late: { backgroundColor: '#FFF3CD', textColor: '#856404', label: 'Late' },
  pending: { backgroundColor: '#E2E3E5', textColor: '#383D41', label: 'Pending' },
  cancelled: { backgroundColor: '#DCE5FF', textColor: '#123BFF', label: 'Cancelled' },
  upcoming: { backgroundColor: '#D1ECF1', textColor: '#0C5460', label: 'Upcoming' },
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
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.one,
    borderRadius: Spacing.three,
    alignSelf: 'flex-start',
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '600',
  },
});
