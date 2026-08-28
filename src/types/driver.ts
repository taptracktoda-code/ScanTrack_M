export interface Driver {
  id: string;
  name: string;
  email: string;
  phone?: string;
  driver_id: string;
  nfc_card_uid?: string;
  nfc_card_status: 'registered' | 'unregistered' | 'blocked';
  vehicle_id?: string;
  vehicle_number?: string;
  account_status: 'active' | 'inactive' | 'suspended';
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
