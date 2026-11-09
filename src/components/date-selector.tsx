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
      <TouchableOpacity onPress={onPrevious} style={styles.button} accessibilityLabel="Previous date">
        <ThemedText style={styles.buttonText}>‹</ThemedText>
      </TouchableOpacity>

      <TouchableOpacity
        onPress={onDatePress}
        style={styles.dateDisplay}>
        <ThemedText style={styles.label}>{label || 'Date'}</ThemedText>
        <ThemedText style={styles.date}>{dateString}</ThemedText>
      </TouchableOpacity>

      <TouchableOpacity onPress={onNext} style={styles.button} accessibilityLabel="Next date">
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
    paddingHorizontal: 8,
    paddingVertical: 10,
    backgroundColor: '#FFFFFF',
    borderRadius: 17,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E5EBF3',
  },
  button: {
    width: 42,
    height: 42,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#EFF6FF',
    borderRadius: 13,
  },
  buttonText: {
    fontSize: 26,
    color: '#1D4ED8',
    fontWeight: '500',
  },
  dateDisplay: {
    flex: 1,
    minWidth: 0,
    paddingHorizontal: 8,
    alignItems: 'center',
  },
  label: {
    fontSize: 10,
    color: '#8793A5',
    fontWeight: '700',
    marginBottom: 2,
  },
  date: {
    textAlign: 'center',
    fontSize: 14,
    fontWeight: '800',
    color: '#172A43',
  },
});
