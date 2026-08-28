import { Spacing } from '@/constants/theme';
import { StyleSheet } from 'react-native';
import { ThemedText } from './themed-text';
import { ThemedView } from './themed-view';

interface SummaryCardProps {
  label: string;
  value: string | number;
  color?: 'green' | 'blue' | 'orange' | 'red' | 'gray';
  icon?: string;
}

const colorConfig = {
  green: { backgroundColor: '#D4EDDA', textColor: '#155724', borderColor: '#28A745' },
  blue: { backgroundColor: '#D1ECF1', textColor: '#0C5460', borderColor: '#17A2B8' },
  orange: { backgroundColor: '#FFE5CC', textColor: '#856404', borderColor: '#FFC107' },
  red: { backgroundColor: '#DCE5FF', textColor: '#123BFF', borderColor: '#123BFF' },
  gray: { backgroundColor: '#E2E3E5', textColor: '#383D41', borderColor: '#6C757D' },
};

export function SummaryCard({
  label,
  value,
  color = 'blue',
  icon = '📊',
}: SummaryCardProps) {
  const config = colorConfig[color];

  return (
    <ThemedView
      style={[
        styles.card,
        {
          backgroundColor: config.backgroundColor,
          borderColor: config.borderColor,
        },
      ]}>
      <ThemedText style={styles.icon}>{icon}</ThemedText>
      <ThemedText style={[styles.label, { color: config.textColor }]}>
        {label}
      </ThemedText>
      <ThemedText style={[styles.value, { color: config.textColor }]}>
        {value}
      </ThemedText>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    borderRadius: Spacing.three,
    padding: Spacing.three,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: Spacing.one,
  },
  icon: {
    fontSize: 28,
    marginBottom: Spacing.one,
  },
  label: {
    fontSize: 11,
    fontWeight: '600',
    marginBottom: Spacing.one,
  },
  value: {
    fontSize: 20,
    fontWeight: '700',
  },
});
