import { Colors, Spacing } from '@/constants/theme';
import { Image } from 'expo-image';
import { StyleSheet, TouchableOpacity, useColorScheme, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ThemedText } from './themed-text';
import { ThemedView } from './themed-view';

interface HeaderProps {
  title?: string;
  onMenuPress?: () => void;
  onNotificationPress?: () => void;
  notificationBadge?: number;
}

export function Header({
  title,
  onMenuPress,
  onNotificationPress,
  notificationBadge,
}: HeaderProps) {
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme === 'dark' ? 'dark' : 'light'];

  return (
    <ThemedView
      style={[
        styles.container,
        { paddingTop: insets.top + Spacing.three },
      ]}>
      <TouchableOpacity onPress={onMenuPress} style={styles.iconButton}>
        <ThemedText style={styles.menuIcon}>☰</ThemedText>
      </TouchableOpacity>

      <View style={styles.centerContent}>
        <Image source={require('@/assets/images/tap-track-logo.svg')} contentFit="contain" style={styles.logoImage} />
      </View>

      <TouchableOpacity onPress={onNotificationPress} style={styles.iconButton}>
        <ThemedText style={styles.notificationIcon}>↻</ThemedText>
        {notificationBadge ? (
          <View style={styles.badge}>
            <ThemedText style={styles.badgeText}>
              {notificationBadge > 9 ? '9+' : notificationBadge}
            </ThemedText>
          </View>
        ) : null}
      </TouchableOpacity>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.four,
    paddingBottom: 4,
  },
  iconButton: {
    padding: Spacing.two,
    borderRadius: Spacing.three,
  },
  centerContent: {
    flex: 1,
    alignItems: 'center',
  },
  logoImage: {
    width: 48,
    height: 48,
  },
  logo: {
    fontSize: 16,
    fontWeight: '700',
    color: '#208AEF',
  },
  menuIcon: {
    fontSize: 17,
  },
  notificationIcon: {
    fontSize: 18,
  },
  badge: {
    position: 'absolute',
    top: -2,
    right: -2,
    backgroundColor: '#FF4444',
    borderRadius: Spacing.two,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '700',
  },
});
