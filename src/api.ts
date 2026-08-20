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

export const login = async (username: string, password: string) => {
  const res = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password }),
  });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || 'Error de autenticación');
  }
  return res.json();
};

export const changePassword = async (username: string, oldPassword: string, newPassword: string) => {
  const res = await fetch(`${API_BASE}/auth/change-password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, oldPassword, newPassword }),
  });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || 'Error al cambiar contraseña');
  }
  return res.json();
};

export const updateProfile = async (username: string, fullName: string, carModel: string, carPlate: string) => {
  const res = await fetch(`${API_BASE}/auth/profile`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, fullName, carModel, carPlate }),
  });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || 'Error al actualizar el perfil');
  }
  return res.json();
};

export const getUsers = async () => {
  const res = await fetch(`${API_BASE}/admin/users`);
  if (!res.ok) throw new Error('Failed to fetch users');
  return res.json();
};

export const createUser = async (username: string, password: string, role: string = 'admin', fullName: string = '', carModel: string = '', carPlate: string = '') => {
  const res = await fetch(`${API_BASE}/admin/users`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password, role, fullName, carModel, carPlate }),
  });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || 'Error al crear usuario');
  }
  return res.json();
};

export const deleteUser = async (username: string) => {
  const res = await fetch(`${API_BASE}/admin/users/${username}`, {
    method: 'DELETE',
  });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || 'Error al eliminar usuario');
  }
  return res.json();
};
