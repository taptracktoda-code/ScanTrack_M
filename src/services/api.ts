import AsyncStorage from '@react-native-async-storage/async-storage';
import { AxiosInstance, create } from 'axios';
import Constants from 'expo-constants';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';
import { ensureApiBasePath } from '@/utils/apiUrl';
import type { DriverRegistrationRequest } from '@/types';

const configuredApiUrl = process.env.EXPO_PUBLIC_API_URL?.trim();
const driverLoginEndpoint = process.env.EXPO_PUBLIC_DRIVER_LOGIN_ENDPOINT?.trim() || '/login';
const managerLoginEndpoint = process.env.EXPO_PUBLIC_MANAGER_LOGIN_ENDPOINT?.trim() || '/manager/login';
const managerDashboardEndpoint = process.env.EXPO_PUBLIC_MANAGER_DASHBOARD_ENDPOINT?.trim() || '/manager/dashboard';
const managerQrScanEndpoint = process.env.EXPO_PUBLIC_MANAGER_QR_SCAN_ENDPOINT?.trim() || '/manager/qr/scan';
const managerTransactionsEndpoint = process.env.EXPO_PUBLIC_MANAGER_TRANSACTIONS_ENDPOINT?.trim();
const driverProfileEndpoint = process.env.EXPO_PUBLIC_DRIVER_PROFILE_ENDPOINT?.trim() || '/driver/profile';
export const MANAGER_DASHBOARD_CONFIGURED = Boolean(managerDashboardEndpoint);

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

const rawApiUrl = configuredApiUrl || getDevelopmentApiUrl();
export const API_BASE_URL = rawApiUrl ? ensureApiBasePath(rawApiUrl) : '';
export const PROFILE_IMAGE_ENDPOINT = process.env.EXPO_PUBLIC_PROFILE_IMAGE_ENDPOINT?.trim() || '/driver/profile/avatar';
export const PASSWORD_OTP_REQUEST_ENDPOINT = process.env.EXPO_PUBLIC_PASSWORD_OTP_REQUEST_ENDPOINT?.trim() || '/driver/password/otp/request';
export const PASSWORD_OTP_VERIFY_ENDPOINT = process.env.EXPO_PUBLIC_PASSWORD_OTP_VERIFY_ENDPOINT?.trim() || '/driver/password/otp/verify';
export const PASSWORD_RESET_ENDPOINT = process.env.EXPO_PUBLIC_PASSWORD_RESET_ENDPOINT?.trim() || '/driver/password/otp/reset';
export const MANAGER_PROFILE_ENDPOINT = process.env.EXPO_PUBLIC_MANAGER_PROFILE_ENDPOINT?.trim() || '/user';
export const MANAGER_PROFILE_IMAGE_ENDPOINT = process.env.EXPO_PUBLIC_MANAGER_PROFILE_IMAGE_ENDPOINT?.trim() || '/manager/profile/avatar';
export const MANAGER_PASSWORD_OTP_REQUEST_ENDPOINT = process.env.EXPO_PUBLIC_MANAGER_PASSWORD_OTP_REQUEST_ENDPOINT?.trim() || '/manager/password/otp/request';
export const MANAGER_PASSWORD_OTP_VERIFY_ENDPOINT = process.env.EXPO_PUBLIC_MANAGER_PASSWORD_OTP_VERIFY_ENDPOINT?.trim() || '/manager/password/otp/verify';
export const MANAGER_PASSWORD_RESET_ENDPOINT = process.env.EXPO_PUBLIC_MANAGER_PASSWORD_RESET_ENDPOINT?.trim() || '/manager/password/otp/reset';

function normalizeApiEndpoint(value?: string) {
  const raw = (value || '').trim();
  if (!raw) return '/';

  const withoutOrigin = raw.replace(/^https?:\/\/[^/]+/i, '');
  const withoutQuery = withoutOrigin.split('?')[0];
  const withoutLeadingSlash = withoutQuery.replace(/^\/+/, '');
  const withoutApiPrefix = withoutLeadingSlash.replace(/^api\//i, '').replace(/^\/api\//i, '');

  return `/${withoutApiPrefix.replace(/^\/+/, '') || ''}`;
}

export const NOTIFICATIONS_ENDPOINT = normalizeApiEndpoint(
  process.env.EXPO_PUBLIC_NOTIFICATIONS_ENDPOINT || '/driver/notifications',
);
export const MANAGER_NOTIFICATIONS_ENDPOINT = normalizeApiEndpoint(
  process.env.EXPO_PUBLIC_MANAGER_NOTIFICATIONS_ENDPOINT || '/manager/notifications',
);

function isNotificationEndpoint(url: string) {
  return [NOTIFICATIONS_ENDPOINT, MANAGER_NOTIFICATIONS_ENDPOINT].some(
    (endpoint) => url === endpoint || url.startsWith(`${endpoint}/`),
  );
}

function isPasswordOtpEndpoint(url: string) {
  return [
    PASSWORD_OTP_REQUEST_ENDPOINT,
    PASSWORD_OTP_VERIFY_ENDPOINT,
    PASSWORD_RESET_ENDPOINT,
    MANAGER_PASSWORD_OTP_REQUEST_ENDPOINT,
    MANAGER_PASSWORD_OTP_VERIFY_ENDPOINT,
    MANAGER_PASSWORD_RESET_ENDPOINT,
  ].some((endpoint) => {
    const normalizedEndpoint = normalizeApiEndpoint(endpoint);
    return url === normalizedEndpoint || url.startsWith(`${normalizedEndpoint}/`);
  });
}

function isLoginEndpoint(url: string) {
  const normalizedUrl = normalizeApiEndpoint(url);
  return [
    driverLoginEndpoint,
    managerLoginEndpoint,
    '/login',
    '/auth/login',
    '/driver/login',
    '/manager/login',
  ].some((endpoint) => normalizeApiEndpoint(endpoint) === normalizedUrl);
}

function isManagerProfileEndpoint(url: string) {
  const normalizedEndpoint = normalizeApiEndpoint(MANAGER_PROFILE_ENDPOINT);
  const normalizedUrl = normalizeApiEndpoint(url);
  return normalizedUrl === normalizedEndpoint || normalizedUrl.startsWith(`${normalizedEndpoint}/`);
}

class ApiService {
  private axiosInstance: AxiosInstance;
  private token: string | null = null;
  private unauthorizedHandler: (() => Promise<void> | void) | null = null;

  get baseUrl() {
    return API_BASE_URL;
  }

  constructor() {
    if (!API_BASE_URL) {
      throw new Error('API URL is not configured. Set EXPO_PUBLIC_API_URL in .env.');
    }

    this.axiosInstance = create({
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
        const token = await this.getStoredToken();
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
        const status = error.response?.status;
        const requestUrl = error.config?.url || '';
        const isMissingNotificationRoute = status === 404 && isNotificationEndpoint(requestUrl);
        const isMissingPasswordOtpRoute = status === 404 && isPasswordOtpEndpoint(requestUrl);
        const isMissingManagerProfileRoute = status === 404 && isManagerProfileEndpoint(requestUrl);
        const isRejectedLogin = status === 401 && isLoginEndpoint(requestUrl);
        const isValidationError = status === 422;
        const requestHeaders = error.config?.headers;
        const hasAuthorization = Boolean(
          requestHeaders?.Authorization ||
          requestHeaders?.authorization ||
          requestHeaders?.get?.('Authorization'),
        );
        if (
          status === 401 &&
          hasAuthorization &&
          !isRejectedLogin &&
          !isPasswordOtpEndpoint(requestUrl)
        ) {
          void Promise.resolve()
            .then(() => this.unauthorizedHandler?.())
            .catch((handlerError) => {
              console.error('[API] unable to clear expired session', handlerError);
            });
        }
        if (status !== 403 && status !== 405 && !isMissingNotificationRoute && !isMissingPasswordOtpRoute && !isMissingManagerProfileRoute && !isRejectedLogin && !isValidationError) {
          console.error('[API] error', status || 'network', error.config?.url || API_BASE_URL, error.message);
        }
        const message = error.response?.data?.message;
        if (isMissingPasswordOtpRoute) {
          error.message = 'The Manager password OTP route is not registered in Laravel. Configure the Manager OTP request, verify, and reset routes in .env.';
        } else if (isMissingManagerProfileRoute) {
          error.message = `Manager profile route not found: GET ${normalizeApiEndpoint(MANAGER_PROFILE_ENDPOINT)}. Register this Laravel route or set EXPO_PUBLIC_MANAGER_PROFILE_ENDPOINT in .env.`;
        } else if (message) {
          error.message = message;
        }
        return Promise.reject(error);
      }
    );
  }

  setUnauthorizedHandler(handler: (() => Promise<void> | void) | null) {
    this.unauthorizedHandler = handler;
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
    if (Platform.OS === 'web') {
      await AsyncStorage.setItem('authToken', token);
    } else {
      await SecureStore.setItemAsync('authToken', token);
    }
    this.setToken(token);
  }

  async getStoredToken() {
    return Platform.OS === 'web'
      ? AsyncStorage.getItem('authToken')
      : SecureStore.getItemAsync('authToken');
  }

  async clearToken() {
    if (Platform.OS === 'web') {
      await AsyncStorage.removeItem('authToken');
    } else {
      await SecureStore.deleteItemAsync('authToken');
    }
    this.setToken(null);
  }

  async clearLegacyManagerCaches() {
    await AsyncStorage.multiRemove([
      'tapTrack.adminHistory',
      'tapTrack.driverRegistrations',
    ]);
  }

  // ==================== Auth ====================
  async login(email: string, password: string, role?: 'manager' | 'driver') {
    const endpointCandidates = [] as string[];

    if (role === 'manager') {
      endpointCandidates.push(
        normalizeApiEndpoint(managerLoginEndpoint),
        normalizeApiEndpoint('/login'),
        normalizeApiEndpoint('/auth/login'),
        normalizeApiEndpoint('/manager/login'),
      );
    } else {
      endpointCandidates.push(
        normalizeApiEndpoint(driverLoginEndpoint),
        normalizeApiEndpoint('/login'),
        normalizeApiEndpoint('/auth/login'),
        normalizeApiEndpoint('/driver/login'),
      );
    }

    const uniqueCandidates = [...new Set(endpointCandidates.filter(Boolean))];
    let lastError: any = null;

    for (const endpoint of uniqueCandidates) {
      try {
        const response = await this.axiosInstance.post(endpoint, { email, password });
        return response.data;
      } catch (error: any) {
        lastError = error;
        const status = error.response?.status;

        if (status === 404) {
          continue;
        }

        throw error;
      }
    }

    const finalError = lastError || new Error('Login failed');
    const message = finalError.response?.data?.message || finalError.message || 'The backend rejected this login request.';
    throw new Error(message);
  }

  async createManagerDriver(data: DriverRegistrationRequest) {
    const response = await this.axiosInstance.post('/manager/drivers', {
      ...data,
      full_name: `${data.first_name} ${data.last_name}`.trim(),
      phone_number: data.contact_number,
      unit: data.plate_number,
    });
    return response.data;
  }

  async logout(role: 'manager' | 'driver') {
    const endpoint = role === 'driver' ? '/driver/logout' : '/manager/logout';
    await this.axiosInstance.post(endpoint);
  }

  async getCurrentUser() {
    const response = await this.axiosInstance.get(normalizeApiEndpoint(MANAGER_PROFILE_ENDPOINT));
    return response.data;
  }

  async getManagerProfile() {
    const response = await this.axiosInstance.get(normalizeApiEndpoint(MANAGER_PROFILE_ENDPOINT));
    return response.data;
  }

  async getDriverQR() {
    const response = await this.axiosInstance.get('/driver/qr');
    return response.data;
  }

  async scanQrIdentifier(qrIdentifier: string) {
    const response = await this.axiosInstance.post(
      normalizeApiEndpoint(managerQrScanEndpoint),
      { qr_identifier: qrIdentifier },
      { validateStatus: (status) => (status >= 200 && status < 300) || status === 422 },
    );
    return response.data;
  }

  async getAdminDashboardSummary() {
    if (!managerDashboardEndpoint) {
      return { summary: { recent_activity: [] } };
    }

    try {
      const response = await this.axiosInstance.get(normalizeApiEndpoint(managerDashboardEndpoint));
      return response.data;
    } catch (error: any) {
      if (error.response?.status === 404) {
        throw new Error(`Manager dashboard route not found: GET ${managerDashboardEndpoint}.`);
      }
      throw error;
    }
  }

  async getAdminTransactions() {
    if (!managerTransactionsEndpoint) return [];

    try {
      const response = await this.axiosInstance.get(managerTransactionsEndpoint);
      return response.data;
    } catch (error: any) {
      if (error.response?.status === 404) {
        throw new Error(`Manager transactions route not found: GET ${managerTransactionsEndpoint}. Set EXPO_PUBLIC_MANAGER_TRANSACTIONS_ENDPOINT to the registered API route.`);
      }
      throw error;
    }
  }

  async getManagerDrivers() {
    const response = await this.axiosInstance.get('/manager/drivers');
    return response.data;
  }

  async getManagerSchedules() {
    const response = await this.axiosInstance.get('/manager/schedules');
    return response.data;
  }

  async createManagerSchedule(data: {
    title: string;
    description?: string;
    event_date: string;
    start_time: string;
    end_time: string;
    location: string;
  }) {
    const response = await this.axiosInstance.post('/manager/schedules', data);
    return response.data;
  }

  async updateManagerSchedule(
    eventId: number,
    data: {
      title: string;
      description?: string;
      event_date: string;
      start_time: string;
      end_time: string;
      location: string;
    },
  ) {
    const response = await this.axiosInstance.put(`/manager/schedules/${eventId}`, data);
    return response.data;
  }

  async deleteManagerSchedule(eventId: number) {
    const response = await this.axiosInstance.delete(`/manager/schedules/${eventId}`);
    return response.data;
  }

  async getManagerTripDestinations() {
    const response = await this.axiosInstance.get('/manager/trip-destinations');
    return response.data;
  }

  async createManagerTripDestination(name: string) {
    const response = await this.axiosInstance.post('/manager/trip-destinations', { name });
    return response.data;
  }

  async deactivateManagerTripDestination(destinationId: number) {
    const response = await this.axiosInstance.delete(`/manager/trip-destinations/${destinationId}`);
    return response.data;
  }

  // ==================== Driver Profile ====================
  async getDriverProfile() {
    const response = await this.axiosInstance.get(normalizeApiEndpoint(driverProfileEndpoint));
    return response.data;
  }

  async updateDriverProfile(data: Record<string, unknown>) {
    const response = await this.axiosInstance.put('/driver/profile', data);
    return response.data;
  }

  async updateManagerProfile(data: Record<string, unknown>) {
    const response = await this.axiosInstance.put(normalizeApiEndpoint(MANAGER_PROFILE_ENDPOINT), data);
    return response.data;
  }

  async uploadProfileImage(uri: string, fileName = 'profile-picture.jpg') {
    const extension = fileName.split('.').pop()?.toLowerCase() || 'jpg';
    const mimeType = extension === 'png' ? 'image/png' : extension === 'webp' ? 'image/webp' : 'image/jpeg';
    const file = { uri, name: fileName, type: mimeType } as any;
    const formData = new FormData();
    formData.append('avatar', file);

    const response = await this.axiosInstance.post(PROFILE_IMAGE_ENDPOINT, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  }

  async removeProfileImage() {
    const response = await this.axiosInstance.delete(PROFILE_IMAGE_ENDPOINT);
    return response.data;
  }

  async uploadManagerProfileImage(uri: string, fileName = 'profile-picture.jpg') {
    const extension = fileName.split('.').pop()?.toLowerCase() || 'jpg';
    const mimeType = extension === 'png' ? 'image/png' : extension === 'webp' ? 'image/webp' : 'image/jpeg';
    const formData = new FormData();
    formData.append('avatar', { uri, name: fileName, type: mimeType } as any);
    const response = await this.axiosInstance.post(
      normalizeApiEndpoint(MANAGER_PROFILE_IMAGE_ENDPOINT),
      formData,
      { headers: { 'Content-Type': 'multipart/form-data' } },
    );
    return response.data;
  }

  async removeManagerProfileImage() {
    const response = await this.axiosInstance.delete(normalizeApiEndpoint(MANAGER_PROFILE_IMAGE_ENDPOINT));
    return response.data;
  }

  async requestPasswordOtp(email: string, role: 'manager' | 'driver' = 'driver') {
    const endpoint = role === 'manager' ? MANAGER_PASSWORD_OTP_REQUEST_ENDPOINT : PASSWORD_OTP_REQUEST_ENDPOINT;
    const response = await this.axiosInstance.post(endpoint, { email });
    return response.data;
  }

  async verifyPasswordOtp(email: string, otp: string, role: 'manager' | 'driver' = 'driver') {
    const endpoint = role === 'manager' ? MANAGER_PASSWORD_OTP_VERIFY_ENDPOINT : PASSWORD_OTP_VERIFY_ENDPOINT;
    const response = await this.axiosInstance.post(endpoint, { email, otp });
    return response.data;
  }

  async resetPassword(email: string, otp: string, password: string, passwordConfirmation: string, role: 'manager' | 'driver' = 'driver') {
    const endpoint = role === 'manager' ? MANAGER_PASSWORD_RESET_ENDPOINT : PASSWORD_RESET_ENDPOINT;
    const response = await this.axiosInstance.post(endpoint, {
      email,
      otp,
      password,
      password_confirmation: passwordConfirmation,
    });
    return response.data;
  }

  async updateDriverDutyStatus(status: 'on_duty' | 'off_duty') {
    try {
      const response = await this.axiosInstance.post('/driver/shift-status', {
        shift_status: status === 'off_duty' ? 'Off Duty' : 'Available',
      });
      return response.data;
    } catch (error: any) {
      if (error.response?.status === 404) {
        throw new Error('Driver duty status endpoint is not available. Ensure POST /api/driver/shift-status is registered in Laravel.');
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

  async getActiveTrip() {
    const response = await this.axiosInstance.get('/driver/trips/active');
    return response.data;
  }

  async getTripSummary() {
    const response = await this.axiosInstance.get('/driver/trips/summary');
    return response.data;
  }

  async getDriverTripDestinations() {
    const response = await this.axiosInstance.get('/driver/trip-destinations');
    return response.data;
  }

  async startTrip(destinationId: number, passengerCount: number) {
    const response = await this.axiosInstance.post('/driver/trips', {
      destination_id: destinationId,
      passenger_count: passengerCount,
    });
    return response.data;
  }

  async completeTrip(tripId: string) {
    const response = await this.axiosInstance.post(`/driver/trips/${encodeURIComponent(tripId)}/complete`);
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
  async getNotifications(limit = 20, role: 'manager' | 'driver' = 'driver') {
    const endpoint = role === 'manager' ? MANAGER_NOTIFICATIONS_ENDPOINT : NOTIFICATIONS_ENDPOINT;
    const response = await this.axiosInstance.get(endpoint, {
      params: { limit },
    });
    return response.data;
  }

  async registerPushToken(token: string, role: 'manager' | 'driver') {
    const endpoint = role === 'manager' ? MANAGER_NOTIFICATIONS_ENDPOINT : NOTIFICATIONS_ENDPOINT;
    const response = await this.axiosInstance.post(`${endpoint}/push-token`, {
      expo_push_token: token,
    });
    return response.data;
  }

  async removePushToken(token: string, role: 'manager' | 'driver') {
    const endpoint = role === 'manager' ? MANAGER_NOTIFICATIONS_ENDPOINT : NOTIFICATIONS_ENDPOINT;
    const response = await this.axiosInstance.delete(`${endpoint}/push-token`, {
      data: { expo_push_token: token },
    });
    return response.data;
  }

  async markNotificationAsRead(notificationId: string, role: 'manager' | 'driver' = 'driver') {
    const endpoint = role === 'manager' ? MANAGER_NOTIFICATIONS_ENDPOINT : NOTIFICATIONS_ENDPOINT;
    const response = await this.axiosInstance.put(
      `${endpoint}/${encodeURIComponent(notificationId)}/read`
    );
    return response.data;
  }

  async getUnreadNotificationsCount(role: 'manager' | 'driver' = 'driver') {
    const endpoint = role === 'manager' ? MANAGER_NOTIFICATIONS_ENDPOINT : NOTIFICATIONS_ENDPOINT;
    const response = await this.axiosInstance.get(
      `${endpoint}/unread/count`
    );
    return response.data;
  }
}

export const apiService = new ApiService();
