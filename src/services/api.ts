import AsyncStorage from '@react-native-async-storage/async-storage';
import axios, { AxiosInstance } from 'axios';
import Constants from 'expo-constants';
import * as SecureStore from 'expo-secure-store';

const configuredApiUrl = process.env.EXPO_PUBLIC_API_URL?.trim();
const adminLoginEndpoint = process.env.EXPO_PUBLIC_ADMIN_LOGIN_ENDPOINT?.trim() || '/admin/login';
const adminDashboardEndpoint = process.env.EXPO_PUBLIC_ADMIN_DASHBOARD_ENDPOINT?.trim();
const adminTransactionsEndpoint = process.env.EXPO_PUBLIC_ADMIN_TRANSACTIONS_ENDPOINT?.trim() || '/admin/transactions';

function getDevelopmentApiUrl() {
  const hostUri = Constants.expoConfig?.hostUri;
  if (!hostUri) return '';

  try {
    const host = new URL(`http://${hostUri}`).hostname;
    return `http://${host}:8000/api`;
  } catch {
    return '';
  }
}

export const API_BASE_URL = configuredApiUrl || getDevelopmentApiUrl();
export const REGISTER_ENDPOINT = process.env.EXPO_PUBLIC_REGISTER_ENDPOINT || '/register';
const LOCAL_ADMIN_HISTORY_KEY = 'tapTrack.adminHistory';

class ApiService {
  private axiosInstance: AxiosInstance;
  private token: string | null = null;

  get baseUrl() {
    return API_BASE_URL;
  }

  constructor() {
    if (!API_BASE_URL) {
      throw new Error('API URL is not configured. Set EXPO_PUBLIC_API_URL in .env.');
    }

    this.axiosInstance = axios.create({
      baseURL: API_BASE_URL,
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
    });

    // Add token to every request if available
    this.axiosInstance.interceptors.request.use(
      async (config) => {
        console.log('[API] request', config.method?.toUpperCase(), `${API_BASE_URL}${config.url || ''}`);
        const token = await SecureStore.getItemAsync('authToken');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    this.axiosInstance.interceptors.response.use(
      (response) => {
        console.log('[API] response', response.status, response.config.url);
        return response;
      },
      (error) => {
        console.error('[API] error', error.response?.status || 'network', error.config?.url || API_BASE_URL, error.message);
        const message = error.response?.data?.message;
        if (message) error.message = message;
        return Promise.reject(error);
      }
    );
  }

  setToken(token: string | null) {
    this.token = token;
    if (token) {
      this.axiosInstance.defaults.headers.common.Authorization = `Bearer ${token}`;
    } else {
      delete this.axiosInstance.defaults.headers.common.Authorization;
    }
  }

  async storeToken(token: string) {
    await SecureStore.setItemAsync('authToken', token);
    this.setToken(token);
  }

  async getStoredToken() {
    return SecureStore.getItemAsync('authToken');
  }

  async clearToken() {
    await SecureStore.deleteItemAsync('authToken');
    this.setToken(null);
  }

  // ==================== Auth ====================
  async login(email: string, password: string, role?: 'admin' | 'driver') {
    const endpoint = role === 'admin' && adminLoginEndpoint ? adminLoginEndpoint : '/login';
    try {
      const response = await this.axiosInstance.post(endpoint, { email, password });
      return response.data;
    } catch (error: any) {
      if (role === 'admin' && endpoint !== '/login' && error.response?.status === 404) {
        const response = await this.axiosInstance.post('/login', { email, password });
        return response.data;
      }
      throw error;
    }
  }

  async loginAdminAndFetchTransactions(email: string, password: string): Promise<{ transactions: unknown }> {
    const loginUrl = `${API_BASE_URL}/admin/login`;
    const transactionsUrl = `${API_BASE_URL}/admin/transactions`;

    try {
      const loginResponse = await this.axiosInstance.post('/admin/login', { email, password });
      const loginPayload = loginResponse.data?.data || loginResponse.data;
      const token = loginPayload?.token || loginPayload?.access_token;

      if (!token) {
        throw new Error('Admin login response did not include a token.');
      }

      await this.storeToken(token);

      const transactionsResponse = await this.axiosInstance.get('/admin/transactions', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const transactionPayload = transactionsResponse.data?.data || transactionsResponse.data;

      return { transactions: transactionPayload };
    } catch (error: any) {
      const status = error?.response?.status || 'network';
      const url = error?.config?.url ? `${API_BASE_URL}${error.config.url}` : loginUrl;
      console.error('[API] admin transactions error', { status, url });
      throw error;
    }
  }

  async registerDriver(data: {
    full_name: string;
    email: string;
    phone_number: string;
    license_number: string;
    unit: string;
    address: string;
    password: string;
    password_confirmation: string;
  }) {
    const payload = data;
    console.log('[API] registration endpoint', REGISTER_ENDPOINT);

    try {
      const response = await this.axiosInstance.post(REGISTER_ENDPOINT, payload);
      return response.data;
    } catch (error: any) {
      // Support Laravel projects that group registration under /auth.
      if (error.response?.status !== 404 || REGISTER_ENDPOINT === '/auth/register') {
        throw error;
      }
      console.log('[API] retry registration endpoint /auth/register');
      const response = await this.axiosInstance.post('/auth/register', payload);
      return response.data;
    }
  }

  async logout() {
    try {
      await this.axiosInstance.post('/logout');
    } catch (error) {
      try {
        await this.axiosInstance.post('/driver/logout');
      } catch (driverError) {
        try {
          await this.axiosInstance.post('/admin/logout');
        } catch {
          console.warn('Logout error:', error || driverError);
        }
      }
    }
  }

  async getCurrentUser() {
    const response = await this.axiosInstance.get('/user');
    return response.data;
  }

  async getDriverQR() {
    const response = await this.axiosInstance.get('/driver/qr');
    return response.data;
  }

  async scanQrIdentifier(qrIdentifier: string) {
    const response = await this.axiosInstance.post('/admin/qr/scan', { qr_identifier: qrIdentifier });
    return response.data;
  }

  async saveLocalAdminTransaction(transaction: Record<string, unknown>) {
    try {
      const stored = await AsyncStorage.getItem(LOCAL_ADMIN_HISTORY_KEY);
      const history = stored ? JSON.parse(stored) : [];
      const nextHistory = Array.isArray(history) ? [transaction, ...history].slice(0, 100) : [transaction];
      await AsyncStorage.setItem(LOCAL_ADMIN_HISTORY_KEY, JSON.stringify(nextHistory));
    } catch (error) {
      console.warn('[API] unable to cache admin history', error);
    }
  }

  async getLocalAdminTransactions(): Promise<unknown[]> {
    try {
      const stored = await AsyncStorage.getItem(LOCAL_ADMIN_HISTORY_KEY);
      const history = stored ? JSON.parse(stored) : [];
      return Array.isArray(history) ? history : [];
    } catch (error) {
      console.warn('[API] unable to read cached admin history', error);
      return [];
    }
  }

  async getAdminDashboardSummary() {
    try {
      const endpoint = adminDashboardEndpoint || adminTransactionsEndpoint;
      const response = await this.axiosInstance.get(endpoint);
      return response.data;
    } catch (error: any) {
      if (error.response?.status === 404) {
        const endpoint = adminDashboardEndpoint || adminTransactionsEndpoint;
        throw new Error(`Laravel admin dashboard data route not found: GET ${endpoint}.`);
      }
      throw error;
    }
  }

  async getAdminTransactions() {
    try {
      const response = await this.axiosInstance.get(adminTransactionsEndpoint);
      return response.data;
    } catch (error: any) {
      if (error.response?.status === 404) {
        throw new Error(`Laravel admin transactions API route not found: GET ${adminTransactionsEndpoint}. Set EXPO_PUBLIC_ADMIN_TRANSACTIONS_ENDPOINT to the registered API route.`);
      }
      throw error;
    }
  }

  // ==================== Driver Profile ====================
  async getDriverProfile() {
    const response = await this.axiosInstance.get('/driver/profile');
    return response.data;
  }

  async updateDriverProfile(data: Record<string, unknown>) {
    const response = await this.axiosInstance.put('/driver/profile', data);
    return response.data;
  }

  async updateDriverDutyStatus(status: 'on_duty' | 'off_duty') {
    try {
      const response = await this.axiosInstance.patch('/driver/status', { status });
      return response.data;
    } catch (error: any) {
      if (error.response?.status === 404) {
        throw new Error('Driver status endpoint is not available. Add PATCH /api/driver/status in Laravel.');
      }
      throw error;
    }
  }

  async changePassword(currentPassword: string, newPassword: string, newPasswordConfirmation: string) {
    const response = await this.axiosInstance.post('/driver/change-password', {
      current_password: currentPassword,
      new_password: newPassword,
      new_password_confirmation: newPasswordConfirmation,
    });
    return response.data;
  }

  // ==================== Dashboard ====================
  async getDashboardData() {
    const response = await this.axiosInstance.get('/driver/dashboard');
    return response.data;
  }

  // ==================== Attendance ====================
  async getTodayAttendance() {
    const response = await this.axiosInstance.get('/driver/attendance/today');
    return response.data;
  }

  async getAttendanceByDate(date: string) {
    const response = await this.axiosInstance.get(`/driver/attendance/${date}`);
    return response.data;
  }

  async getAttendanceHistory(limit = 10) {
    const response = await this.axiosInstance.get('/driver/attendance', {
      params: { limit },
    });
    return response.data;
  }

  async getMonthlyAttendance(year: number, month: number) {
    const response = await this.axiosInstance.get('/driver/attendance/monthly', {
      params: { year, month },
    });
    return response.data;
  }

  async getAttendanceSummary() {
    const response = await this.axiosInstance.get('/driver/attendance/summary');
    return response.data;
  }

  // ==================== Trips ====================
  async getTodayTrips() {
    const response = await this.axiosInstance.get('/driver/trips/today');
    return response.data;
  }

  async getTripHistory(limit = 20) {
    const response = await this.axiosInstance.get('/driver/trips/history', {
      params: { limit },
    });
    return response.data;
  }

  async getTripSummary() {
    const response = await this.axiosInstance.get('/driver/trips/summary');
    return response.data;
  }

  async getTripDetails(tripId: string) {
    const response = await this.axiosInstance.get(`/driver/trips/${tripId}`);
    return response.data;
  }

  // ==================== Schedule ====================
  async getTodaySchedule() {
    const response = await this.axiosInstance.get('/driver/schedule/today');
    return response.data;
  }

  async getScheduleByDate(date: string) {
    const response = await this.axiosInstance.get(`/driver/schedule/${date}`);
    return response.data;
  }

  async getUpcomingSchedule(days = 7) {
    const response = await this.axiosInstance.get('/driver/schedule/upcoming', {
      params: { days },
    });
    return response.data;
  }

  async getMonthSchedule(year: number, month: number) {
    const response = await this.axiosInstance.get('/driver/schedule/month', {
      params: { year, month },
    });
    return response.data;
  }

  // ==================== Notifications ====================
  async getNotifications(limit = 20) {
    const response = await this.axiosInstance.get('/driver/notifications', {
      params: { limit },
    });
    return response.data;
  }

  async markNotificationAsRead(notificationId: string) {
    const response = await this.axiosInstance.put(
      `/driver/notifications/${notificationId}/read`
    );
    return response.data;
  }

  async getUnreadNotificationsCount() {
    const response = await this.axiosInstance.get(
      '/driver/notifications/unread/count'
    );
    return response.data;
  }
}

export const apiService = new ApiService();
