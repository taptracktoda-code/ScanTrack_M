export interface Driver {
  id: string;
  name: string;
  email: string;
  phone?: string;
  driver_id?: string;
  role?: 'driver' | 'admin';
  qr_identifier?: string;
  qr_status?: 'active' | 'inactive' | 'blocked';
  vehicle_id?: string;
  vehicle_number?: string;
  organization?: string;
  account_status: 'active' | 'inactive' | 'suspended';
  duty_status?: 'on_duty' | 'off_duty';
  avatar?: string;
  created_at?: string;
  updated_at?: string;
}

export interface DriverProfile extends Driver {
  total_trips?: number;
  completed_trips?: number;
  cancelled_trips?: number;
  daily_position?: number;
}
