export interface BookingData {
  id?: string;
  pickup: string;
  dropoff: string;
  date: string;
  time: string;
  passengers: number;
  name: string;
  phone: string;
  notes: string;
  status?: 'pending' | 'approved' | 'cancelled';
  createdAt?: number;
}
