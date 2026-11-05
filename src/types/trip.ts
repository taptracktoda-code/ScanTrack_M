export interface Trip {
  id: string;
  trip_id: string;
  driver_id: string;
  driver_name?: string;
  route_id?: string;
  origin?: string;
  destination: string;
  passenger_count: number;
  status: 'completed' | 'in_progress' | 'cancelled' | 'pending';
  departure_time?: string;
  arrival_time?: string;
  date: string;
  vehicle_id?: string;
  created_at: string;
  updated_at: string;
}

export interface TripSummary {
  total_trips: number;
  completed_trips: number;
  cancelled_trips: number;
  in_progress_trips: number;
}

export interface TripDestination {
  id: number;
  name: string;
  status?: 'Active' | 'Inactive';
}

export interface TripWithDetails extends Trip {
  distance?: number;
  fare?: number;
  notes?: string;
}
