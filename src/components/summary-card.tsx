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
  green: { backgroundColor: '#ECFDF5', textColor: '#08744F', borderColor: '#A7E8CB' },
  blue: { backgroundColor: '#EFF6FF', textColor: '#1D4ED8', borderColor: '#BFDBFE' },
  orange: { backgroundColor: '#FFFBEB', textColor: '#A16207', borderColor: '#FDE68A' },
  red: { backgroundColor: '#FEF2F2', textColor: '#B42318', borderColor: '#FECACA' },
  gray: { backgroundColor: '#F1F5F9', textColor: '#526176', borderColor: '#DCE3EB' },
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
          backgroundColor: '#FFFFFF',
          borderColor: config.borderColor,
        },
      ]}>
      <ThemedText style={[styles.icon, { backgroundColor: config.backgroundColor, color: config.textColor }]}>{icon}</ThemedText>
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
    borderRadius: 17,
    padding: 14,
    borderWidth: 1,
    alignItems: 'flex-start',
    justifyContent: 'center',
    marginHorizontal: 3,
    minHeight: 112,
  },
  icon: {
    width: 34,
    height: 34,
    borderRadius: 11,
    overflow: 'hidden',
    textAlign: 'center',
    textAlignVertical: 'center',
    fontSize: 19,
    marginBottom: 11,
  },
  label: {
    fontSize: 11,
    fontWeight: '700',
    marginBottom: Spacing.one,
  },
  value: {
    fontSize: 22,
    fontWeight: '800',
  },
});
