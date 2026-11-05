import { apiService } from '@/services/api';
import type { AuthContextType, Driver } from '@/types';
import { resolveBackendRole } from '@/utils/authRole';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, ReactNode, useCallback, useContext, useEffect, useState } from 'react';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

function normalizeStoredRole(authUser: any, fallback?: string | null) {
  const resolved = resolveBackendRole(authUser, authUser);
  if (resolved === 'unauthorized') return null;
  return resolved || (fallback === 'manager' || fallback === 'driver' ? fallback : null);
}

function normalizeDriverDutyStatus(shiftStatus: unknown): 'on_duty' | 'off_duty' {
  return String(shiftStatus || '').toLowerCase().replace(/[_\s-]+/g, '') === 'offduty' ? 'off_duty' : 'on_duty';
}

function unwrapLoginPayload(response: any) {
  const root = response?.data && (
    response.data.token ||
    response.data.access_token ||
    response.data.user ||
    response.data.driver ||
    response.data.admin ||
    response.data.manager ||
    response.data.data
  )
    ? response.data
    : response;

  const payload = root?.data && (
    root.data.token ||
    root.data.access_token ||
    root.data.user ||
    root.data.driver ||
    root.data.admin ||
    root.data.manager
  )
    ? root.data
    : root;

  const authUser = payload?.user || payload?.manager || payload?.admin || payload?.driver || payload?.data?.user || payload?.data?.manager || payload?.data?.admin || payload?.data?.driver || payload;
  return { payload, authUser };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<any | null>(null);
  const [driver, setDriver] = useState<Driver | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const role = user?.role || driver?.role || null;
  const isDriver = role === 'driver';
  const isManager = role === 'manager';

  const updateDutyStatus = useCallback(async (status: 'on_duty' | 'off_duty') => {
    if (!isDriver) throw new Error('Only drivers can change duty status.');
    const response = await apiService.updateDriverDutyStatus(status);
    const shiftStatus = response?.data?.shift_status || response?.shift_status || (status === 'off_duty' ? 'Off Duty' : 'Available');
    const nextDriver = { ...(driver || {}), shift_status: shiftStatus, duty_status: normalizeDriverDutyStatus(shiftStatus) } as Driver;
    setDriver(nextDriver);
    const nextUser = { ...(user || {}), ...nextDriver, role: 'driver' };
    setUser(nextUser);
    await AsyncStorage.setItem('authUser', JSON.stringify(nextUser));
  }, [driver, isDriver, user]);

  const handleExpiredSession = useCallback(async () => {
    setToken(null);
    setUser(null);
    setDriver(null);
    setError(null);
    await Promise.all([
      apiService.clearToken(),
      AsyncStorage.removeItem('authUser'),
      AsyncStorage.removeItem('driverData'),
    ]);
  }, []);

  useEffect(() => {
    apiService.setUnauthorizedHandler(handleExpiredSession);
    return () => apiService.setUnauthorizedHandler(null);
  }, [handleExpiredSession]);

  useEffect(() => {
    const bootstrapAsync = async () => {
      try {
        try {
          await apiService.clearLegacyManagerCaches();
        } catch (cleanupError) {
          console.error('Failed to clear unscoped Manager caches', cleanupError);
        }

        const savedToken = await apiService.getStoredToken();
        const savedUser = await AsyncStorage.getItem('authUser');

        if (savedToken && savedUser) {
          apiService.setToken(savedToken);
          setToken(savedToken);
          const parsedUser = JSON.parse(savedUser);
          const normalizedStoredUser = {
            ...parsedUser,
            role: normalizeStoredRole(parsedUser),
            ...(normalizeStoredRole(parsedUser) === 'driver'
              ? { duty_status: normalizeDriverDutyStatus(parsedUser.shift_status || parsedUser.duty_status) }
              : {}),
          };

        setUser(normalizedStoredUser);
        if (normalizedStoredUser.role === 'driver') {
          setDriver(normalizedStoredUser as Driver);
        }
        }
      } catch (e) {
        console.error('Failed to restore token', e);
      } finally {
        setIsLoading(false);
      }
    };

    bootstrapAsync();
  }, []);

  const authContext: AuthContextType = {
    user,
    driver,
    token,
    isLoading,
    isSignedIn: !!token,
    isManager,
    isDriver,
    role,
    error,
    updateDutyStatus,
    refreshProfile: async () => {
      const profile = isManager
        ? await apiService.getManagerProfile()
        : isDriver
          ? await apiService.getDriverProfile()
          : await apiService.getCurrentUser();
      const nextUser = profile?.data?.user || profile?.data?.driver || profile?.data?.manager || profile?.data || profile?.user || profile?.driver || profile?.manager || profile;
      if (!nextUser) return null;
      const normalizedUser = {
        ...(user || {}),
        ...nextUser,
        role: normalizeStoredRole(nextUser, user?.role),
        ...(normalizeStoredRole(nextUser, user?.role) === 'driver'
          ? { duty_status: normalizeDriverDutyStatus(nextUser.shift_status || nextUser.duty_status) }
          : {}),
      };
      await AsyncStorage.setItem('authUser', JSON.stringify(normalizedUser));
      setUser(normalizedUser);
      if (normalizedUser.role === 'driver') setDriver(normalizedUser as Driver);
      else setDriver(null);
      return normalizedUser;
    },
    updateProfile: async (changes: Record<string, unknown>) => {
      const profile = isManager
        ? await apiService.updateManagerProfile(changes)
        : await apiService.updateDriverProfile(changes);
      const nextUser = profile?.data?.user || profile?.data?.driver || profile?.data?.manager || profile?.data || profile?.user || profile?.driver || profile?.manager || profile;
      if (nextUser) {
        const normalizedUser = {
          ...(user || {}),
          ...nextUser,
          role: normalizeStoredRole(nextUser, user?.role),
          ...(normalizeStoredRole(nextUser, user?.role) === 'driver'
            ? { duty_status: normalizeDriverDutyStatus(nextUser.shift_status || nextUser.duty_status) }
            : {}),
        };
        await AsyncStorage.setItem('authUser', JSON.stringify(normalizedUser));
        setUser(normalizedUser);
        if (normalizedUser.role === 'driver') setDriver(normalizedUser as Driver);
        else setDriver(null);
      }
      return profile;
    },
    clearError: () => setError(null),
    login: async (email: string, password: string, expectedRole?: 'manager' | 'driver') => {
      try {
        setError(null);
        const response = await apiService.login(email, password, expectedRole);
        const { payload, authUser } = unwrapLoginPayload(response);
        const newToken = payload.token || payload.access_token;

        if (!newToken || !authUser) {
          throw new Error('Invalid response from server');
        }

        const resolvedRole = resolveBackendRole(authUser, payload);
        if (resolvedRole !== 'manager' && resolvedRole !== 'driver') {
          throw new Error('The backend response did not identify a Manager or Driver account.');
        }

        if (expectedRole && resolvedRole !== expectedRole) {
          throw new Error(
            expectedRole === 'manager'
              ? 'This account is not authorized for the Manager portal.'
              : 'Manager accounts cannot access the Driver portal.'
          );
        }

        const normalizedUser = {
          ...authUser,
          role: resolvedRole,
          ...(resolvedRole === 'driver'
            ? { duty_status: normalizeDriverDutyStatus(authUser.shift_status || authUser.duty_status) }
            : {}),
        };

        await apiService.storeToken(newToken);
        await AsyncStorage.setItem('authUser', JSON.stringify(normalizedUser));

        setToken(newToken);
        setUser(normalizedUser);
        if (resolvedRole === 'driver') {
          setDriver(normalizedUser as Driver);
        } else {
          setDriver(null);
        }

        return normalizedUser;
      } catch (err: any) {
        let message = 'An error occurred during login';

        if (err?.response?.data?.message) {
          message = err.response.data.message;
        } else if (err?.response?.data?.error) {
          message = err.response.data.error;
        } else if (err?.response?.data?.errors) {
          const flattened = Object.values(err.response.data.errors).flat();
          if (flattened.length) {
            message = flattened.join(' ');
          }
        } else if (err instanceof Error) {
          message = err.message;
        }

        setError(message);
        throw err;
      }
    },

    logout: async () => {
      try {
        if (role === 'driver' || role === 'manager') {
          const pushToken = await AsyncStorage.getItem('expoPushToken');
          if (pushToken) {
            try {
              await apiService.removePushToken(pushToken, role);
            } catch (pushError) {
              console.error('Unable to unregister this device for push notifications', pushError);
            }
          }
          await apiService.logout(role);
        }
      } catch (err) {
        console.error('Logout error:', err);
      } finally {
        await apiService.clearToken();
        await AsyncStorage.removeItem('authUser');
        await AsyncStorage.removeItem('driverData');
        await AsyncStorage.removeItem('expoPushToken');
        setToken(null);
        setUser(null);
        setDriver(null);
        setError(null);
      }
    },
  };

  return (
    <AuthContext.Provider value={authContext}>{children}</AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
