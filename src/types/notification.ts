export interface Notification {
  id: string;
  driver_id?: string;
  user_id?: string;
  title: string;
  message: string;
  type: 'attendance' | 'trip' | 'schedule' | 'system' | 'account' | 'security' | 'registration';
  is_read: boolean;
  data?: Record<string, unknown>;
  created_at: string;
  read_at?: string | null;
}
