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
    backgroundColor: '#F0F0F3',
    borderRadius: Spacing.three,
    padding: 3,
    marginBottom: Spacing.three,
  },
  segment: {
    flex: 1,
    paddingVertical: Spacing.two,
    paddingHorizontal: Spacing.three,
    alignItems: 'center',
    borderRadius: Spacing.two,
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
  },
  segmentText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#999999',
  },
  segmentTextActive: {
    color: '#208AEF',
    fontWeight: '700',
  },
});
