import { Spacing } from '@/constants/theme';
import { useAuth } from '@/context/auth';
import { useNotifications } from '@/context/notifications';
import { Image } from 'expo-image';
import { SymbolView } from 'expo-symbols';
import { useRouter } from 'expo-router';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ThemedText } from './themed-text';
import { ThemedView } from './themed-view';

interface HeaderProps {
  title?: string;
  onNotificationPress?: () => void;
  notificationBadge?: number;
}

export function Header({
  title,
  onNotificationPress,
  notificationBadge,
}: HeaderProps) {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { driver, user, isManager } = useAuth();
  const { unreadCount, openPanel } = useNotifications();
  const handleNotificationPress = onNotificationPress ?? openPanel;
  const badgeCount = notificationBadge ?? unreadCount;
  const avatarUri = isManager
    ? user?.avatar || user?.avatar_url || user?.profile_image || user?.profile_image_url || user?.photo_url || null
    : driver?.avatar || null;
  const avatarSource = avatarUri ? { uri: avatarUri } : null;
  const displayName = isManager ? user?.name || user?.full_name : driver?.name;

  return (
    <ThemedView
      style={[
        styles.container,
        { paddingTop: insets.top + Spacing.three },
      ]}>
      <View style={isManager ? styles.actionSpacer : styles.driverActionSpacer} />

      <View style={styles.centerContent}>
        <Image source={require('@/assets/images/tap-track-logo.svg')} contentFit="contain" style={styles.logoImage} />
      </View>

      <View style={styles.rightActions}>
        <TouchableOpacity
          onPress={handleNotificationPress}
          style={styles.iconButton}
          accessibilityRole="button"
          accessibilityLabel="Notifications"
        >
          <SymbolView
            name={{ ios: 'bell', android: 'notifications', web: 'notifications' }}
            tintColor="#208AEF"
            size={22}
          />
          {badgeCount ? (
            <View style={styles.badge}>
              <ThemedText style={styles.badgeText}>{badgeCount > 9 ? '9+' : badgeCount}</ThemedText>
            </View>
          ) : null}
        </TouchableOpacity>
        {!isManager ? (
          <TouchableOpacity
            onPress={() => router.push('/(tabs)/profile')}
            style={styles.avatarContainer}
            accessibilityLabel="Open profile"
          >
            {avatarSource ? <Image source={avatarSource} contentFit="cover" style={styles.avatar} /> : <ThemedText style={styles.avatarFallback}>{(displayName || 'D').charAt(0).toUpperCase()}</ThemedText>}
          </TouchableOpacity>
        ) : null}
      </View>
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
  rightActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  actionSpacer: {
    width: 38,
    height: 38,
  },
  driverActionSpacer: {
    width: 76,
    height: 38,
  },
  logoImage: {
    width: 48,
    height: 48,
  },
  avatarContainer: {
    width: 34,
    height: 34,
    borderRadius: 17,
    overflow: 'hidden',
    backgroundColor: '#DCEEFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatar: {
    width: 34,
    height: 34,
  },
  avatarFallback: {
    color: '#208AEF',
    fontSize: 15,
    fontWeight: '800',
  },
  logo: {
    fontSize: 16,
    fontWeight: '700',
    color: '#208AEF',
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
