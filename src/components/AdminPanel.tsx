import React, { useState, useEffect } from 'react';
import { X, Lock, Settings, Save, LogOut, List, Check, Ban } from 'lucide-react';
import { BookingData } from '../types';

interface AdminPanelProps {
  onClose: () => void;
  onUpdateSettings: (whatsapp: string, telegram: string) => void;
  currentWhatsapp: string;
  currentTelegram: string;
}

export default function AdminPanel({ onClose, onUpdateSettings, currentWhatsapp, currentTelegram }: AdminPanelProps) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const [waNumber, setWaNumber] = useState(currentWhatsapp);
  const [tgUser, setTgUser] = useState(currentTelegram);
  
  const [activeTab, setActiveTab] = useState<'reservations' | 'settings'>('reservations');
  const [reservations, setReservations] = useState<BookingData[]>([]);

  useEffect(() => {
    if (isAuthenticated) {
      loadReservations();
    }
  }, [isAuthenticated]);

  const loadReservations = async () => {
    try {
      const res = await fetch('/api/reservations');
      const data = await res.json();
      setReservations(data);
    } catch (e) {
      console.error(e);
    }
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (username.toLowerCase() === 'gabriel' && password === 'gtaxi2026') {
      setIsAuthenticated(true);
      setError('');
    } else {
      setError('Usuario o contraseña incorrectos');
    }
  };

  const handleSave = () => {
    onUpdateSettings(waNumber, tgUser);
    alert('Configuración guardada exitosamente');
  };

  const updateReservationStatus = async (id: string, newStatus: 'approved' | 'cancelled') => {
    try {
      await fetch(`/api/reservations/${id}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });
      const updated = reservations.map(r => r.id === id ? { ...r, status: newStatus } : r);
      setReservations(updated);
      return updated.find(r => r.id === id);
    } catch (e) {
      console.error(e);
      return null;
    }
  };

  const handleAction = async (id: string, action: 'approved' | 'cancelled') => {
    const res = await updateReservationStatus(id, action);
    if (!res) return;

    let message = '';
    if (action === 'approved') {
      message = `✅ *RESERVA CONFIRMADA - GTaxi*\n\nHola ${res.name}, tu reserva ha sido aprobada.\n📍 De: ${res.pickup}\n🏁 A: ${res.dropoff}\n📅 El ${res.date} a las ${res.time}\n\nEl conductor estará allí puntualmente. ¡Gracias por elegir GTaxi!`;
    } else {
      message = `❌ *RESERVA CANCELADA - GTaxi*\n\nHola ${res.name}, lamentablemente no podemos confirmar tu reserva para el ${res.date} a las ${res.time}.\n\nPor favor, disculpa las molestias o contáctanos para buscar otra alternativa.`;
    }

    const text = encodeURIComponent(message);
    
    // As we don't know if the user preferred WA or TG (we could save it when they clicked, but for now we'll offer a choice or just send via WhatsApp if we have their phone)
    // The user's phone is in res.phone
    // Let's assume WhatsApp by default for the client communication since we have their phone number
    const formattedPhone = res.phone.replace(/\D/g, '');
    window.open(`https://wa.me/${formattedPhone}?text=${text}`, '_blank');
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
      <div className={`bg-white rounded-3xl w-full ${isAuthenticated ? 'max-w-2xl' : 'max-w-md'} shadow-2xl overflow-hidden relative flex flex-col max-h-[90vh]`}>
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-700 bg-slate-100 rounded-full transition-colors z-10"
        >
          <X className="w-5 h-5" />
        </button>

        {!isAuthenticated ? (
          <div className="p-8 overflow-y-auto">
            <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-6 text-slate-700">
              <Lock className="w-8 h-8" />
            </div>
            <h2 className="text-2xl font-bold text-center text-slate-900 mb-2">Acceso Administrativo</h2>
            <p className="text-center text-slate-500 mb-8 text-sm">Ingresa tus credenciales para continuar.</p>
            
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <input
                  type="text"
                  placeholder="Usuario"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full bg-slate-50 border-2 border-slate-100 focus:ring-4 focus:ring-[#FFD700]/20 focus:border-[#FFD700] rounded-xl py-3 px-4 text-slate-900 outline-none transition-all"
                />
              </div>
              <div>
                <input
                  type="password"
                  placeholder="Contraseña"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-slate-50 border-2 border-slate-100 focus:ring-4 focus:ring-[#FFD700]/20 focus:border-[#FFD700] rounded-xl py-3 px-4 text-slate-900 outline-none transition-all"
                />
                {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
              </div>
              <button
                type="submit"
                className="w-full bg-slate-900 text-white font-bold py-3 rounded-xl hover:bg-slate-800 transition-colors"
              >
                Acceder
              </button>
            </form>
          </div>
        ) : (
          <div className="flex flex-col h-full overflow-hidden">
            <div className="flex border-b border-slate-100 pt-6 px-6">
               <button
                 onClick={() => setActiveTab('reservations')}
                 className={`px-4 py-3 font-bold border-b-2 transition-colors flex items-center gap-2 ${activeTab === 'reservations' ? 'border-[#FFD700] text-slate-900' : 'border-transparent text-slate-400 hover:text-slate-700'}`}
               >
                 <List className="w-5 h-5" /> Reservas
               </button>
               <button
                 onClick={() => setActiveTab('settings')}
                 className={`px-4 py-3 font-bold border-b-2 transition-colors flex items-center gap-2 ${activeTab === 'settings' ? 'border-[#FFD700] text-slate-900' : 'border-transparent text-slate-400 hover:text-slate-700'}`}
               >
                 <Settings className="w-5 h-5" /> Configuración
               </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 bg-slate-50">
              {activeTab === 'reservations' && (
                <div className="space-y-4">
                  {reservations.length === 0 ? (
                    <div className="text-center text-slate-500 py-10">No hay reservas registradas.</div>
                  ) : (
                    reservations.map((res) => (
                      <div key={res.id} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                        <div className="flex justify-between items-start mb-4">
                          <div>
                            <h3 className="font-bold text-lg text-slate-900">{res.name}</h3>
                            <p className="text-sm text-slate-500">{res.phone}</p>
                          </div>
                          <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${
                            res.status === 'approved' ? 'bg-green-100 text-green-700' : 
                            res.status === 'cancelled' ? 'bg-red-100 text-red-700' : 
                            'bg-yellow-100 text-yellow-700'
                          }`}>
                            {res.status === 'approved' ? 'Aprobada' : res.status === 'cancelled' ? 'Cancelada' : 'Pendiente'}
                          </span>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4 text-sm">
                          <div>
                            <span className="text-slate-400 block text-xs uppercase font-bold">Ruta</span>
                            <p className="text-slate-700 font-medium">{res.pickup} &rarr; {res.dropoff}</p>
                          </div>
                          <div>
                            <span className="text-slate-400 block text-xs uppercase font-bold">Fecha / Hora</span>
                            <p className="text-slate-700 font-medium">{res.date} a las {res.time}</p>
                          </div>
                        </div>

                        {res.status === 'pending' && (
                          <div className="flex gap-2 mt-4 pt-4 border-t border-slate-100">
                            <button
                              onClick={() => handleAction(res.id!, 'approved')}
                              className="flex-1 bg-green-50 text-green-600 hover:bg-green-100 font-bold py-2 px-4 rounded-xl transition-colors flex items-center justify-center gap-2"
                            >
                              <Check className="w-4 h-4" /> Aprobar y Avisar
                            </button>
                            <button
                              onClick={() => handleAction(res.id!, 'cancelled')}
                              className="flex-1 bg-red-50 text-red-600 hover:bg-red-100 font-bold py-2 px-4 rounded-xl transition-colors flex items-center justify-center gap-2"
                            >
                              <Ban className="w-4 h-4" /> Cancelar y Avisar
                            </button>
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>
              )}

              {activeTab === 'settings' && (
                <div className="space-y-5 bg-white p-6 rounded-2xl border border-slate-200">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-700 uppercase tracking-wide">Número de WhatsApp</label>
                    <input
                      type="text"
                      value={waNumber}
                      onChange={(e) => setWaNumber(e.target.value)}
                      placeholder="Ej. 34600000000"
                      className="w-full bg-slate-50 border-2 border-slate-100 focus:ring-4 focus:ring-green-500/20 focus:border-green-500 rounded-xl py-3 px-4 text-slate-900 outline-none transition-all"
                    />
                    <p className="text-xs text-slate-500">Incluye el código de país sin el símbolo +.</p>
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-700 uppercase tracking-wide">Usuario de Telegram</label>
                    <input
                      type="text"
                      value={tgUser}
                      onChange={(e) => setTgUser(e.target.value)}
                      placeholder="Ej. tu_usuario_taxi"
                      className="w-full bg-slate-50 border-2 border-slate-100 focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 rounded-xl py-3 px-4 text-slate-900 outline-none transition-all"
                    />
                    <p className="text-xs text-slate-500">Sin el símbolo @.</p>
                  </div>

                  <button
                    onClick={handleSave}
                    className="w-full mt-4 bg-[#FFD700] text-black font-bold py-3 rounded-xl hover:bg-[#F2CB00] transition-colors flex items-center justify-center gap-2"
                  >
                    <Save className="w-4 h-4" /> Guardar Cambios
                  </button>
                </div>
              )}
            </div>

            <div className="p-4 bg-white border-t border-slate-100">
              <button
                onClick={() => setIsAuthenticated(false)}
                className="w-full bg-slate-100 text-slate-700 font-bold py-3 rounded-xl hover:bg-slate-200 transition-colors flex items-center justify-center gap-2"
              >
                <LogOut className="w-4 h-4" /> Cerrar Sesión
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
