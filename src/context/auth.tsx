import { apiService } from '@/services/api';
import type { AuthContextType, Driver } from '@/types';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, ReactNode, useContext, useEffect, useState } from 'react';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [driver, setDriver] = useState<Driver | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Bootstrap async data on app launch
  useEffect(() => {
    const bootstrapAsync = async () => {
      try {
        const savedToken = await apiService.getStoredToken();
        const savedDriver = await AsyncStorage.getItem('driverData');

        if (savedToken && savedDriver) {
          apiService.setToken(savedToken);
          setToken(savedToken);
          setDriver(JSON.parse(savedDriver));
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
    driver,
    token,
    isLoading,
    isSignedIn: !!token,
    error,
    clearError: () => setError(null),
    login: async (email: string, password: string) => {
      try {
        setError(null);
        const response = await apiService.login(email, password);

        const { token: newToken, driver: driverData } = response.data || response;

        if (!newToken || !driverData) {
          throw new Error('Invalid response from server');
        }

        // Verify driver role
        if (driverData.role && driverData.role !== 'driver') {
          throw new Error('This app is only for driver accounts');
        }

        await apiService.storeToken(newToken);
        await AsyncStorage.setItem('driverData', JSON.stringify(driverData));

        setToken(newToken);
        setDriver(driverData);
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
        await AsyncStorage.removeItem('driverData');
        setToken(null);
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
