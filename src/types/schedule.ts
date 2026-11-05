export interface Schedule {
  id: string;
  driver_id: string;
  date: string;
  start_time: string;
  end_time: string;
  terminal_id?: string;
  terminal_name?: string;
  vehicle_id?: string;
  vehicle_number?: string;
  status: 'present' | 'absent' | 'upcoming' | 'completed';
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface ScheduleWithStatus extends Schedule {
  is_today: boolean;
  work_hours?: number;
}

export interface OrganizationEvent {
  id: number;
  organization_id: number;
  title: string;
  description: string | null;
  event_date: string;
  start_time: string;
  end_time: string;
  location: string;
  created_at: string;
  updated_at: string;
}
