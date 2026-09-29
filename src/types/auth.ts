import { Driver } from './driver';

export type AppRole = 'admin' | 'driver';

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface AuthResponse {
  token: string;
  user?: any;
  driver?: Driver;
  admin?: any;
  message?: string;
}

export interface AuthContextType {
  user: any | null;
  driver: Driver | null;
  token: string | null;
  isLoading: boolean;
  isSignedIn: boolean;
  isAdmin: boolean;
  isDriver: boolean;
  role: AppRole | null;
  login: (email: string, password: string, expectedRole?: AppRole) => Promise<any>;
  logout: () => Promise<void>;
  clearError: () => void;
  error: string | null;
  updateDutyStatus: (status: 'on_duty' | 'off_duty') => Promise<void>;
}
