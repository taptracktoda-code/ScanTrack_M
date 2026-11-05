import { useAuth } from '@/context/auth';
import { apiService } from '@/services/api';
import { registerForPushNotificationsAsync } from '@/services/pushNotifications';
import type { Notification } from '@/types';
import { createContext, ReactNode, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';
import { AppState, Platform } from 'react-native';

interface NotificationsContextValue {
  notifications: Notification[];
  unreadCount: number;
  loading: boolean;
  error: string | null;
  pushError: string | null;
  isPanelOpen: boolean;
  openPanel: () => void;
  closePanel: () => void;
  refresh: () => Promise<void>;
  markAsRead: (notificationId: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
}

const NotificationsContext = createContext<NotificationsContextValue | undefined>(undefined);

interface AccountNotificationState {
  accountKey: string | null;
  notifications: Notification[];
  loading: boolean;
  error: string | null;
  pushError: string | null;
  endpointUnavailable: boolean;
}

function createAccountNotificationState(accountKey: string | null): AccountNotificationState {
  return {
    accountKey,
    notifications: [],
    loading: false,
    error: null,
    pushError: null,
    endpointUnavailable: false,
  };
}

export function NotificationsProvider({ children }: { children: ReactNode }) {
  const { isManager, isLoading: authLoading, isSignedIn, user } = useAuth();
  const role: 'manager' | 'driver' = isManager ? 'manager' : 'driver';
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const refreshToken = useRef(0);
  const accountKey = isSignedIn ? `${role}:${user?.id || user?.email || ''}` : null;
  const [storedAccountState, setStoredAccountState] = useState(
    () => createAccountNotificationState(accountKey),
  );
  const accountState = storedAccountState.accountKey === accountKey
    ? storedAccountState
    : createAccountNotificationState(accountKey);
  const { notifications, loading, error, pushError, endpointUnavailable } = accountState;
  const configuredPollInterval = Number(process.env.EXPO_PUBLIC_NOTIFICATIONS_POLL_INTERVAL || 60000);
  const pollIntervalMs = Number.isFinite(configuredPollInterval) && configuredPollInterval > 0
    ? configuredPollInterval
    : 60000;

  const updateAccountState = useCallback((
    update: (current: AccountNotificationState) => AccountNotificationState,
  ) => {
    setStoredAccountState((current) => update(
      current.accountKey === accountKey
        ? current
        : createAccountNotificationState(accountKey),
    ));
  }, [accountKey]);

  useEffect(() => {
    refreshToken.current += 1;
  }, [accountKey]);

  const refresh = useCallback(async () => {
    const requestId = ++refreshToken.current;
    updateAccountState((current) => ({ ...current, loading: true, error: null }));

    try {
      const response = await apiService.getNotifications(20, role);
      const nextNotifications = Array.isArray(response?.data) ? response.data : Array.isArray(response) ? response : [];
      if (requestId === refreshToken.current) {
        updateAccountState((current) => ({
          ...current,
          endpointUnavailable: false,
          notifications: nextNotifications,
        }));
      }
    } catch (requestError: any) {
      if (requestId !== refreshToken.current) return;
      if (requestError?.response?.status === 404) {
        updateAccountState((current) => ({
          ...current,
          endpointUnavailable: true,
          error: 'Notifications are unavailable because the configured API route was not found. Set EXPO_PUBLIC_NOTIFICATIONS_ENDPOINT to your Laravel route.',
        }));
      } else {
        updateAccountState((current) => ({
          ...current,
          error: requestError?.message || 'Unable to load notifications.',
        }));
      }
    } finally {
      if (requestId === refreshToken.current) {
        updateAccountState((current) => ({ ...current, loading: false }));
      }
    }
  }, [role, updateAccountState]);

  useEffect(() => {
    if (authLoading || !isSignedIn || Platform.OS === 'web') return;

    let cancelled = false;
    const registerPushToken = async () => {
      try {
        const pushToken = await registerForPushNotificationsAsync();
        if (cancelled) return;
        if (!pushToken) {
          updateAccountState((current) => ({
            ...current,
            pushError: 'Enable notifications in your device settings to receive instant alerts.',
          }));
          return;
        }

        await apiService.registerPushToken(pushToken, role);
        await AsyncStorage.setItem('expoPushToken', pushToken);
        if (!cancelled) {
          updateAccountState((current) => ({ ...current, pushError: null }));
        }
      } catch (registrationError) {
        if (!cancelled) {
          const message = registrationError instanceof Error
            ? registrationError.message
            : 'Unable to register this device for push notifications.';
          updateAccountState((current) => ({ ...current, pushError: message }));
          console.error('[Notifications] push registration failed', registrationError);
        }
      }
    };

    void registerPushToken();
    return () => { cancelled = true; };
  }, [authLoading, isSignedIn, role, accountKey, updateAccountState]);

  useEffect(() => {
    if (authLoading || !isSignedIn || Platform.OS === 'web') return;

    const receivedSubscription = Notifications.addNotificationReceivedListener(() => {
      void refresh();
    });
    const responseSubscription = Notifications.addNotificationResponseReceivedListener(() => {
      setIsPanelOpen(true);
      void refresh();
    });

    return () => {
      receivedSubscription.remove();
      responseSubscription.remove();
    };
  }, [authLoading, isSignedIn, refresh]);

  useEffect(() => {
    if (authLoading || !isSignedIn || endpointUnavailable) return;

    let intervalId: ReturnType<typeof setInterval> | undefined;
    let started = false;

    const startPolling = () => {
      if (started) return;
      started = true;
      void refresh();
      intervalId = setInterval(() => void refresh(), Math.max(5000, pollIntervalMs));
    };

    const stopPolling = () => {
      if (intervalId) clearInterval(intervalId);
      started = false;
    };

    const appStateSubscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') startPolling(); else stopPolling();
    });

    startPolling();
    return () => {
      stopPolling();
      appStateSubscription.remove();
    };
  }, [authLoading, endpointUnavailable, isSignedIn, pollIntervalMs, refresh]);

  const markAsRead = useCallback(async (notificationId: string) => {
    const before = notifications.find((notification) => notification.id === notificationId);
    if (!before) return;

    updateAccountState((current) => ({
      ...current,
      notifications: current.notifications.map((notification) => (
        notification.id === notificationId ? { ...notification, is_read: true } : notification
      )),
    }));

    try {
      await apiService.markNotificationAsRead(notificationId, role);
    } catch (requestError) {
      updateAccountState((current) => ({
        ...current,
        notifications: current.notifications.map((notification) => (
          notification.id === notificationId ? { ...notification, is_read: before.is_read } : notification
        )),
        error: requestError instanceof Error ? requestError.message : 'Unable to mark notification as read.',
      }));
    }
  }, [notifications, role, updateAccountState]);

  const markAllAsRead = useCallback(async () => {
    const unread = notifications.filter((notification) => !notification.is_read);
    if (!unread.length) return;

    updateAccountState((current) => ({
      ...current,
      notifications: current.notifications.map((notification) => ({ ...notification, is_read: true })),
    }));
    try {
      await Promise.all(unread.map((notification) => apiService.markNotificationAsRead(String(notification.id), role)));
    } catch (requestError) {
      updateAccountState((current) => ({
        ...current,
        notifications: current.notifications.map((notification) => {
          const previous = unread.find((item) => String(item.id) === String(notification.id));
          return previous ? { ...notification, is_read: false } : notification;
        }),
        error: requestError instanceof Error ? requestError.message : 'Unable to update notifications.',
      }));
    }
  }, [notifications, role, updateAccountState]);

  const unreadCount = useMemo(
    () => notifications.filter((notification) => !notification.is_read).length,
    [notifications],
  );

  return (
    <NotificationsContext.Provider value={{
      notifications,
      unreadCount,
      loading,
      error,
      isPanelOpen,
      pushError,
      openPanel: () => setIsPanelOpen(true),
      closePanel: () => setIsPanelOpen(false),
      refresh,
      markAsRead,
      markAllAsRead,
    }}>
      {children}
    </NotificationsContext.Provider>
  );
}

export function useNotifications() {
  const context = useContext(NotificationsContext);
  if (!context) throw new Error('useNotifications must be used within NotificationsProvider');
  return context;
}
