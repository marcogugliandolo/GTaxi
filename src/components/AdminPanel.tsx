import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';
import { X, Lock, Settings, Save, LogOut, List, Check, Ban, User, CarFront, Home, Shield, LayoutDashboard } from 'lucide-react';
import { BookingData } from '../types';
import { getBookings, updateBookingStatus, getSettings, saveSettings } from '../api';
import AdminDashboard from './AdminDashboard';

export default function AdminPanel() {
  const navigate = useNavigate();
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const { t } = useLanguage();
  
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    try {
      return localStorage.getItem('admin_auth') === 'true';
    } catch (e) {
      return false;
    }
  });
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  
  const [waNumber, setWaNumber] = useState('');
  const [tgUser, setTgUser] = useState('');
  
  const [activeTab, setActiveTab] = useState<'dashboard' | 'reservations' | 'settings'>('dashboard');
  const [reservations, setReservations] = useState<BookingData[]>([]);
  
  const [actionConfirm, setActionConfirm] = useState<{ id: string, action: 'approved' | 'cancelled', res: BookingData } | null>(null);
  const [selectedReservation, setSelectedReservation] = useState<BookingData | null>(null);

  useEffect(() => {
    if (isAuthenticated) {
      loadReservations();
      getSettings().then(s => {
        setWaNumber(s.whatsapp || '');
        setTgUser(s.telegram || '');
      }).catch(e => console.error(e));
      
      const evtSource = new EventSource('/api/admin/events');
      evtSource.addEventListener('new_booking', (event) => {
        const booking = JSON.parse(event.data);
        setReservations(prev => [booking, ...prev]);
        if (audioRef.current) {
          audioRef.current.play().catch(e => console.log('Audio play failed', e));
        }
      });
      return () => evtSource.close();
    }
  }, [isAuthenticated]);

  const loadReservations = async () => {
    try {
      const data = await getBookings();
      setReservations(data);
    } catch (e) {
      console.error(e);
    }
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (username.toLowerCase() === 'gabriel' && password === 'gtaxi2026') {
      setIsAuthenticated(true);
      try {
        localStorage.setItem('admin_auth', 'true');
      } catch (e) {
        console.error(e);
      }
      setError('');
    } else {
      setError('Usuario o contraseña incorrectos');
    }
  };
  
  const handleLogout = () => {
    setIsAuthenticated(false);
    setUsername('');
    setPassword('');
    try {
      localStorage.removeItem('admin_auth');
    } catch (e) {
      console.error(e);
    }
  };

  const handleSave = async () => {
    await saveSettings({ whatsapp: waNumber, telegram: tgUser });
    alert('Configuración guardada exitosamente');
  };

  const handleAction = async (id: string, action: 'approved' | 'cancelled') => {
    try {
      const res = reservations.find(r => r.id === id);
      if (!res) return;
      
      const updatedRes = await updateBookingStatus(id, action);
      if (!updatedRes) return;
      
      const updated = reservations.map(r => r.id === id ? { ...r, status: action } : r);
      setReservations(updated);
      
      let message = '';
      if (action === 'approved') {
        message = `✅ *RESERVA CONFIRMADA - GTaxi*\n\nHola ${res.name}, tu reserva ha sido aprobada.\n📍 De: ${res.pickup}\n🏁 A: ${res.dropoff}\n📅 El ${res.date} a las ${res.time}\n\nEl conductor estará allí puntualmente. ¡Gracias por elegir GTaxi!`;
      } else {
        message = `❌ *RESERVA CANCELADA - GTaxi*\n\nHola ${res.name}, lamentablemente no podemos confirmar tu reserva para el ${res.date} a las ${res.time}.\n\nPor favor, disculpa las molestias o contáctanos para buscar otra alternativa.`;
      }
      
      const text = encodeURIComponent(message);
      
      let formattedPhone = res.phone.replace(/\D/g, '');
      if (formattedPhone.length === 9) {
        formattedPhone = '34' + formattedPhone;
      }
      
      window.open(`https://wa.me/${formattedPhone}?text=${text}`, '_blank');
    } catch (e) {
      console.error(e);
      alert('Error al actualizar la reserva');
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-[100dvh] w-full bg-slate-50 dark:bg-slate-950 flex flex-col p-4 md:p-8 items-center justify-center">
        <div className="bg-white dark:bg-slate-900 rounded-3xl w-full max-w-md shadow-2xl overflow-hidden relative border border-slate-100 dark:border-slate-800">
          <button 
            onClick={() => navigate('/')}
            className="absolute top-4 right-4 px-4 py-2 text-sm text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 rounded-full transition-colors z-10"
          >
            <span className="font-bold">Volver al Inicio</span>
          </button>
          
          <div className="p-8">
            <div className="relative w-20 h-20 mx-auto mb-6">
              <div className="w-full h-full bg-[#FFD700] rounded-[1.5rem] flex items-center justify-center shadow-[0_8px_32px_rgba(255,215,0,0.4)]">
                <CarFront className="w-10 h-10 text-slate-900 dark:text-white" strokeWidth={2.5} />
              </div>
              <div className="absolute -bottom-2 -right-2 w-9 h-9 bg-slate-900 dark:bg-white rounded-xl flex items-center justify-center shadow-xl border-[3px] border-white dark:border-slate-900">
                <Shield className="w-4 h-4 text-white dark:text-slate-900" strokeWidth={2.5} />
              </div>
            </div>
            
            <h2 className="text-2xl font-bold text-center text-slate-900 dark:text-white mb-2">Acceso Administrativo</h2>
            <p className="text-center text-slate-500 dark:text-slate-400 mb-8 text-sm">Ingresa tus credenciales para continuar.</p>
            
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <input
                  type="text"
                  placeholder="Usuario"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800/50 border-2 border-slate-100 dark:border-slate-700 focus:ring-4 focus:ring-[#FFD700]/20 focus:border-[#FFD700] rounded-xl py-3 px-4 text-slate-900 dark:text-white outline-none transition-all"
                />
              </div>
              <div>
                <input
                  type="password"
                  placeholder="Contraseña"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800/50 border-2 border-slate-100 dark:border-slate-700 focus:ring-4 focus:ring-[#FFD700]/20 focus:border-[#FFD700] rounded-xl py-3 px-4 text-slate-900 dark:text-white outline-none transition-all"
                />
                {error && <p className="text-red-500 text-sm mt-2 font-medium">{error}</p>}
              </div>
              <button
                type="submit"
                className="w-full bg-slate-900 text-white font-bold py-3 rounded-xl hover:bg-slate-800 transition-colors mt-2"
              >
                Acceder
              </button>
            </form>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-[100dvh] w-full bg-slate-50 dark:bg-slate-950 overflow-hidden font-sans">
      <audio ref={audioRef} src="https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3" preload="auto" />
      
      {/* Sidebar */}
      <div className="w-72 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 hidden md:flex flex-col shadow-sm z-10">
        <div className="h-20 flex items-center px-8 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-3 text-slate-900 dark:text-white">
            <div className="w-10 h-10 bg-[#FFD700] rounded-xl flex items-center justify-center shadow-[0_4px_12px_rgba(255,215,0,0.3)] relative">
              <CarFront className="w-5 h-5 text-slate-900 dark:text-white" strokeWidth={2.5} />
              <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-slate-900 dark:bg-white rounded-md flex items-center justify-center border-2 border-white dark:border-slate-900">
                <Shield className="w-2.5 h-2.5 text-white dark:text-slate-900" strokeWidth={3} />
              </div>
            </div>
            <span className="font-extrabold text-xl tracking-tight">GTaxi Admin</span>
          </div>
        </div>
        
        <div className="flex-1 overflow-y-auto py-6 px-4 space-y-2">
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-all ${
              activeTab === 'dashboard' 
                ? 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm' 
                : 'text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800/50 hover:text-slate-700 dark:hover:text-slate-300'
            }`}
          >
            <LayoutDashboard className="w-5 h-5" /> Dashboard
          </button>
          <button
            onClick={() => setActiveTab('reservations')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-all ${
              activeTab === 'reservations' 
                ? 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm' 
                : 'text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800/50 hover:text-slate-700 dark:hover:text-slate-300'
            }`}
          >
            <List className="w-5 h-5" /> Reservas
          </button>
          <button
            onClick={() => setActiveTab('settings')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-all ${
              activeTab === 'settings' 
                ? 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm' 
                : 'text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800/50 hover:text-slate-700 dark:hover:text-slate-300'
            }`}
          >
            <Settings className="w-5 h-5" /> Configuración
          </button>
        </div>
        
        <div className="p-4 border-t border-slate-100 dark:border-slate-800 space-y-2">
          <button
            onClick={() => navigate('/')}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-bold text-slate-600 dark:text-slate-300 bg-slate-50 hover:bg-slate-100 dark:bg-slate-800/50 dark:hover:bg-slate-800 transition-colors"
          >
            <Home className="w-4 h-4" /> Volver al Inicio
          </button>
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-bold text-red-600 bg-red-50 hover:bg-red-100 dark:bg-red-500/10 dark:hover:bg-red-500/20 transition-colors"
          >
            <LogOut className="w-4 h-4" /> Cerrar Sesión
          </button>
        </div>
      </div>

      {/* Main Area */}
      <div className="flex-1 flex flex-col h-full overflow-hidden relative">
        {/* Mobile Header */}
        <div className="md:hidden flex-shrink-0 h-16 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between px-4 shadow-sm z-10">
          <span className="font-extrabold text-lg tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
            <div className="w-8 h-8 bg-[#FFD700] rounded-lg flex items-center justify-center shadow-sm relative mr-1">
              <CarFront className="w-4 h-4 text-slate-900 dark:text-white" strokeWidth={2.5} />
              <div className="absolute -bottom-1 -right-1 w-3.5 h-3.5 bg-slate-900 dark:bg-white rounded flex items-center justify-center border-[1.5px] border-white dark:border-slate-900">
                <Shield className="w-2 h-2 text-white dark:text-slate-900" strokeWidth={3} />
              </div>
            </div> GTaxi Admin
          </span>
          <button onClick={handleLogout} className="p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg">
            <LogOut className="w-5 h-5" />
          </button>
        </div>
        
        {/* Mobile Tabs */}
        <div className="md:hidden flex-shrink-0 flex bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-2 pt-2">
          <button
             onClick={() => setActiveTab('dashboard')}
             className={`flex-1 pb-3 pt-2 font-bold text-sm border-b-2 transition-colors flex justify-center items-center gap-2 ${activeTab === 'dashboard' ? 'border-[#FFD700] text-slate-900 dark:text-white' : 'border-transparent text-slate-400 hover:text-slate-700'}`}
           >
             <LayoutDashboard className="w-4 h-4" /> Dashboard
           </button>
          <button
             onClick={() => setActiveTab('reservations')}
             className={`flex-1 pb-3 pt-2 font-bold text-sm border-b-2 transition-colors flex justify-center items-center gap-2 ${activeTab === 'reservations' ? 'border-[#FFD700] text-slate-900 dark:text-white' : 'border-transparent text-slate-400 hover:text-slate-700'}`}
           >
             <List className="w-4 h-4" /> Reservas
           </button>
           <button
             onClick={() => setActiveTab('settings')}
             className={`flex-1 pb-3 pt-2 font-bold text-sm border-b-2 transition-colors flex justify-center items-center gap-2 ${activeTab === 'settings' ? 'border-[#FFD700] text-slate-900 dark:text-white' : 'border-transparent text-slate-400 hover:text-slate-700'}`}
           >
             <Settings className="w-4 h-4" /> Configuración
           </button>
        </div>

        {/* Header Desktop */}
        <div className="hidden md:flex h-20 items-center px-10">
           <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
             {activeTab === 'dashboard' ? 'Dashboard' : activeTab === 'reservations' ? 'Gestión de Reservas' : 'Configuración del Sistema'}
           </h1>
        </div>

        <div className="flex-1 overflow-y-auto p-4 md:p-10 pb-20 md:pb-10 bg-slate-50 dark:bg-slate-950">
          <div className="max-w-5xl mx-auto space-y-6">
            {activeTab === 'dashboard' && (
              <AdminDashboard bookings={reservations} />
            )}

            {activeTab === 'reservations' && (
              <div className="space-y-4">
                {reservations.length === 0 ? (
                  <div className="text-center text-slate-500 dark:text-slate-400 py-20 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 border-dashed">
                    <List className="w-12 h-12 mx-auto mb-4 text-slate-300 dark:text-slate-700" />
                    <p className="text-lg font-medium">No hay reservas registradas.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                  {reservations.map((res) => (
                    <div 
                      key={res.id} 
                      className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-all cursor-pointer group"
                      onClick={() => setSelectedReservation(res)}
                    >
                      <div className="flex justify-between items-start mb-6">
                        <div className="flex gap-4 items-center">
                          <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500 dark:text-slate-400 group-hover:bg-[#FFD700]/20 group-hover:text-[#b39600] transition-colors">
                            <User className="w-6 h-6" />
                          </div>
                          <div>
                            <h3 className="font-bold text-lg text-slate-900 dark:text-white">{res.name}</h3>
                            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">{res.phone}</p>
                          </div>
                        </div>
                        <span className={`px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider ${
                          res.status === 'approved' ? 'bg-green-100 text-green-700 dark:bg-green-500/10 dark:text-green-400' : 
                          res.status === 'cancelled' ? 'bg-red-100 text-red-700 dark:bg-red-500/10 dark:text-red-400' : 
                          'bg-yellow-100 text-yellow-700 dark:bg-yellow-500/10 dark:text-yellow-400'
                        }`}>
                          {res.status === 'approved' ? 'Aprobada' : res.status === 'cancelled' ? 'Cancelada' : 'Pendiente'}
                        </span>
                      </div>
                      
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-2 bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl">
                        <div>
                          <span className="text-slate-400 dark:text-slate-500 block text-[10px] uppercase font-bold tracking-widest mb-1">Ruta</span>
                          <p className="text-slate-700 dark:text-slate-300 font-medium text-sm line-clamp-1">{res.pickup}</p>
                          <p className="text-slate-700 dark:text-slate-300 font-medium text-sm line-clamp-1 mt-0.5">&rarr; {res.dropoff}</p>
                        </div>
                        <div>
                          <span className="text-slate-400 dark:text-slate-500 block text-[10px] uppercase font-bold tracking-widest mb-1">Fecha y Hora</span>
                          <p className="text-slate-700 dark:text-slate-300 font-medium text-sm">{res.date}</p>
                          <p className="text-slate-700 dark:text-slate-300 font-medium text-sm mt-0.5">{res.time}</p>
                        </div>
                      </div>
                      
                      {res.status === 'pending' && (
                        <div className="flex gap-3 mt-4 pt-4 border-t border-slate-100 dark:border-slate-800">
                          <button
                            onClick={(e) => { e.stopPropagation(); setActionConfirm({ id: res.id!, action: 'approved', res }); }}
                            className="flex-1 bg-green-50 dark:bg-green-500/10 text-green-600 dark:text-green-400 hover:bg-green-100 dark:hover:bg-green-500/20 font-bold py-2.5 px-4 rounded-xl transition-colors flex items-center justify-center gap-2 text-sm"
                          >
                            <Check className="w-4 h-4" /> Aprobar
                          </button>
                          <button
                            onClick={(e) => { e.stopPropagation(); setActionConfirm({ id: res.id!, action: 'cancelled', res }); }}
                            className="flex-1 bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-500/20 font-bold py-2.5 px-4 rounded-xl transition-colors flex items-center justify-center gap-2 text-sm"
                          >
                            <Ban className="w-4 h-4" /> Cancelar
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'settings' && (
              <div className="bg-white dark:bg-slate-900 p-8 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm max-w-2xl">
                <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-6">Notificaciones y Contacto</h2>
                
                <div className="space-y-6">
                  <div className="space-y-3">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-widest">Número de WhatsApp</label>
                    <input
                      type="text"
                      value={waNumber}
                      onChange={(e) => setWaNumber(e.target.value)}
                      placeholder="Ej. 34600000000"
                      className="w-full bg-slate-50 dark:bg-slate-800/50 border-2 border-slate-100 dark:border-slate-800 focus:ring-4 focus:ring-green-500/20 focus:border-green-500 rounded-xl py-3 px-4 text-slate-900 dark:text-white outline-none transition-all font-medium"
                    />
                    <p className="text-xs text-slate-500 dark:text-slate-400">Incluye el código de país sin el símbolo +. Este es el número donde los clientes pueden contactar al administrador.</p>
                  </div>
                  <div className="space-y-3">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-widest">Usuario de Telegram</label>
                    <input
                      type="text"
                      value={tgUser}
                      onChange={(e) => setTgUser(e.target.value)}
                      placeholder="Ej. tu_usuario_taxi"
                      className="w-full bg-slate-50 dark:bg-slate-800/50 border-2 border-slate-100 dark:border-slate-800 focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 rounded-xl py-3 px-4 text-slate-900 dark:text-white outline-none transition-all font-medium"
                    />
                    <p className="text-xs text-slate-500 dark:text-slate-400">Sin el símbolo @. Enlace directo para abrir chat de Telegram.</p>
                  </div>
                  <button
                    onClick={handleSave}
                    className="w-full mt-8 bg-[#FFD700] text-black font-extrabold py-4 rounded-xl hover:bg-[#F2CB00] transition-colors flex items-center justify-center gap-2 text-lg shadow-sm"
                  >
                    <Save className="w-5 h-5" /> Guardar Configuración
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modals */}
      {selectedReservation && (
        <div className="fixed inset-0 z-[110] bg-slate-900/60 flex items-center justify-center p-3 sm:p-4 pt-[max(1rem,env(safe-area-inset-top))] pb-[max(1rem,env(safe-area-inset-bottom))] backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 rounded-2xl sm:rounded-3xl w-full max-w-xl shadow-2xl max-h-[82dvh] sm:max-h-[85vh] overflow-hidden flex flex-col border border-slate-200 dark:border-slate-800 my-auto">
            <div className="p-4 sm:p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-800/80 shrink-0">
              <div>
                <h3 className="font-extrabold text-base sm:text-xl text-slate-900 dark:text-white">Detalles de Reserva</h3>
                <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">Ref: {selectedReservation.id?.slice(0, 8)}</p>
              </div>
              <button onClick={() => setSelectedReservation(null)} className="p-2 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full transition-colors shadow-sm">
                <X className="w-5 h-5 text-slate-500" />
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto overscroll-contain p-4 sm:p-6 space-y-4 sm:space-y-6">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-0 bg-slate-50 dark:bg-slate-800/50 p-4 sm:p-5 rounded-2xl">
                <div>
                  <span className="text-slate-400 dark:text-slate-500 block text-[10px] uppercase font-bold tracking-widest mb-1">Estado de la reserva</span>
                  <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                    selectedReservation.status === 'approved' ? 'bg-green-100 text-green-700 dark:bg-green-500/20 dark:text-green-400' : 
                    selectedReservation.status === 'cancelled' ? 'bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-400' : 
                    'bg-yellow-100 text-yellow-700 dark:bg-yellow-500/20 dark:text-yellow-400'
                  }`}>
                    {selectedReservation.status === 'approved' ? 'Aprobada' : selectedReservation.status === 'cancelled' ? 'Cancelada' : 'Pendiente'}
                  </span>
                </div>
                <div className="sm:text-right">
                  <span className="text-slate-400 dark:text-slate-500 block text-[10px] uppercase font-bold tracking-widest mb-1">Precio Estimado</span>
                  <p className="text-slate-900 dark:text-white font-extrabold text-2xl">
                    {selectedReservation.price ? `€${Number(selectedReservation.price).toFixed(2)}` : 'Pendiente'}
                  </p>
                </div>
              </div>

              <div className="space-y-4 sm:space-y-6">
                <div>
                  <h4 className="font-bold text-slate-900 dark:text-white mb-2.5 text-xs sm:text-sm tracking-wide">DATOS DEL PASAJERO</h4>
                  <div className="bg-slate-50 dark:bg-slate-800/50 p-3.5 sm:p-4 rounded-2xl space-y-2.5 sm:space-y-3">
                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-1 sm:gap-0">
                      <span className="text-slate-500 dark:text-slate-400 text-xs sm:text-sm font-medium">Nombre:</span>
                      <span className="text-slate-900 dark:text-white font-bold text-sm sm:text-base break-words">{selectedReservation.name}</span>
                    </div>
                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-1 sm:gap-0">
                      <span className="text-slate-500 dark:text-slate-400 text-xs sm:text-sm font-medium">Teléfono:</span>
                      <span className="text-slate-900 dark:text-white font-bold text-sm sm:text-base break-words">{selectedReservation.phone}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-500 dark:text-slate-400 text-xs sm:text-sm font-medium">Pasajeros:</span>
                      <span className="text-slate-900 dark:text-white font-bold text-sm sm:text-base">{selectedReservation.passengers}</span>
                    </div>
                  </div>
                </div>
                
                <div>
                  <h4 className="font-bold text-slate-900 dark:text-white mb-2.5 text-xs sm:text-sm tracking-wide">DETALLES DEL VIAJE</h4>
                  <div className="bg-slate-50 dark:bg-slate-800/50 p-3.5 sm:p-4 rounded-2xl relative">
                    <div className="absolute left-[23px] sm:left-[27px] top-8 bottom-8 w-0.5 bg-slate-200 dark:bg-slate-700"></div>
                    
                    <div className="flex items-start gap-3 sm:gap-4 mb-5 sm:mb-6 relative">
                      <div className="w-3 h-3 rounded-full bg-green-500 mt-1 sm:mt-1.5 shrink-0 shadow-[0_0_0_4px_rgba(34,197,94,0.2)] dark:shadow-[0_0_0_4px_rgba(34,197,94,0.1)] z-10"></div>
                      <div className="min-w-0 flex-1">
                        <span className="text-slate-400 dark:text-slate-500 block text-[10px] uppercase font-bold tracking-widest mb-0.5">Recogida</span>
                        <p className="text-slate-900 dark:text-white font-medium text-xs sm:text-sm break-words">{selectedReservation.pickup}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-start gap-3 sm:gap-4 relative">
                      <div className="w-3 h-3 rounded-full bg-red-500 mt-1 sm:mt-1.5 shrink-0 shadow-[0_0_0_4px_rgba(239,68,68,0.2)] dark:shadow-[0_0_0_4px_rgba(239,68,68,0.1)] z-10"></div>
                      <div className="min-w-0 flex-1">
                        <span className="text-slate-400 dark:text-slate-500 block text-[10px] uppercase font-bold tracking-widest mb-0.5">Destino</span>
                        <p className="text-slate-900 dark:text-white font-medium text-xs sm:text-sm break-words">{selectedReservation.dropoff}</p>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div>
                  <h4 className="font-bold text-slate-900 dark:text-white mb-2.5 text-xs sm:text-sm tracking-wide">INFORMACIÓN ADICIONAL</h4>
                  <div className="bg-slate-50 dark:bg-slate-800/50 p-3.5 sm:p-4 rounded-2xl space-y-2.5 sm:space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-slate-500 dark:text-slate-400 text-xs sm:text-sm font-medium">Fecha programada:</span>
                      <span className="text-slate-900 dark:text-white font-bold text-xs sm:text-sm">{selectedReservation.date}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-500 dark:text-slate-400 text-xs sm:text-sm font-medium">Hora de recogida:</span>
                      <span className="text-slate-900 dark:text-white font-bold text-xs sm:text-sm">{selectedReservation.time}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-500 dark:text-slate-400 text-xs sm:text-sm font-medium">Método de pago:</span>
                      <span className="text-slate-900 dark:text-white font-bold text-xs sm:text-sm">
                        {selectedReservation.paymentMethod === 'card' || selectedReservation.paymentMethod === 'tarjeta' ? 'Tarjeta' : selectedReservation.paymentMethod === 'cash' || selectedReservation.paymentMethod === 'efectivo' ? 'Efectivo' : selectedReservation.paymentMethod === 'bizum' ? 'Bizum' : 'No especificado'}
                      </span>
                    </div>
                  </div>
                </div>

                {selectedReservation.notes && (
                  <div>
                    <h4 className="font-bold text-slate-900 dark:text-white mb-2.5 text-xs sm:text-sm tracking-wide">NOTAS DEL CLIENTE</h4>
                    <div className="bg-yellow-50 dark:bg-yellow-500/10 p-3.5 sm:p-4 rounded-2xl text-yellow-800 dark:text-yellow-200 text-xs sm:text-sm font-medium break-words">
                      "{selectedReservation.notes}"
                    </div>
                  </div>
                )}
              </div>
            </div>
            
            <div className="p-4 sm:p-6 border-t border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 shrink-0">
              <button 
                onClick={() => setSelectedReservation(null)}
                className="w-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold py-3.5 sm:py-4 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors text-sm sm:text-base"
              >
                Cerrar Detalles
              </button>
            </div>
          </div>
        </div>
      )}

      {actionConfirm && (
        <div className="fixed inset-0 z-[120] bg-slate-900/60 flex items-center justify-center p-4 pt-[max(1rem,env(safe-area-inset-top))] pb-[max(1rem,env(safe-area-inset-bottom))] backdrop-blur-sm animate-in fade-in zoom-in-95 duration-200">
          <div className="bg-white dark:bg-slate-900 rounded-3xl w-full max-w-sm p-6 sm:p-8 shadow-2xl">
            <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6 ${actionConfirm.action === 'approved' ? 'bg-green-100 text-green-600 dark:bg-green-500/20 dark:text-green-400' : 'bg-red-100 text-red-600 dark:bg-red-500/20 dark:text-red-400'}`}>
              {actionConfirm.action === 'approved' ? <Check className="w-8 h-8" /> : <Ban className="w-8 h-8" />}
            </div>
            
            <h3 className="text-2xl font-extrabold mb-2 text-slate-900 dark:text-white text-center">
              {actionConfirm.action === 'approved' ? 'Aprobar Reserva' : 'Cancelar Reserva'}
            </h3>
            
            <p className="text-center text-slate-500 dark:text-slate-400 mb-8 text-sm">
              ¿Estás seguro de que deseas {actionConfirm.action === 'approved' ? 'aprobar' : 'cancelar'} esta reserva? Se abrirá WhatsApp para notificar al cliente.
            </p>
            
            <div className="flex gap-3">
              <button 
                onClick={() => setActionConfirm(null)}
                className="flex-1 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold py-3 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
              >
                Volver
              </button>
              <button 
                onClick={() => {
                  handleAction(actionConfirm.id, actionConfirm.action);
                  setActionConfirm(null);
                }}
                className={`flex-1 text-white font-bold py-3 rounded-xl transition-colors ${actionConfirm.action === 'approved' ? 'bg-green-500 hover:bg-green-600' : 'bg-red-500 hover:bg-red-600'}`}
              >
                Confirmar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
