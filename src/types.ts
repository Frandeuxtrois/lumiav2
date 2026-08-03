export type AppointmentStatus = 'available' | 'booked' | 'cancelled' | 'completed' | 'blocked';

export interface Appointment {
  id: string;
  name: string | null;
  email: string | null;
  phone: string | null;
  notes: string | null;
  date: string;
  time: string;
  status: AppointmentStatus;
  created_at: string;
}

export interface AvailabilityConfig {
  id: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
}

export interface User {
  id: string;
  email: string;
}
