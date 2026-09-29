import { apiService } from '@/services/api';
import type { AuthContextType, Driver } from '@/types';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, ReactNode, useCallback, useContext, useEffect, useState } from 'react';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

function resolveRole(authUser: any, payload: any): 'admin' | 'driver' | null {
  const rawRole =
    authUser?.role ??
    authUser?.user_role ??
    authUser?.account_type ??
    authUser?.user_type ??
    authUser?.type ??
    authUser?.roles?.[0]?.name ??
    authUser?.roles?.[0] ??
    payload?.role ??
    payload?.user_role ??
    payload?.account_type ??
    payload?.user_type ??
    payload?.type;

  if (!rawRole && payload?.admin) return 'admin';
  if (!rawRole && payload?.driver) return 'driver';
  if (!rawRole && (authUser?.is_admin === true || payload?.is_admin === true)) return 'admin';
  if (!rawRole && (authUser?.is_driver === true || payload?.is_driver === true)) return 'driver';
  if (!rawRole) return null;

  const normalized = String(rawRole).toLowerCase().replace(/[\s-]+/g, '_');

  if (['admin', 'administrator', 'super_admin', 'terminal_admin'].includes(normalized)) {
    return 'admin';
  }

  if (['driver', 'operator'].includes(normalized)) return 'driver';
  return null;
}

function unwrapLoginPayload(response: any) {
  const payload = response?.data && (response.data.token || response.data.access_token || response.data.user || response.data.driver || response.data.admin)
    ? response.data
    : response;
  const authUser = payload?.user || payload?.driver || payload?.admin || payload;
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
  const isAdmin = role === 'admin';

  const updateDutyStatus = useCallback(async (status: 'on_duty' | 'off_duty') => {
    if (!isDriver) throw new Error('Only drivers can change duty status.');
    const nextDriver = { ...(driver || {}), duty_status: status } as Driver;
    setDriver(nextDriver);
    const nextUser = { ...(user || {}), duty_status: status, role: 'driver' };
    setUser(nextUser);
    await AsyncStorage.setItem('authUser', JSON.stringify(nextUser));
  }, [driver, isDriver, user]);

  useEffect(() => {
    const bootstrapAsync = async () => {
      try {
        const savedToken = await apiService.getStoredToken();
        const savedUser = await AsyncStorage.getItem('authUser');

        if (savedToken && savedUser) {
          apiService.setToken(savedToken);
          setToken(savedToken);
          const parsedUser = JSON.parse(savedUser);
          setUser(parsedUser);
          if (parsedUser.role === 'driver') {
            setDriver(parsedUser as Driver);
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
    isAdmin,
    isDriver,
    role,
    error,
    updateDutyStatus,
    clearError: () => setError(null),
    login: async (email: string, password: string, expectedRole?: 'admin' | 'driver') => {
      try {
        setError(null);
        const response = await apiService.login(email, password, expectedRole);
        const { payload, authUser } = unwrapLoginPayload(response);
        const newToken = payload.token || payload.access_token;

        if (!newToken || !authUser) {
          throw new Error('Invalid response from server');
        }

        const resolvedRole = resolveRole(authUser, payload);
        if (!resolvedRole) {
          throw new Error('Laravel login response did not include an admin or driver role.');
        }
        if (expectedRole && resolvedRole !== expectedRole) {
          throw new Error(
            expectedRole === 'admin'
              ? 'This account is not authorized for the Admin portal.'
              : 'Admin accounts cannot access the Driver portal.'
          );
        }

        const normalizedUser = { ...authUser, role: resolvedRole };

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
      } catch (err) {
        const message =
          err instanceof Error ? err.message : 'An error occurred during login';
        setError(message);
        throw err;
      }
    },

    logout: async () => {
      try {
        await apiService.logout();
      } catch (err) {
        console.error('Logout error:', err);
      } finally {
        await apiService.clearToken();
        await AsyncStorage.removeItem('authUser');
        await AsyncStorage.removeItem('driverData');
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
