import React, { useMemo } from 'react';
import { BookingData } from '../types';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  LineChart,
  Line
} from 'recharts';
import { format, subDays, startOfDay, isSameDay } from 'date-fns';
import { es } from 'date-fns/locale';
import { TrendingUp, Calendar, CheckCircle2, Clock, XCircle } from 'lucide-react';

interface AdminDashboardProps {
  bookings: BookingData[];
}

export default function AdminDashboard({ bookings }: AdminDashboardProps) {
  // Compute basic stats
  const totalBookings = bookings.length;
  const pendingBookings = bookings.filter(b => b.status === 'pending').length;
  const approvedBookings = bookings.filter(b => b.status === 'approved').length;
  const cancelledBookings = bookings.filter(b => b.status === 'cancelled').length;

  // Prepare data for the last 7 days chart
  const weeklyData = useMemo(() => {
    const data = [];
    const today = startOfDay(new Date());
    
    for (let i = 6; i >= 0; i--) {
      const date = subDays(today, i);
      const dayBookings = bookings.filter(b => {
        if (!b.createdAt) return false;
        return isSameDay(new Date(b.createdAt), date);
      });
      
      data.push({
        name: format(date, 'EEE', { locale: es }),
        dateStr: format(date, 'dd MMM', { locale: es }),
        reservas: dayBookings.length,
        completadas: dayBookings.filter(b => b.status === 'approved').length,
      });
    }
    return data;
  }, [bookings]);

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-20">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-100 dark:border-slate-800 shadow-sm flex flex-col">
          <div className="flex justify-between items-start mb-4">
            <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-500/10 flex items-center justify-center text-blue-600 dark:text-blue-400">
              <Calendar className="w-5 h-5" />
            </div>
            <span className="flex items-center gap-1 text-xs font-bold text-green-600 bg-green-50 dark:bg-green-500/10 px-2 py-1 rounded-md">
              <TrendingUp className="w-3 h-3" /> All
            </span>
          </div>
          <span className="text-3xl font-extrabold text-slate-900 dark:text-white">{totalBookings}</span>
          <span className="text-sm font-medium text-slate-500 dark:text-slate-400 mt-1">Total Reservas</span>
        </div>
        
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-100 dark:border-slate-800 shadow-sm flex flex-col">
          <div className="flex justify-between items-start mb-4">
            <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-500/10 flex items-center justify-center text-amber-600 dark:text-amber-400">
              <Clock className="w-5 h-5" />
            </div>
          </div>
          <span className="text-3xl font-extrabold text-slate-900 dark:text-white">{pendingBookings}</span>
          <span className="text-sm font-medium text-slate-500 dark:text-slate-400 mt-1">Pendientes</span>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-100 dark:border-slate-800 shadow-sm flex flex-col">
          <div className="flex justify-between items-start mb-4">
            <div className="w-10 h-10 rounded-xl bg-green-50 dark:bg-green-500/10 flex items-center justify-center text-green-600 dark:text-green-400">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </div>
          <span className="text-3xl font-extrabold text-slate-900 dark:text-white">{approvedBookings}</span>
          <span className="text-sm font-medium text-slate-500 dark:text-slate-400 mt-1">Aprobadas</span>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-100 dark:border-slate-800 shadow-sm flex flex-col">
          <div className="flex justify-between items-start mb-4">
            <div className="w-10 h-10 rounded-xl bg-red-50 dark:bg-red-500/10 flex items-center justify-center text-red-600 dark:text-red-400">
              <XCircle className="w-5 h-5" />
            </div>
          </div>
          <span className="text-3xl font-extrabold text-slate-900 dark:text-white">{cancelledBookings}</span>
          <span className="text-sm font-medium text-slate-500 dark:text-slate-400 mt-1">Canceladas</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-100 dark:border-slate-800 shadow-sm">
          <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-6">Reservas de los Últimos 7 Días</h3>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={weeklyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis 
                  dataKey="name" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#64748b', fontSize: 12, fontWeight: 600 }}
                  dy={10}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#64748b', fontSize: 12, fontWeight: 600 }}
                />
                <Tooltip 
                  cursor={{ fill: 'rgba(241, 245, 249, 0.5)' }}
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', fontWeight: 600, color: '#0f172a' }}
                  labelStyle={{ color: '#64748b', marginBottom: '4px' }}
                />
                <Bar dataKey="reservas" fill="#FFD700" radius={[4, 4, 0, 0]} name="Total Reservas" maxBarSize={40} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-100 dark:border-slate-800 shadow-sm">
          <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-6">Tendencia de Aprobación</h3>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={weeklyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis 
                  dataKey="name" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#64748b', fontSize: 12, fontWeight: 600 }}
                  dy={10}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#64748b', fontSize: 12, fontWeight: 600 }}
                />
                <Tooltip 
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', fontWeight: 600, color: '#0f172a' }}
                  labelStyle={{ color: '#64748b', marginBottom: '4px' }}
                />
                <Line type="monotone" dataKey="completadas" stroke="#22c55e" strokeWidth={3} dot={{ r: 4, strokeWidth: 2 }} activeDot={{ r: 6 }} name="Aprobadas" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
