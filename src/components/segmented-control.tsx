import { Spacing } from '@/constants/theme';
import { StyleSheet, TouchableOpacity } from 'react-native';
import { ThemedText } from './themed-text';
import { ThemedView } from './themed-view';

interface SegmentedControlProps {
  options: string[];
  selectedIndex: number;
  onValueChange: (index: number) => void;
}

export function SegmentedControl({
  options,
  selectedIndex,
  onValueChange,
}: SegmentedControlProps) {
  return (
    <ThemedView style={styles.container}>
      {options.map((option, index) => (
        <TouchableOpacity
          key={index}
          style={[
            styles.segment,
            index === selectedIndex && styles.segmentActive,
            index === 0 && styles.segmentFirst,
            index === options.length - 1 && styles.segmentLast,
          ]}
          onPress={() => onValueChange(index)}>
          <ThemedText
            style={[
              styles.segmentText,
              index === selectedIndex && styles.segmentTextActive,
            ]}>
            {option}
          </ThemedText>
        </TouchableOpacity>
      ))}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: '#E9EEF5',
    borderRadius: 14,
    padding: 4,
    marginBottom: 18,
  },
  segment: {
    flex: 1,
    minWidth: 0,
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 8,
    alignItems: 'center',
    borderRadius: 11,
  },
  segmentFirst: {
    borderTopLeftRadius: Spacing.three,
    borderBottomLeftRadius: Spacing.three,
  },
  segmentLast: {
    borderTopRightRadius: Spacing.three,
    borderBottomRightRadius: Spacing.three,
  },
  segmentActive: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#10233F',
    shadowOpacity: 0.08,
    shadowRadius: 5,
    elevation: 1,
  },
  segmentText: {
    textAlign: 'center',
    fontSize: 12,
    fontWeight: '700',
    color: '#6C7A90',
  },
  segmentTextActive: {
    color: '#1D4ED8',
    fontWeight: '700',
  },
});
