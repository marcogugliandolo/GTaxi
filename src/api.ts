import { BookingData } from './types';

const API_BASE = '/api';

export const getSettings = async () => {
  const res = await fetch(`${API_BASE}/settings`);
  if (!res.ok) throw new Error('Failed to fetch settings');
  return res.json();
};

export const saveSettings = async (settings: { whatsapp: string; telegram: string }) => {
  const res = await fetch(`${API_BASE}/settings`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(settings),
  });
  if (!res.ok) throw new Error('Failed to save settings');
  return res.json();
};

export const getBookings = async () => {
  const res = await fetch(`${API_BASE}/bookings`);
  if (!res.ok) throw new Error('Failed to fetch bookings');
  return res.json();
};

export const saveBooking = async (booking: BookingData) => {
  const res = await fetch(`${API_BASE}/bookings`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(booking),
  });
  if (!res.ok) throw new Error('Failed to save booking');
  return res.json();
};

export const updateBookingStatus = async (id: string, status: 'approved' | 'cancelled') => {
  const res = await fetch(`${API_BASE}/bookings/${id}/status`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status }),
  });
  if (!res.ok) throw new Error('Failed to update booking status');
  return res.json();
};
