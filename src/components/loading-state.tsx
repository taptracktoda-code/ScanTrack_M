import { Colors, Spacing } from '@/constants/theme';
import { ActivityIndicator, StyleSheet, useColorScheme } from 'react-native';
import { ThemedText } from './themed-text';
import { ThemedView } from './themed-view';

interface LoadingStateProps {
  message?: string;
}

export function LoadingState({ message = 'Loading...' }: LoadingStateProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme === 'dark' ? 'dark' : 'light'];

  return (
    <ThemedView style={styles.container}>
      <ActivityIndicator
        size="large"
        color="#208AEF"
        style={{ marginBottom: Spacing.three }}
      />
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
  message: {
    fontSize: 14,
    color: '#666666',
    textAlign: 'center',
  },
});
