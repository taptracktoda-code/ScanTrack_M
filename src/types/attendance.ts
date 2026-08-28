export interface AttendanceRecord {
  id: string;
  driver_id: string;
  entry_time?: string;
  exit_time?: string;
  entry_verified: boolean;
  exit_verified: boolean;
  work_duration?: string;
  date: string;
  status: 'completed' | 'in_progress' | 'absent' | 'late';
  created_at: string;
  updated_at: string;
}

export interface DailyAttendance {
  date: string;
  entry_time?: string;
  exit_time?: string;
  status: 'checked_in' | 'checked_out' | 'not_checked_in' | 'completed';
  work_duration?: string;
  entry_verified: boolean;
  exit_verified: boolean;
}

export interface MonthlyAttendanceStats {
  month: string;
  present_days: number;
  absent_days: number;
  late_records: number;
  total_work_hours: number;
}

export interface AttendanceSummary {
  total_attendance: number;
  total_absences: number;
  total_late: number;
  average_work_hours: number;
  total_work_hours: number;
  attendance_rate: number;
}
