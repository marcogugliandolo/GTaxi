import React, { useState, useEffect } from 'react';
import { X, Lock, Settings, Save, LogOut, List, Check, Ban } from 'lucide-react';
import { BookingData } from '../types';
import { getBookings, updateBookingStatus } from '../api';

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
  const [actionConfirm, setActionConfirm] = useState<{ id: string, action: 'approved' | 'cancelled', res: BookingData } | null>(null);
  const [selectedReservation, setSelectedReservation] = useState<BookingData | null>(null);

  useEffect(() => {
    if (isAuthenticated) {
      loadReservations();
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
      setError('');
    } else {
      setError('Usuario o contraseña incorrectos');
    }
  };

  const handleSave = () => {
    onUpdateSettings(waNumber, tgUser);
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

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60  p-4">
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
          <div className="flex flex-col h-full overflow-hidden relative">
            {selectedReservation && (
              <div className="fixed inset-0 z-[110] bg-slate-900/40 flex items-center justify-center p-4 backdrop-blur-sm">
                <div className="bg-white rounded-2xl w-full max-w-sm p-6 shadow-xl max-h-[90vh] overflow-y-auto">
                  <h3 className="text-xl font-bold mb-4 text-slate-900 text-center">Detalles de la Reserva</h3>
                  <div className="space-y-4 text-sm mb-6">
                    <div>
                      <span className="font-bold text-slate-700 block text-xs uppercase">Cliente</span>
                      <p className="text-slate-900">{selectedReservation.name}</p>
                      <p className="text-slate-600">{selectedReservation.phone}</p>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <span className="font-bold text-slate-700 block text-xs uppercase">Fecha / Hora</span>
                        <p className="text-slate-900">{selectedReservation.date} {selectedReservation.time}</p>
                      </div>
                      <div>
                        <span className="font-bold text-slate-700 block text-xs uppercase">Pasajeros</span>
                        <p className="text-slate-900">{selectedReservation.passengers}</p>
                      </div>
                    </div>
                    <div>
                      <span className="font-bold text-slate-700 block text-xs uppercase">Ruta</span>
                      <p className="text-slate-900"><strong>De:</strong> {selectedReservation.pickup}</p>
                      <p className="text-slate-900 mt-1"><strong>A:</strong> {selectedReservation.dropoff}</p>
                    </div>
                    <div className="grid grid-cols-2 gap-4 bg-slate-50 p-3 rounded-xl border border-slate-100">
                      <div>
                        <span className="font-bold text-slate-700 block text-xs uppercase">Precio</span>
                        <p className="text-slate-900 font-bold">{selectedReservation.price ? `€${selectedReservation.price.toFixed(2)}` : 'Pendiente'}</p>
                      </div>
                      <div>
                        <span className="font-bold text-slate-700 block text-xs uppercase">Método Pago</span>
                        <p className="text-slate-900">{selectedReservation.paymentMethod === 'card' ? 'Tarjeta' : selectedReservation.paymentMethod === 'cash' ? 'Efectivo' : 'No especificado'}</p>
                      </div>
                    </div>
                    {selectedReservation.notes && (
                      <div>
                        <span className="font-bold text-slate-700 block text-xs uppercase">Notas adicionales</span>
                        <p className="text-slate-900 bg-slate-100 p-3 rounded-xl">{selectedReservation.notes}</p>
                      </div>
                    )}
                    <div>
                      <span className="font-bold text-slate-700 block text-xs uppercase mb-1">Estado</span>
                      <span className={`px-3 py-1 inline-block rounded-full text-xs font-bold uppercase ${
                        selectedReservation.status === 'approved' ? 'bg-green-100 text-green-700' : 
                        selectedReservation.status === 'cancelled' ? 'bg-red-100 text-red-700' : 
                        'bg-yellow-100 text-yellow-700'
                      }`}>
                        {selectedReservation.status === 'approved' ? 'Aprobada' : selectedReservation.status === 'cancelled' ? 'Cancelada' : 'Pendiente'}
                      </span>
                    </div>
                  </div>
                  <button 
                    onClick={() => setSelectedReservation(null)}
                    className="w-full bg-slate-100 text-slate-700 font-bold py-3 rounded-xl hover:bg-slate-200 transition-colors"
                  >
                    Cerrar
                  </button>
                </div>
              </div>
            )}
            {actionConfirm && (
              <div className="fixed inset-0 z-[110] bg-slate-900/40 flex items-center justify-center p-4 backdrop-blur-sm">
                <div className="bg-white rounded-2xl w-full max-w-sm p-6 shadow-xl max-h-[90vh] overflow-y-auto">
                  <h3 className="text-xl font-bold mb-4 text-slate-900 text-center">
                    {actionConfirm.action === 'approved' ? 'Aprobar Reserva' : 'Cancelar Reserva'}
                  </h3>
                  
                  <div className="space-y-3 mb-6 bg-slate-50 p-4 rounded-xl text-sm">
                    <div className="flex justify-between border-b border-slate-200 pb-2">
                      <span className="font-bold text-slate-700">Precio:</span> 
                      <span className="font-bold text-slate-900">{actionConfirm.res.price ? `€${actionConfirm.res.price.toFixed(2)}` : 'Pendiente'}</span>
                    </div>
                    <div className="flex justify-between border-b border-slate-200 pb-2">
                      <span className="font-bold text-slate-700">Pago:</span> 
                      <span className="text-slate-900">{actionConfirm.res.paymentMethod === 'card' ? 'Tarjeta' : actionConfirm.res.paymentMethod === 'cash' ? 'Efectivo' : 'No especificado'}</span>
                    </div>
                    <div className="flex justify-between border-b border-slate-200 pb-2">
                      <span className="font-bold text-slate-700">Pasajeros:</span> 
                      <span className="text-slate-900">{actionConfirm.res.passengers}</span>
                    </div>
                    <div className="pt-1">
                      <span className="font-bold text-slate-700 block mb-1">Ruta:</span> 
                      <span className="text-slate-600 block line-clamp-2">{actionConfirm.res.pickup} &rarr; {actionConfirm.res.dropoff}</span>
                    </div>
                    {actionConfirm.res.notes && (
                      <div className="pt-1">
                        <span className="font-bold text-slate-700 block mb-1">Notas:</span> 
                        <span className="text-slate-600 block bg-slate-100 p-2 rounded-lg">{actionConfirm.res.notes}</span>
                      </div>
                    )}
                  </div>

                  <div className="flex gap-3">
                    <button 
                      onClick={() => setActionConfirm(null)}
                      className="flex-1 bg-slate-100 text-slate-700 font-bold py-3 rounded-xl hover:bg-slate-200 transition-colors"
                    >
                      Volver
                    </button>
                    <button 
                      onClick={() => {
                        handleAction(actionConfirm.id, actionConfirm.action);
                        setActionConfirm(null);
                      }}
                      className={`flex-1 text-white font-bold py-3 rounded-xl transition-colors flex items-center justify-center gap-2 ${actionConfirm.action === 'approved' ? 'bg-green-500 hover:bg-green-600' : 'bg-red-500 hover:bg-red-600'}`}
                    >
                      {actionConfirm.action === 'approved' ? <><Check className="w-4 h-4"/> Confirmar</> : <><Ban className="w-4 h-4"/> Confirmar</>}
                    </button>
                  </div>
                </div>
              </div>
            )}

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
                      <div 
                        key={res.id} 
                        className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow cursor-pointer"
                        onClick={() => setSelectedReservation(res)}
                      >
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
                              onClick={(e) => { e.stopPropagation(); setActionConfirm({ id: res.id!, action: 'approved', res }); }}
                              className="flex-1 bg-green-50 text-green-600 hover:bg-green-100 font-bold py-2 px-4 rounded-xl transition-colors flex items-center justify-center gap-2"
                            >
                              <Check className="w-4 h-4" /> Aprobar y Avisar
                            </button>
                            <button
                              onClick={(e) => { e.stopPropagation(); setActionConfirm({ id: res.id!, action: 'cancelled', res }); }}
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

            <div className="p-4 bg-white border-t border-slate-100 space-y-3">
              <div className="text-center text-sm font-medium text-slate-500">
                Conectado como: <span className="text-slate-900 font-bold">{username}</span>
              </div>
              <button
                onClick={() => {
                  setIsAuthenticated(false);
                  setUsername('');
                  setPassword('');
                }}
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

