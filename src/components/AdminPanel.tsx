import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';
import { useTheme } from '../contexts/ThemeContext';
import { X, Lock, Settings, Save, LogOut, List, Check, Ban, User, CarFront, Home, Shield, LayoutDashboard, FileText, Trash2, Menu, Moon, Sun, Bell, Volume2, VolumeX, BellOff, Search, Calendar, Filter } from 'lucide-react';
import { BookingData } from '../types';
import { getBookings, updateBookingStatus, deleteBooking, getSettings, saveSettings, login, getUsers, createUser, deleteUser, changePassword, updateProfile } from '../api';
import AdminDashboard from './AdminDashboard';
import InvoiceModal from './InvoiceModal';
import VaixaLogo from './VaixaLogo';

const urlBase64ToUint8Array = (base64String: string) => {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding)
    .replace(/\-/g, '+')
    .replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
};

const subscribeToPush = async () => {
  if (!('serviceWorker' in navigator) || !('PushManager' in window)) return;
  try {
    const reg = await navigator.serviceWorker.ready;
    const existingSub = await reg.pushManager.getSubscription();
    if (existingSub) {
      await fetch('/api/push/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(existingSub)
      });
      return;
    }
    const res = await fetch('/api/push/public-key');
    const { publicKey } = await res.json();
    const convertedVapidKey = urlBase64ToUint8Array(publicKey);
    const subscription = await reg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: convertedVapidKey
    });
    await fetch('/api/push/subscribe', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(subscription)
    });
  } catch(e) {
    console.error("Push registration failed", e);
  }
};

export default function AdminPanel() {
  const navigate = useNavigate();
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const { t } = useLanguage();
  const { theme, toggleTheme } = useTheme();
  
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    try {
      return localStorage.getItem('admin_auth') === 'true';
    } catch (e) {
      return false;
    }
  });
  const [currentUser, setCurrentUser] = useState(() => {
    try {
      return localStorage.getItem('admin_user') || 'gabriel';
    } catch (e) {
      return 'gabriel';
    }
  });
  const [currentUserRole, setCurrentUserRole] = useState(() => {
    try {
      return localStorage.getItem('admin_role') || 'admin';
    } catch (e) {
      return 'admin';
    }
  });
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  
  const [waNumber, setWaNumber] = useState('');
  const [tgUser, setTgUser] = useState('');
  
  const [activeTab, setActiveTab] = useState<'dashboard' | 'reservations' | 'settings' | 'users' | 'vehicles' | 'profile'>('dashboard');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [reservations, setReservations] = useState<BookingData[]>([]);
  const [filterText, setFilterText] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterDate, setFilterDate] = useState<string>('');
  const [notifPerm, setNotifPerm] = useState<NotificationPermission>('Notification' in window ? Notification.permission : 'default');
  const [notifMessage, setNotifMessage] = useState<string | null>(null);
  const [inAppNotification, setInAppNotification] = useState<{title: string, body: string} | null>(null);
  const audioUnlockedRef = useRef(false);
  const [soundEnabled, setSoundEnabled] = useState(() => {
    try { return localStorage.getItem('admin_sound') !== 'false'; } catch { return true; }
  });
  const [notificationsEnabled, setNotificationsEnabled] = useState(() => {
    try { return localStorage.getItem('admin_notif') !== 'false'; } catch { return true; }
  });

  const toggleSound = () => {
    const newVal = !soundEnabled;
    setSoundEnabled(newVal);
    localStorage.setItem('admin_sound', String(newVal));
  };

  const toggleNotifications = async () => {
    setNotifMessage(null);
    if (!('Notification' in window)) {
      setNotifMessage('Tu navegador no soporta notificaciones de sistema, pero SÍ verás los avisos visuales amarillos dentro de la app.');
      return;
    }

    if (Notification.permission === 'denied') {
      setNotifMessage('Las notificaciones están bloqueadas. Haz clic en el candado 🔒 de la barra de direcciones superior, cambia el permiso a "Permitir" y recarga la página.');
      return;
    }

    if (Notification.permission !== 'granted') {
      try {
        const permission = await Notification.requestPermission();
        setNotifPerm(permission);
        if (permission === 'granted') {
          const title = 'Notificaciones activadas';
          const options = {
            body: 'Recibirás avisos de nuevas reservas aquí.',
            icon: '/logo-blanco.png'
          };
          if ('serviceWorker' in navigator) {
            navigator.serviceWorker.ready.then(reg => reg.showNotification(title, options)).catch(() => new Notification(title, options));
            subscribeToPush();
          } else {
            new Notification(title, options);
          }
          setNotificationsEnabled(true);
          localStorage.setItem('admin_notif', 'true');
        } else {
          setNotifMessage('No se concedió el permiso. Si estás en la vista previa, abre la app en una NUEVA PESTAÑA (ícono arriba a la derecha) e inténtalo de nuevo.');
        }
      } catch (err) {
        console.error('Error al pedir permisos de notificación', err);
        setNotifMessage('Ocurrió un error. Si estás en la vista previa, abre la app en una NUEVA PESTAÑA.');
      }
    } else {
      const newVal = !notificationsEnabled;
      setNotificationsEnabled(newVal);
      localStorage.setItem('admin_notif', String(newVal));
    }
  };

  const testSound = () => {
    if (audioRef.current) {
      audioRef.current.currentTime = 0;
      audioRef.current.play().catch(e => console.log('Audio play failed', e));
    }
  };

  
  const [adminUsers, setAdminUsers] = useState<any[]>([]);
  const [newUsername, setNewUsername] = useState('');
  const [newUserPassword, setNewUserPassword] = useState('');
  const [newUserRole, setNewUserRole] = useState('staff');
  const [newFullName, setNewFullName] = useState('');
  const [newCarModel, setNewCarModel] = useState('');
  const [newCarPlate, setNewCarPlate] = useState('');
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  
  const [myFullName, setMyFullName] = useState('');
  const [myCarModel, setMyCarModel] = useState('');
  const [myCarPlate, setMyCarPlate] = useState('');

  const [actionConfirm, setActionConfirm] = useState<{ id: string, action: 'approved' | 'cancelled', res: BookingData } | null>(null);
  const [selectedReservation, setSelectedReservation] = useState<BookingData | null>(null);
  const [showInvoiceModal, setShowInvoiceModal] = useState<BookingData | null>(null);
  const [userToDelete, setUserToDelete] = useState<string | null>(null);
  const [feedbackMsg, setFeedbackMsg] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  useEffect(() => {
    if (isAuthenticated) {
      loadReservations();
      loadUsers();
      getSettings().then(s => {
        setWaNumber(s.whatsapp || '');
        setTgUser(s.telegram || '');
      }).catch(e => console.error(e));
      
      if (notificationsEnabled && 'Notification' in window && Notification.permission === 'granted') {
        subscribeToPush();
      }

      const evtSource = new EventSource('/api/admin/events');
      evtSource.addEventListener('new_booking', (event) => {
        const booking = JSON.parse(event.data);
        setReservations(prev => [booking, ...prev]);
        if (soundEnabled && audioRef.current) {
          audioRef.current.play().catch(e => console.log('Audio play failed', e));
        }
        
        // Show in-app notification toast as fallback
        setInAppNotification({
          title: '¡Nueva Reserva Recibida!',
          body: `${booking.name} viaja de ${booking.pickup.split(',')[0]} a ${booking.dropoff.split(',')[0]}`
        });
        setTimeout(() => setInAppNotification(null), 8000);

        if (notificationsEnabled && 'Notification' in window && Notification.permission === 'granted') {
          const title = '¡Nueva Reserva Recibida!';
          const options = {
            body: `${booking.name} viaja de ${booking.pickup.split(',')[0]} a ${booking.dropoff.split(',')[0]}`,
            icon: '/logo-blanco.png'
          };
          
          // Si estamos en otra pestaña o ventana, forzamos la notificación visual
          if (!document.hasFocus()) {
            if ('serviceWorker' in navigator) {
              navigator.serviceWorker.ready.then(reg => reg.showNotification(title, options)).catch(() => new Notification(title, options));
            } else {
              new Notification(title, options);
            }
          }
        }

      });
      return () => evtSource.close();
    }
  }, [isAuthenticated, soundEnabled, notificationsEnabled]);

  useEffect(() => {
    const unlockAudio = () => {
      if (audioRef.current && !audioUnlockedRef.current) {
        audioRef.current.muted = true;
        audioRef.current.play().then(() => {
          audioRef.current?.pause();
          if (audioRef.current) {
            audioRef.current.currentTime = 0;
            audioRef.current.muted = false;
          }
          audioUnlockedRef.current = true;
        }).catch(e => console.log('Unlock failed', e));
        document.removeEventListener('touchstart', unlockAudio);
        document.removeEventListener('click', unlockAudio);
      }
    };
    document.addEventListener('touchstart', unlockAudio);
    document.addEventListener('click', unlockAudio);
    return () => {
      document.removeEventListener('touchstart', unlockAudio);
      document.removeEventListener('click', unlockAudio);
    };
  }, []);

  const loadReservations = async () => {
    try {
      const data = await getBookings();
      setReservations(data);
    } catch (e) {
      console.error(e);
    }
  };

  const loadUsers = async (loggedInUser?: string) => {
    try {
      const users = await getUsers();
      setAdminUsers(users);
      const targetUser = loggedInUser || currentUser;
      if (targetUser) {
        const me = users.find((u: any) => u.username === targetUser);
        if (me) {
          setMyFullName(me.fullName || '');
          setMyCarModel(me.carModel || '');
          setMyCarPlate(me.carPlate || '');
        }
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await login(username.toLowerCase(), password);
      if (res.success) {
        setIsAuthenticated(true);
        setCurrentUser(res.username);
        setCurrentUserRole(res.role);
        try {
          localStorage.setItem('admin_auth', 'true');
          localStorage.setItem('admin_user', res.username);
          localStorage.setItem('admin_role', res.role);
        } catch (e) {
          console.error(e);
        }
        setError('');
        if (res.role !== 'admin' && (activeTab === 'settings' || activeTab === 'users')) {
          setActiveTab('dashboard');
        }
      }
    } catch (e: any) {
      setError(e.message || 'Usuario o contraseña incorrectos');
    }
  };
  
  const handleLogout = () => {
    setIsAuthenticated(false);
    setUsername('');
    setPassword('');
    setCurrentUser('');
    setCurrentUserRole('');
    try {
      localStorage.removeItem('admin_auth');
      localStorage.removeItem('admin_user');
      localStorage.removeItem('admin_role');
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

  const handleDeleteReservation = async (id: string) => {
    if (!window.confirm('¿Estás seguro de que deseas eliminar permanentemente esta reserva?')) return;
    try {
      await deleteBooking(id);
      setReservations(prev => prev.filter(r => r.id !== id));
      setSelectedReservation(null);
    } catch (e) {
      console.error(e);
      alert('Error al eliminar la reserva');
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUsername || !newUserPassword) return;
    try {
      await createUser(newUsername.toLowerCase(), newUserPassword, newUserRole, newFullName, newCarModel, newCarPlate);
      setNewUsername('');
      setNewUserPassword('');
      setNewUserRole('staff');
      setNewFullName('');
      setNewCarModel('');
      setNewCarPlate('');
      loadUsers();
      setFeedbackMsg({ type: 'success', text: 'Usuario creado exitosamente' });
    } catch (e: any) {
      setFeedbackMsg({ type: 'error', text: e.message || 'Error al crear usuario' });
    }
  };

  const confirmDeleteUser = async () => {
    if (!userToDelete) return;
    try {
      await deleteUser(userToDelete);
      loadUsers();
      setUserToDelete(null);
      setFeedbackMsg({ type: 'success', text: 'Usuario eliminado correctamente' });
    } catch (e: any) {
      setUserToDelete(null);
      setFeedbackMsg({ type: 'error', text: e.message || 'Error al eliminar usuario' });
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!oldPassword || !newPassword) return;
    try {
      await changePassword(currentUser, oldPassword, newPassword);
      setOldPassword('');
      setNewPassword('');
      setFeedbackMsg({ type: 'success', text: 'Contraseña actualizada exitosamente' });
    } catch (e: any) {
      setFeedbackMsg({ type: 'error', text: e.message || 'Error al cambiar contraseña' });
    }
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await updateProfile(currentUser, myFullName, myCarModel, myCarPlate);
      setFeedbackMsg({ type: 'success', text: 'Perfil actualizado exitosamente' });
      loadUsers();
    } catch (e: any) {
      setFeedbackMsg({ type: 'error', text: e.message || 'Error al actualizar perfil' });
    }
  };

  useEffect(() => {
    if (feedbackMsg) {
      const timer = setTimeout(() => {
        setFeedbackMsg(null);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [feedbackMsg]);

  const filteredReservations = useMemo(() => {
    return reservations.filter(res => {
      if (filterText) {
        const lowerSearch = filterText.toLowerCase();
        const matchesSearch = 
          (res.id || '').toLowerCase().includes(lowerSearch) ||
          (res.name || '').toLowerCase().includes(lowerSearch) ||
          (res.phone || '').toLowerCase().includes(lowerSearch) ||
          (res.pickup || '').toLowerCase().includes(lowerSearch) ||
          (res.dropoff || '').toLowerCase().includes(lowerSearch);
        if (!matchesSearch) return false;
      }
      if (filterStatus !== 'all' && res.status !== filterStatus) return false;
      if (filterDate && res.date !== filterDate) return false;
      
      return true;
    });
  }, [reservations, filterText, filterStatus, filterDate]);

  if (!isAuthenticated) {
    return (
      <div className="min-h-full w-full bg-slate-50 dark:bg-slate-950 flex flex-col p-4 md:p-8 items-center justify-center">
        <div className="bg-white dark:bg-slate-900 rounded-3xl w-full max-w-md shadow-2xl overflow-hidden relative border border-slate-100 dark:border-slate-800">
          <button 
            onClick={() => navigate('/')}
            title="Volver al Inicio"
            className="absolute top-4 right-4 p-2 text-sm text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 rounded-full transition-colors z-10 flex items-center justify-center"
          >
            <Home className="w-5 h-5 text-slate-700 dark:text-slate-200" />
          </button>
          
          <div className="p-8">
            <div className="flex justify-center mb-6">
              <VaixaLogo size={140} layout="vertical" />
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
                className="w-full bg-slate-900 dark:bg-[#FFD700] text-white dark:text-slate-900 font-bold py-3 rounded-xl hover:bg-slate-800 dark:hover:bg-[#F0C800] transition-colors mt-2"
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
    <div className="flex h-full w-full bg-slate-50 dark:bg-slate-950 overflow-hidden font-sans">
      <audio ref={audioRef} src="https://assets.mixkit.co/active_storage/sfx/933/933-preview.mp3" preload="auto" />
      
      {/* Toast Notification para móviles y navegadores sin Push API */}
      {inAppNotification && (
        <div className="fixed top-4 right-4 z-[9999] animate-in fade-in slide-in-from-top-5 duration-300 shadow-2xl">
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-4 border-2 border-[#FFD700] flex items-start gap-4 max-w-sm cursor-pointer" onClick={() => setInAppNotification(null)}>
            <div className="bg-amber-100 dark:bg-amber-500/20 p-3 rounded-xl text-amber-600 dark:text-amber-400">
              <Bell className="w-6 h-6 animate-bounce" />
            </div>
            <div className="flex-1 pr-2">
              <h4 className="font-bold text-slate-900 dark:text-white">{inAppNotification.title}</h4>
              <p className="text-sm text-slate-600 dark:text-slate-300 mt-1 font-medium">{inAppNotification.body}</p>
            </div>
            <button className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200" onClick={(e) => { e.stopPropagation(); setInAppNotification(null); }}>
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}

      {/* Sidebar */}
      <div className="w-72 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 hidden md:flex flex-col shadow-sm z-10">
        <div className="h-20 flex items-center px-6 border-b border-slate-100 dark:border-slate-800">
          <VaixaLogo size={46} />
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
          
          {currentUserRole === 'admin' && (
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
          )}
          
          {currentUserRole === 'admin' && (
            <button
              onClick={() => setActiveTab('vehicles')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-all ${
                activeTab === 'vehicles' 
                  ? 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm' 
                  : 'text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800/50 hover:text-slate-700 dark:hover:text-slate-300'
              }`}
            >
              <CarFront className="w-5 h-5" /> Vehículos
            </button>
          )}
          
          {currentUserRole === 'admin' && (
            <button
              onClick={() => setActiveTab('users')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-all ${
                activeTab === 'users' 
                  ? 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm' 
                  : 'text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800/50 hover:text-slate-700 dark:hover:text-slate-300'
              }`}
            >
              <Shield className="w-5 h-5" /> Usuarios
            </button>
          )}
        </div>
        
        <div className="p-4 border-t border-slate-100 dark:border-slate-800 space-y-2">
          <button
            onClick={toggleTheme}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-bold text-slate-600 dark:text-slate-300 bg-slate-50 hover:bg-slate-100 dark:bg-slate-800/50 dark:hover:bg-slate-800 transition-colors"
          >
            {theme === 'light' ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />} {theme === 'light' ? 'Modo Oscuro' : 'Modo Claro'}
          </button>
          <button
            onClick={() => setActiveTab('profile')}
            className={`w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-bold transition-colors ${
              activeTab === 'profile'
                ? 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-300 bg-slate-50 hover:bg-slate-100 dark:bg-slate-800/50 dark:hover:bg-slate-800'
            }`}
          >
            <User className="w-4 h-4" /> Mi Perfil
          </button>
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
        <div className="md:hidden flex-shrink-0 h-16 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between px-4 shadow-sm z-[60] relative">
          <VaixaLogo size={44} />
          <div className="flex items-center gap-2">
            <button 
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 text-slate-800 dark:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg flex items-center justify-center transition-colors"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
        
        {/* Mobile Menu Overlay */}
        {mobileMenuOpen && (
          <div className="md:hidden absolute top-16 left-0 right-0 bottom-0 z-[50] bg-white/95 dark:bg-slate-900/95 backdrop-blur-md overflow-y-auto animate-in slide-in-from-top-2 flex flex-col justify-between">
            <div className="p-4 space-y-2">
              <button
                onClick={() => { setActiveTab('dashboard'); setMobileMenuOpen(false); }}
                className={`w-full flex items-center gap-4 px-5 py-4 rounded-2xl font-bold transition-all ${activeTab === 'dashboard' ? 'bg-[#FFD700] text-slate-900 shadow-md' : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'}`}
              >
                <LayoutDashboard className="w-6 h-6" /> Dashboard
              </button>
              <button
                onClick={() => { setActiveTab('reservations'); setMobileMenuOpen(false); }}
                className={`w-full flex items-center gap-4 px-5 py-4 rounded-2xl font-bold transition-all ${activeTab === 'reservations' ? 'bg-[#FFD700] text-slate-900 shadow-md' : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'}`}
              >
                <List className="w-6 h-6" /> Gestión de Reservas
              </button>
              <button
                onClick={() => { setActiveTab('profile'); setMobileMenuOpen(false); }}
                className={`w-full flex items-center gap-4 px-5 py-4 rounded-2xl font-bold transition-all ${activeTab === 'profile' ? 'bg-[#FFD700] text-slate-900 shadow-md' : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'}`}
              >
                <User className="w-6 h-6" /> Mi Perfil
              </button>
              
              {currentUserRole === 'admin' && (
                <>
                  <div className="h-px bg-slate-200 dark:bg-slate-800 my-4" />
                  <p className="px-5 text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2">Administración</p>
                  <button
                    onClick={() => { setActiveTab('settings'); setMobileMenuOpen(false); }}
                    className={`w-full flex items-center gap-4 px-5 py-4 rounded-2xl font-bold transition-all ${activeTab === 'settings' ? 'bg-[#FFD700] text-slate-900 shadow-md' : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'}`}
                  >
                    <Settings className="w-6 h-6" /> Ajustes del Sistema
                  </button>
                  <button
                    onClick={() => { setActiveTab('vehicles'); setMobileMenuOpen(false); }}
                    className={`w-full flex items-center gap-4 px-5 py-4 rounded-2xl font-bold transition-all ${activeTab === 'vehicles' ? 'bg-[#FFD700] text-slate-900 shadow-md' : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'}`}
                  >
                    <CarFront className="w-6 h-6" /> Flota de Vehículos
                  </button>
                  <button
                    onClick={() => { setActiveTab('users'); setMobileMenuOpen(false); }}
                    className={`w-full flex items-center gap-4 px-5 py-4 rounded-2xl font-bold transition-all ${activeTab === 'users' ? 'bg-[#FFD700] text-slate-900 shadow-md' : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'}`}
                  >
                    <Shield className="w-6 h-6" /> Usuarios y Permisos
                  </button>
                </>
              )}
            </div>
            <div className="p-4 border-t border-slate-200 dark:border-slate-800 space-y-2 mt-auto">
              <button onClick={toggleTheme} className="w-full flex items-center justify-center gap-2 px-4 py-4 rounded-xl font-bold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 transition-colors">
                {theme === 'light' ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />} {theme === 'light' ? 'Modo Oscuro' : 'Modo Claro'}
              </button>
              <button onClick={() => navigate('/')} className="w-full flex items-center justify-center gap-2 px-4 py-4 rounded-xl font-bold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 transition-colors">
                <Home className="w-5 h-5" /> Volver al Inicio
              </button>
              <button onClick={handleLogout} className="w-full flex items-center justify-center gap-2 px-4 py-4 rounded-xl font-bold text-red-600 bg-red-50 dark:bg-red-500/10 hover:bg-red-100 transition-colors">
                <LogOut className="w-5 h-5" /> Cerrar Sesión
              </button>
            </div>
          </div>
        )}

        {/* Header Desktop */}
        <div className="hidden md:flex h-20 items-center justify-between px-10">
           <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
             {activeTab === 'dashboard' ? 'Dashboard' : activeTab === 'reservations' ? 'Gestión de Reservas' : activeTab === 'vehicles' ? 'Gestión de Vehículos' : activeTab === 'users' ? 'Gestión de Usuarios' : 'Configuración del Sistema'}
           </h1>
        </div>

        <div className="flex-1 overflow-y-auto p-4 md:p-10 pb-20 md:pb-10 bg-slate-50 dark:bg-slate-950">
          <div className="max-w-5xl mx-auto space-y-6">
            {activeTab === 'dashboard' && (
              <AdminDashboard bookings={reservations} />
            )}

            {activeTab === 'reservations' && (
              <div className="space-y-4">
                
                {/* Filtros */}
                <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm mb-6 flex flex-col md:flex-row gap-4 max-w-full overflow-hidden">
                  <div className="flex-1 relative max-w-full">
                    <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input 
                      type="text" 
                      placeholder="Buscar por nombre, teléfono, origen..." 
                      value={filterText}
                      onChange={(e) => setFilterText(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-[#FFD700] outline-none text-slate-900 dark:text-white"
                    />
                  </div>
                  <div className="flex flex-col sm:flex-row gap-4 w-full md:w-auto">
                    <div className="relative w-full sm:w-auto flex-shrink-0">
                      <select 
                        value={filterStatus}
                        onChange={(e) => setFilterStatus(e.target.value)}
                        className="w-full sm:w-auto pl-4 pr-10 py-2 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-[#FFD700] outline-none text-slate-900 dark:text-white appearance-none"
                      >
                        <option value="all">Todos los estados</option>
                        <option value="pending">Pendientes</option>
                        <option value="approved">Aprobadas</option>
                        <option value="cancelled">Canceladas</option>
                      </select>
                      <Filter className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                    </div>
                    <div className="relative w-full sm:w-auto flex-shrink-0 max-w-full">
                      <Calendar className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input 
                        type="date"
                        value={filterDate}
                        onChange={(e) => setFilterDate(e.target.value)}
                        className="w-full sm:w-48 pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-[#FFD700] outline-none text-slate-900 dark:text-white box-border max-w-full"
                      />
                    </div>
                  </div>
                </div>

                {filteredReservations.length === 0 ? (
                  <div className="text-center text-slate-500 dark:text-slate-400 py-20 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 border-dashed">
                    <List className="w-12 h-12 mx-auto mb-4 text-slate-300 dark:text-slate-700" />
                    <p className="text-lg font-medium">No se encontraron reservas con esos filtros.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                  {filteredReservations.map((res) => (
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
                  <div className="bg-slate-50 dark:bg-slate-800/50 rounded-2xl p-6 border border-slate-100 dark:border-slate-800 space-y-4">
                    <h3 className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
                      <Bell className="w-5 h-5" /> Avisos de Nueva Reserva
                    </h3>
                    
                    <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-slate-900 dark:text-white">Notificaciones de Escritorio</p>
                        <p className="text-xs text-slate-500 dark:text-slate-400">Recibe una alerta visual cuando la app esté en segundo plano.</p>
                      </div>
                      <button 
                        onClick={toggleNotifications}
                        className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold transition-colors ${
                          notificationsEnabled && notifPerm === 'granted'
                            ? 'bg-green-100 text-green-700 dark:bg-green-500/20 dark:text-green-400'
                            : 'bg-slate-200 text-slate-600 dark:bg-slate-700 dark:text-slate-300 hover:bg-slate-300'
                        }`}
                      >
                        {notificationsEnabled && notifPerm === 'granted' ? (
                          <><Check className="w-4 h-4" /> Activado</>
                        ) : (
                          <><BellOff className="w-4 h-4" /> Activar</>
                        )}
                      </button>
                    </div>

                    <div className="h-px w-full bg-slate-200 dark:bg-slate-700/50"></div>

                    <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-slate-900 dark:text-white">Alerta Sonora</p>
                        <p className="text-xs text-slate-500 dark:text-slate-400">Reproduce un sonido de campana de recepción.</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <button 
                          onClick={testSound}
                          className="p-2 text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white bg-white dark:bg-slate-700 shadow-sm border border-slate-200 dark:border-slate-600 rounded-lg transition-colors"
                          title="Probar sonido"
                        >
                          <Volume2 className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={toggleSound}
                          className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold transition-colors ${
                            soundEnabled
                              ? 'bg-green-100 text-green-700 dark:bg-green-500/20 dark:text-green-400'
                              : 'bg-slate-200 text-slate-600 dark:bg-slate-700 dark:text-slate-300 hover:bg-slate-300'
                          }`}
                        >
                          {soundEnabled ? (
                            <><Check className="w-4 h-4" /> Activado</>
                          ) : (
                            <><VolumeX className="w-4 h-4" /> Muteado</>
                          )}
                        </button>
                      </div>
                    </div>
                    {notifMessage && (
                      <div className="bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 text-red-700 dark:text-red-400 p-4 rounded-xl text-sm font-medium flex items-start gap-3 mt-4">
                        <div className="bg-red-100 dark:bg-red-500/20 p-1 rounded-full shrink-0">
                          <X className="w-4 h-4" />
                        </div>
                        <p>{notifMessage}</p>
                      </div>
                    )}
                  </div>

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

            {activeTab === 'vehicles' && (
              <div className="bg-white dark:bg-slate-900 p-8 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm max-w-4xl">
                <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-6">Flota de Vehículos</h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {adminUsers.filter(u => u.carModel || u.carPlate).length === 0 ? (
                    <div className="col-span-full text-center text-slate-500 dark:text-slate-400 py-10 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-dashed border-slate-200 dark:border-slate-700">
                      <CarFront className="w-12 h-12 mx-auto mb-3 text-slate-300 dark:text-slate-600" />
                      <p className="font-medium">No hay vehículos registrados en la flota.</p>
                      <p className="text-sm mt-1">Los vehículos se añaden al crear usuarios conductores.</p>
                    </div>
                  ) : (
                    adminUsers.filter(u => u.carModel || u.carPlate).map((user) => (
                      <div key={user.username} className="bg-slate-50 dark:bg-slate-800 rounded-2xl p-5 flex flex-col h-full border border-slate-100 dark:border-slate-700">
                        <div className="w-12 h-12 bg-[#FFD700]/20 text-[#b39600] rounded-xl flex items-center justify-center mb-4">
                          <CarFront className="w-6 h-6" />
                        </div>
                        
                        <div className="flex-1 space-y-4">
                          <div>
                            <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">Modelo</p>
                            <p className="font-bold text-lg text-slate-900 dark:text-white leading-tight">{user.carModel || 'No especificado'}</p>
                          </div>
                          
                          {user.carPlate && (
                            <div>
                              <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">Matrícula</p>
                              <div className="inline-block bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-700 font-mono text-slate-900 dark:text-white font-bold px-3 py-1 rounded-md shadow-sm">
                                {user.carPlate}
                              </div>
                            </div>
                          )}
                          
                          <div className="pt-4 border-t border-slate-200 dark:border-slate-700 mt-auto">
                            <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">Conductor Asignado</p>
                            <div className="flex items-center gap-2">
                              <div className="w-6 h-6 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center flex-shrink-0">
                                <User className="w-3 h-3 text-slate-500 dark:text-slate-400" />
                              </div>
                              <span className="text-sm font-medium text-slate-700 dark:text-slate-300 truncate">
                                {user.fullName || user.username}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

            {activeTab === 'users' && (
              <div className="bg-white dark:bg-slate-900 p-8 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm max-w-2xl">
                <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-6">Gestión de Usuarios</h2>
                
                <div className="mb-8">
                  <h3 className="font-bold text-slate-900 dark:text-white mb-4">Usuarios Activos</h3>
                  <div className="space-y-3">
                    {adminUsers.map((user) => (
                      <div key={user.username} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-slate-50 dark:bg-slate-800 rounded-xl gap-4">
                        <div className="flex items-start sm:items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center flex-shrink-0">
                            <User className="w-5 h-5 text-slate-500 dark:text-slate-400" />
                          </div>
                          <div>
                            <p className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
                              {user.fullName || user.username} 
                              <span className="text-xs font-normal text-slate-500 bg-slate-200 dark:bg-slate-700 px-2 py-0.5 rounded-full">@{user.username}</span>
                            </p>
                            <p className="text-xs text-slate-500 dark:text-slate-400 capitalize mb-1">
                              {user.role === 'admin' ? 'Administrador' : 'Empleado'}
                            </p>
                            {(user.carModel || user.carPlate) && (
                              <div className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-300 mt-1">
                                <CarFront className="w-3.5 h-3.5" />
                                <span>{user.carModel || 'Sin modelo'}</span>
                                {user.carPlate && <span className="font-mono bg-slate-200 dark:bg-slate-700 px-1.5 py-0.5 rounded text-[10px]">{user.carPlate}</span>}
                              </div>
                            )}
                          </div>
                        </div>
                        {user.username !== currentUser && (
                          <button
                            onClick={() => setUserToDelete(user.username)}
                            className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-colors self-end sm:self-auto"
                            title="Eliminar usuario"
                          >
                            <Trash2 className="w-5 h-5" />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                <div className="border-t border-slate-200 dark:border-slate-800 pt-8 mb-8">
                  <h3 className="font-bold text-slate-900 dark:text-white mb-4">Crear Nuevo Usuario</h3>
                  <form onSubmit={handleCreateUser} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <input
                        type="text"
                        placeholder="Nombre de usuario (ej. juan123)"
                        value={newUsername}
                        onChange={(e) => setNewUsername(e.target.value)}
                        className="w-full bg-slate-50 dark:bg-slate-800/50 border-2 border-slate-100 dark:border-slate-800 focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 rounded-xl py-3 px-4 text-slate-900 dark:text-white outline-none"
                      />
                      <input
                        type="password"
                        placeholder="Contraseña"
                        value={newUserPassword}
                        onChange={(e) => setNewUserPassword(e.target.value)}
                        className="w-full bg-slate-50 dark:bg-slate-800/50 border-2 border-slate-100 dark:border-slate-800 focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 rounded-xl py-3 px-4 text-slate-900 dark:text-white outline-none"
                      />
                    </div>
                    
                    <input
                      type="text"
                      placeholder="Nombre y Apellidos (Opcional)"
                      value={newFullName}
                      onChange={(e) => setNewFullName(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-800/50 border-2 border-slate-100 dark:border-slate-800 focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 rounded-xl py-3 px-4 text-slate-900 dark:text-white outline-none"
                    />

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <input
                        type="text"
                        placeholder="Modelo del Vehículo (Opcional)"
                        value={newCarModel}
                        onChange={(e) => setNewCarModel(e.target.value)}
                        className="w-full bg-slate-50 dark:bg-slate-800/50 border-2 border-slate-100 dark:border-slate-800 focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 rounded-xl py-3 px-4 text-slate-900 dark:text-white outline-none"
                      />
                      <input
                        type="text"
                        placeholder="Matrícula (Opcional)"
                        value={newCarPlate}
                        onChange={(e) => setNewCarPlate(e.target.value)}
                        className="w-full bg-slate-50 dark:bg-slate-800/50 border-2 border-slate-100 dark:border-slate-800 focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 rounded-xl py-3 px-4 text-slate-900 dark:text-white outline-none"
                      />
                    </div>

                    <select
                      value={newUserRole}
                      onChange={(e) => setNewUserRole(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-800/50 border-2 border-slate-100 dark:border-slate-800 focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 rounded-xl py-3 px-4 text-slate-900 dark:text-white outline-none"
                    >
                      <option value="staff">Empleado (Solo Reservas)</option>
                      <option value="admin">Administrador (Acceso Total)</option>
                    </select>
                    <button
                      type="submit"
                      disabled={!newUsername || !newUserPassword}
                      className="w-full bg-blue-600 text-white font-bold py-3 rounded-xl hover:bg-blue-700 transition-colors disabled:opacity-50"
                    >
                      Crear Usuario
                    </button>
                  </form>
                </div>
              </div>
            )}

            {activeTab === 'profile' && (
              <div className="bg-white dark:bg-slate-900 p-8 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm max-w-2xl">
                <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-6">Mi Perfil</h2>
                
                <form onSubmit={handleUpdateProfile} className="space-y-4 mb-8">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-widest">Nombre Completo</label>
                    <input
                      type="text"
                      placeholder="Tu nombre (opcional)"
                      value={myFullName}
                      onChange={(e) => setMyFullName(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-800/50 border-2 border-slate-100 dark:border-slate-800 focus:ring-4 focus:ring-[#FFD700]/20 focus:border-[#FFD700] rounded-xl py-3 px-4 text-slate-900 dark:text-white outline-none"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-widest">Modelo del Vehículo</label>
                    <input
                      type="text"
                      placeholder="Ej. Toyota Prius"
                      value={myCarModel}
                      onChange={(e) => setMyCarModel(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-800/50 border-2 border-slate-100 dark:border-slate-800 focus:ring-4 focus:ring-[#FFD700]/20 focus:border-[#FFD700] rounded-xl py-3 px-4 text-slate-900 dark:text-white outline-none"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-widest">Matrícula</label>
                    <input
                      type="text"
                      placeholder="Ej. 1234 ABC"
                      value={myCarPlate}
                      onChange={(e) => setMyCarPlate(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-800/50 border-2 border-slate-100 dark:border-slate-800 focus:ring-4 focus:ring-[#FFD700]/20 focus:border-[#FFD700] rounded-xl py-3 px-4 text-slate-900 dark:text-white outline-none"
                    />
                  </div>
                  <button
                    type="submit"
                    className="w-full bg-[#FFD700] text-black font-extrabold py-3 rounded-xl hover:bg-[#F2CB00] transition-colors"
                  >
                    Actualizar Perfil
                  </button>
                </form>

                <div className="border-t border-slate-200 dark:border-slate-800 pt-8">
                  <h3 className="font-bold text-slate-900 dark:text-white mb-4">Cambiar Mi Contraseña</h3>
                  <form onSubmit={handleChangePassword} className="space-y-4">
                    <input
                      type="password"
                      placeholder="Contraseña actual"
                      value={oldPassword}
                      onChange={(e) => setOldPassword(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-800/50 border-2 border-slate-100 dark:border-slate-800 focus:ring-4 focus:ring-[#FFD700]/20 focus:border-[#FFD700] rounded-xl py-3 px-4 text-slate-900 dark:text-white outline-none"
                    />
                    <input
                      type="password"
                      placeholder="Nueva contraseña"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-800/50 border-2 border-slate-100 dark:border-slate-800 focus:ring-4 focus:ring-[#FFD700]/20 focus:border-[#FFD700] rounded-xl py-3 px-4 text-slate-900 dark:text-white outline-none"
                    />
                    <button
                      type="submit"
                      disabled={!oldPassword || !newPassword}
                      className="w-full bg-slate-800 dark:bg-slate-700 text-white font-extrabold py-3 rounded-xl hover:bg-slate-900 dark:hover:bg-slate-600 transition-colors disabled:opacity-50"
                    >
                      Actualizar Contraseña
                    </button>
                  </form>
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
                
                {/* Generate Invoice Button */}
                <div className="pt-2">
                  <button
                    onClick={() => setShowInvoiceModal(selectedReservation)}
                    className="w-full bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 font-bold py-3.5 rounded-xl hover:bg-blue-100 dark:hover:bg-blue-500/20 transition-colors flex items-center justify-center gap-2"
                  >
                    <FileText className="w-5 h-5" /> Generar Factura
                  </button>
                </div>
              </div>
            </div>
            
            <div className="p-4 sm:p-6 border-t border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 shrink-0 flex gap-3">
              <button 
                onClick={() => setSelectedReservation(null)}
                className="flex-1 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold py-3.5 sm:py-4 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors text-sm sm:text-base"
              >
                Cerrar Detalles
              </button>
              <button 
                onClick={() => handleDeleteReservation(selectedReservation.id)}
                className="bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 font-bold px-5 rounded-xl hover:bg-red-100 dark:hover:bg-red-500/20 transition-colors flex items-center justify-center"
                title="Eliminar reserva permanentemente"
              >
                <Trash2 className="w-5 h-5" />
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

      {showInvoiceModal && (
        <InvoiceModal 
          booking={showInvoiceModal} 
          onClose={() => setShowInvoiceModal(null)} 
        />
      )}

      {userToDelete && (
        <div className="fixed inset-0 z-[120] bg-slate-900/60 flex items-center justify-center p-4 pt-[max(1rem,env(safe-area-inset-top))] pb-[max(1rem,env(safe-area-inset-bottom))] backdrop-blur-sm animate-in fade-in zoom-in-95 duration-200">
          <div className="bg-white dark:bg-slate-900 rounded-3xl w-full max-w-sm p-6 sm:p-8 shadow-2xl">
            <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6 bg-red-100 text-red-600 dark:bg-red-500/20 dark:text-red-400">
              <Trash2 className="w-8 h-8" />
            </div>
            
            <h3 className="text-2xl font-extrabold mb-2 text-slate-900 dark:text-white text-center">
              Eliminar Usuario
            </h3>
            
            <p className="text-center text-slate-500 dark:text-slate-400 mb-8 text-sm">
              ¿Estás seguro de que deseas eliminar permanentemente al usuario <strong className="text-slate-900 dark:text-white">{userToDelete}</strong>?
            </p>
            
            <div className="flex gap-3">
              <button 
                onClick={() => setUserToDelete(null)}
                className="flex-1 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold py-3 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
              >
                Cancelar
              </button>
              <button 
                onClick={confirmDeleteUser}
                className="flex-1 bg-red-500 text-white font-bold py-3 rounded-xl hover:bg-red-600 transition-colors"
              >
                Eliminar
              </button>
            </div>
          </div>
        </div>
      )}

      {feedbackMsg && (
        <div className={`fixed bottom-4 right-4 z-[150] px-6 py-4 rounded-xl shadow-2xl font-bold animate-in slide-in-from-bottom-5 fade-in ${feedbackMsg.type === 'success' ? 'bg-green-500 text-white' : 'bg-red-500 text-white'}`}>
          {feedbackMsg.text}
        </div>
      )}
    </div>
  );
}
