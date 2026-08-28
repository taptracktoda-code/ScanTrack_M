export interface Notification {
  id: string;
  driver_id: string;
  title: string;
  message: string;
  type: 'attendance' | 'trip' | 'schedule' | 'system';
  is_read: boolean;
  data?: Record<string, unknown>;
  created_at: string;
}
