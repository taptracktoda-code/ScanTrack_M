export type DriverRegistrationStatus = 'pending_verification' | 'active' | 'rejected';

export type DriverOrganization = string | { id?: string | number; name?: string };

export interface Driver {
  id: string;
  name: string;
  email: string;
  phone?: string;
  driver_id?: string;
  role?: 'driver' | 'manager' | 'admin';
  toda?: DriverOrganization;
  toda_name?: string;
  organization_name?: string;
  organization?: DriverOrganization;
  association_name?: string;
  association?: DriverOrganization;
  qr_identifier?: string;
  qr_status?: 'active' | 'inactive' | 'blocked' | 'unregistered';
  qr_code_status?: 'active' | 'inactive' | 'blocked' | 'unregistered';
  vehicle_id?: string;
  vehicle_number?: string;
  account_status: 'active' | 'inactive' | 'suspended' | 'pending_verification' | 'rejected';
  verification_status?: DriverRegistrationStatus;
  rejection_reason?: string;
  duty_status?: 'on_duty' | 'off_duty';
  avatar?: string;
  created_at?: string;
  updated_at?: string;
}

export interface DriverRegistrationRequest {
  first_name: string;
  last_name: string;
  email: string;
  contact_number: string;
  license_number: string;
  license_expiration_date: string;
  plate_number: string;
  vehicle_type: string;
  address: string;
}

export interface DriverRegistration {
  id?: string;
  full_name: string;
  email: string;
  phone_number: string;
  license_number: string;
  unit: string;
  address: string;
  status: DriverRegistrationStatus;
  rejection_reason?: string | null;
  submitted_at?: string;
  updated_at?: string;
  driver?: Driver | null;
  error?: string;
}

export interface DriverProfile extends Driver {
  total_trips?: number;
  completed_trips?: number;
  cancelled_trips?: number;
  daily_position?: number;
}
