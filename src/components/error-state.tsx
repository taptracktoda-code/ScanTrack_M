import { Spacing } from '@/constants/theme';
import { StyleSheet, TouchableOpacity } from 'react-native';
import { ThemedText } from './themed-text';
import { ThemedView } from './themed-view';

interface ErrorStateProps {
  message: string;
  onRetry?: () => void;
  icon?: string;
}

export function ErrorState({
  message,
  onRetry,
  icon = '⚠️',
}: ErrorStateProps) {
  return (
    <ThemedView style={styles.container}>
      <ThemedText style={styles.icon}>{icon}</ThemedText>
      <ThemedText style={styles.title}>Unable to Load</ThemedText>
      <ThemedText style={styles.message}>{message}</ThemedText>

      {onRetry && (
        <TouchableOpacity style={styles.button} onPress={onRetry}>
          <ThemedText style={styles.buttonText}>Try Again</ThemedText>
        </TouchableOpacity>
      )}
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
    marginBottom: Spacing.two,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: '#000000',
    marginBottom: Spacing.one,
  },
  message: {
    fontSize: 13,
    color: '#999999',
    textAlign: 'center',
    marginBottom: Spacing.four,
  },
  button: {
    backgroundColor: '#208AEF',
    borderRadius: Spacing.three,
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.three,
  },
  buttonText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 14,
  },
});
