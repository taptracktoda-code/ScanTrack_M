import axios, { AxiosInstance } from 'axios';
import * as SecureStore from 'expo-secure-store';

export const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || '';
export const REGISTER_ENDPOINT = process.env.EXPO_PUBLIC_REGISTER_ENDPOINT || '/register';

class ApiService {
  private axiosInstance: AxiosInstance;
  private token: string | null = null;

  get baseUrl() {
    return API_BASE_URL;
  }

  constructor() {
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
        console.error('[API] error', error.response?.status || 'network', error.config?.url || 'unknown', error.message);
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
  async login(email: string, password: string) {
    const response = await this.axiosInstance.post('/login', {
      email,
      password,
    });
    return response.data;
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
      await this.axiosInstance.post('/driver/logout');
    } catch (error) {
      console.warn('Logout error:', error);
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

  async changePassword(currentPassword: string, newPassword: string) {
    const response = await this.axiosInstance.post('/driver/change-password', {
      current_password: currentPassword,
      new_password: newPassword,
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
