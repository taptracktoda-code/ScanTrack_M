import { Spacing } from '@/constants/theme';
import { StyleSheet, TouchableOpacity } from 'react-native';
import { ThemedText } from './themed-text';
import { ThemedView } from './themed-view';

interface DateSelectorProps {
  date: Date;
  onPrevious: () => void;
  onNext: () => void;
  onDatePress?: () => void;
  label?: string;
}

export function DateSelector({
  date,
  onPrevious,
  onNext,
  onDatePress,
  label,
}: DateSelectorProps) {
  const dateString = date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <ThemedView style={styles.container}>
      <TouchableOpacity onPress={onPrevious} style={styles.button}>
        <ThemedText style={styles.buttonText}>‹</ThemedText>
      </TouchableOpacity>

      <TouchableOpacity
        onPress={onDatePress}
        style={styles.dateDisplay}>
        <ThemedText style={styles.label}>{label || 'Date'}</ThemedText>
        <ThemedText style={styles.date}>{dateString}</ThemedText>
      </TouchableOpacity>

      <TouchableOpacity onPress={onNext} style={styles.button}>
        <ThemedText style={styles.buttonText}>›</ThemedText>
      </TouchableOpacity>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.two,
    paddingVertical: Spacing.three,
    backgroundColor: '#F9F9F9',
    borderRadius: Spacing.three,
    marginBottom: Spacing.three,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  button: {
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
  },
  buttonText: {
    fontSize: 28,
    color: '#208AEF',
    fontWeight: '600',
  },
  dateDisplay: {
    flex: 1,
    alignItems: 'center',
  },
  label: {
    fontSize: 11,
    color: '#999999',
    marginBottom: 2,
  },
  date: {
    fontSize: 14,
    fontWeight: '700',
    color: '#000000',
  },
});
