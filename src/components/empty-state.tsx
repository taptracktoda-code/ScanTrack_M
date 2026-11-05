import { Spacing } from '@/constants/theme';
import { StyleSheet } from 'react-native';
import { ThemedText } from './themed-text';
import { ThemedView } from './themed-view';

interface EmptyStateProps {
  message: string;
  icon?: string;
}

export function EmptyState({
  message,
  icon = '📭',
}: EmptyStateProps) {
  return (
    <ThemedView style={styles.container}>
      <ThemedText style={styles.icon}>{icon}</ThemedText>
      <ThemedText style={styles.message}>{message}</ThemedText>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Spacing.four,
    paddingVertical: 26,
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#E8EDF4',
  },
  icon: {
    fontSize: 30,
    marginBottom: 12,
  },
  message: {
    fontSize: 13,
    lineHeight: 19,
    color: '#748198',
    fontWeight: '600',
    textAlign: 'center',
  },
});
