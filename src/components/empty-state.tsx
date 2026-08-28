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
  },
  icon: {
    fontSize: 48,
    marginBottom: Spacing.three,
  },
  message: {
    fontSize: 14,
    color: '#999999',
    textAlign: 'center',
  },
});
