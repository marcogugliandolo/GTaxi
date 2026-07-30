import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  MapPin, 
  Calendar as CalendarIcon, 
  Clock, 
  Users, 
  User, 
  Phone, 
  ArrowRight, 
  ArrowLeft,
  CheckCircle2,
  Send,
  CarFront,
  CreditCard,
  Smartphone,
  Banknote,
  Clock as ClockIcon,
  MessageSquare,
  ShieldCheck
} from 'lucide-react';
import { BookingData, LocationData } from '../types';
import { getSettings, saveBooking, saveSettings } from '../api';
import AddressInput from './AddressInput';

const AdminPanel = React.lazy(() => import('./AdminPanel'));

const slideVariants = {
  enter: (direction: number) => ({
    x: direction > 0 ? '100%' : '-100%',
    opacity: 0,
    scale: 0.95
  }),
  center: {
    x: 0,
    opacity: 1,
    scale: 1,
    transition: {
      type: 'spring',
      stiffness: 300,
      damping: 30,
      mass: 0.8
    }
  },
  exit: (direction: number) => ({
    x: direction < 0 ? '100%' : '-100%',
    opacity: 0,
    scale: 0.95,
    transition: {
      type: 'spring',
      stiffness: 300,
      damping: 30,
      mass: 0.8
    }
  })
};

const INITIAL_DATA: Omit<BookingData, 'id' | 'status' | 'createdAt'> = {
  pickup: '',
  pickupLoc: null,
  dropoff: '',
  dropoffLoc: null,
  date: '',
  time: '',
  passengers: 1,
  name: '',
  phone: '',
  notes: ''
};

export default function BookingWizard() {
  const [step, setStep] = useState(0);
  const [direction, setDirection] = useState(1);
  const [formData, setFormData] = useState(INITIAL_DATA);
  const [isSending, setIsSending] = useState(false);
  const [showAdmin, setShowAdmin] = useState(false);
  const [whatsappNumber, setWhatsappNumber] = useState('34600000000');
  const [telegramUsername, setTelegramUsername] = useState('gtaxi_admin');
  
  // Payment states
  const [paymentMethod, setPaymentMethod] = useState<'tarjeta' | 'bizum' | 'efectivo' | null>(null);
  const [estimatedPrice, setEstimatedPrice] = useState<number | null>(null);

  useEffect(() => {
    const loadConfig = async () => {
      try {
        const config = await getSettings();
        if (config.whatsapp) setWhatsappNumber(config.whatsapp);
        if (config.telegram) setTelegramUsername(config.telegram);
      } catch (e) {
        console.error(e);
      }
    };
    loadConfig();
  }, []);

  useEffect(() => {
    const fetchRoutePrice = async () => {
      if (formData.pickupLoc?.lat && formData.pickupLoc?.lon && formData.dropoffLoc?.lat && formData.dropoffLoc?.lon) {
        try {
          const res = await fetch(`https://router.project-osrm.org/route/v1/driving/${formData.pickupLoc.lon},${formData.pickupLoc.lat};${formData.dropoffLoc.lon},${formData.dropoffLoc.lat}?overview=false`);
          const data = await res.json();
          if (data.routes && data.routes.length > 0) {
            const distanceKm = data.routes[0].distance / 1000;
            const base = 15;
            // Assuming 1.5 euros per km
            const price = Math.max(base, Math.floor(base + (distanceKm * 1.5)));
            setEstimatedPrice(price);
            return;
          }
        } catch (e) {
          console.error('Error calculating route:', e);
        }
      }
      setEstimatedPrice(null);
    };

    const timer = setTimeout(fetchRoutePrice, 500);
    return () => clearTimeout(timer);
  }, [formData.pickupLoc, formData.dropoffLoc]);

  const handleUpdateSettings = async (whatsapp: string, telegram: string) => {
    try {
      await saveSettings({ whatsapp, telegram });
      setWhatsappNumber(whatsapp);
      setTelegramUsername(telegram);
    } catch (e) {
      console.error(e);
    }
  };

  const updateForm = (data: Partial<typeof formData>) => {
    setFormData(prev => ({ ...prev, ...data }));
  };

  const nextStep = () => {
    if (step < 6) {
      setDirection(1);
      setStep(s => s + 1);
    }
  };

  const prevStep = () => {
    if (step > 0) {
      setDirection(-1);
      setStep(s => s - 1);
    }
  };

  const isStepValid = () => {
    switch (step) {
      case 1: return formData.pickup.length > 2 && formData.dropoff.length > 2;
      case 2: return formData.date !== '' && formData.time !== '';
      case 3: return formData.passengers >= 1;
      case 4: return formData.name.length > 2 && formData.phone.length > 5;
      case 5: return paymentMethod !== null;
      default: return true;
    }
  };

  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371; // Radius of the earth in km
    const dLat = (lat2 - lat1) * Math.PI / 180;  // deg2rad below
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLon/2) * Math.sin(dLon/2)
      ; 
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
    const d = R * c; // Distance in km
    return d;
  }

  const calculatePrice = () => {
    if (estimatedPrice !== null) return estimatedPrice;
    
    const base = 15; // Base minimum price
    
    // If we have actual coordinates, use them for real distance
    if (formData.pickupLoc?.lat && formData.pickupLoc?.lon && formData.dropoffLoc?.lat && formData.dropoffLoc?.lon) {
      const distanceKm = calculateDistance(
        formData.pickupLoc.lat,
        formData.pickupLoc.lon,
        formData.dropoffLoc.lat,
        formData.dropoffLoc.lon
      );
      
      // Fallback pricing: 15 base + 1.5 per km (multiplied by 1.4 to simulate routing detour)
      const price = base + (distanceKm * 1.4 * 1.5);
      return Math.max(base, Math.floor(price)); // Minimum price is base
    }

    // Fallback if no coordinates (shouldn't happen often if they use autocomplete)
    const distanceFactor = (formData.pickup.length + formData.dropoff.length) * 0.5;
    return Math.floor(base + distanceFactor);
  };

  const submitReservation = async () => {
    if (!paymentMethod) return;
    setIsSending(true);
    
    try {
      const price = calculatePrice();
      const newBooking = {
        ...formData,
        status: 'pending' as const,
        price,
        paymentMethod
      };
      
      await saveBooking(newBooking);
      
      const text = `🚕 *NUEVA RESERVA GTAXI* 🚕
      
📍 *Origen:* ${formData.pickup}
🏁 *Destino:* ${formData.dropoff}
📅 *Fecha:* ${formData.date}
⏰ *Hora:* ${formData.time}
👥 *Pasajeros:* ${formData.passengers}
💰 *Pago:* ${paymentMethod?.toUpperCase()} (${price}€)

👤 *Cliente:* ${formData.name}
📱 *Teléfono:* ${formData.phone}
${formData.notes ? `📝 *Paradas/Notas:* ${formData.notes}` : ''}

*Por favor, confirma esta solicitud en tu panel de administración.*`;

      const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(text)}`;
      
      window.open(whatsappUrl, '_blank');
      nextStep();
    } catch (error) {
      console.error('Error submitting:', error);
      alert('Hubo un error al procesar tu solicitud. Por favor intenta de nuevo.');
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="flex h-[100dvh] w-full bg-slate-50 font-sans overflow-hidden">
      {/* LEFT PANEL - DESKTOP ONLY */}
      <div className="hidden md:flex md:w-[35%] lg:w-[30%] bg-[#0F172A] relative flex-col justify-between p-8 overflow-hidden border-r border-slate-800">
        <div className="absolute inset-0 opacity-10 pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '32px 32px' }}></div>
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-[#FFD700] rounded-full  opacity-20 pointer-events-none"></div>
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-blue-500 rounded-full  opacity-10 pointer-events-none"></div>

        <div className="relative z-10 flex items-center gap-4 cursor-pointer hover:opacity-90 transition-opacity" onClick={() => setShowAdmin(true)}>
          <div className="relative w-12 h-12 bg-[#FFD700] rounded-xl flex items-center justify-center shadow-[0_8px_24px_rgba(255,215,0,0.3)]">
            <CarFront className="w-7 h-7 text-slate-900" strokeWidth={2.5} />
          </div>
          <span className="text-3xl font-extrabold tracking-tight text-white">GTaxi</span>
        </div>

        <div className="relative z-10 flex-1 flex flex-col justify-center my-4 space-y-4 lg:space-y-6">
          <div className={`flex items-center gap-4 transition-all duration-500 ${step >= 1 ? (step === 1 ? 'opacity-100 translate-x-2' : 'opacity-100') : 'opacity-30'}`}>
             <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold transition-colors duration-500 ${step === 1 ? 'bg-[#FFD700] text-slate-900 shadow-[0_0_20px_rgba(255,215,0,0.3)]' : step > 1 ? 'bg-green-400 text-slate-900' : 'border-2 border-slate-600 text-slate-400'}`}>
               {step > 1 ? <CheckCircle2 className="w-5 h-5"/> : '1'}
             </div>
             <div>
                <p className="text-lg font-bold text-white mb-0.5">Ruta</p>
                <p className="text-xs text-slate-400">Origen y destino</p>
             </div>
          </div>
          <div className={`flex items-center gap-4 transition-all duration-500 ${step >= 2 ? (step === 2 ? 'opacity-100 translate-x-2' : 'opacity-100') : 'opacity-30'}`}>
             <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold transition-colors duration-500 ${step === 2 ? 'bg-[#FFD700] text-slate-900 shadow-[0_0_20px_rgba(255,215,0,0.3)]' : step > 2 ? 'bg-green-400 text-slate-900' : 'border-2 border-slate-600 text-slate-400'}`}>
               {step > 2 ? <CheckCircle2 className="w-5 h-5"/> : '2'}
             </div>
             <div>
                <p className="text-lg font-bold text-white mb-0.5">Horario</p>
                <p className="text-xs text-slate-400">Fecha y hora</p>
             </div>
          </div>
          <div className={`flex items-center gap-4 transition-all duration-500 ${step >= 3 ? (step === 3 ? 'opacity-100 translate-x-2' : 'opacity-100') : 'opacity-30'}`}>
             <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold transition-colors duration-500 ${step === 3 ? 'bg-[#FFD700] text-slate-900 shadow-[0_0_20px_rgba(255,215,0,0.3)]' : step > 3 ? 'bg-green-400 text-slate-900' : 'border-2 border-slate-600 text-slate-400'}`}>
               {step > 3 ? <CheckCircle2 className="w-5 h-5"/> : '3'}
             </div>
             <div>
                <p className="text-lg font-bold text-white mb-0.5">Detalles</p>
                <p className="text-xs text-slate-400">Paradas y notas</p>
             </div>
          </div>
          <div className={`flex items-center gap-4 transition-all duration-500 ${step >= 4 ? (step === 4 ? 'opacity-100 translate-x-2' : 'opacity-100') : 'opacity-30'}`}>
             <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold transition-colors duration-500 ${step === 4 ? 'bg-[#FFD700] text-slate-900 shadow-[0_0_20px_rgba(255,215,0,0.3)]' : step > 4 ? 'bg-green-400 text-slate-900' : 'border-2 border-slate-600 text-slate-400'}`}>
               {step > 4 ? <CheckCircle2 className="w-5 h-5"/> : '4'}
             </div>
             <div>
                <p className="text-lg font-bold text-white mb-0.5">Contacto</p>
                <p className="text-xs text-slate-400">Tus datos</p>
             </div>
          </div>
          <div className={`flex items-center gap-4 transition-all duration-500 ${step >= 5 ? (step === 5 || step === 6 ? 'opacity-100 translate-x-2' : 'opacity-100') : 'opacity-30'}`}>
             <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold transition-colors duration-500 ${step >= 5 ? 'bg-[#FFD700] text-slate-900 shadow-[0_0_20px_rgba(255,215,0,0.3)]' : 'border-2 border-slate-600 text-slate-400'}`}>
               {step === 6 ? <CheckCircle2 className="w-5 h-5"/> : '5'}
             </div>
             <div>
                <p className="text-lg font-bold text-white mb-0.5">Pago</p>
                <p className="text-xs text-slate-400">Resumen y confirmación</p>
             </div>
          </div>
        </div>

        <div className="relative z-10 bg-white/5 border border-white/10 p-5 rounded-2xl ">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-slate-800/80 flex items-center justify-center border border-slate-700">
              <ShieldCheck className="w-5 h-5 text-green-400" />
            </div>
            <div>
              <p className="text-[10px] text-[#FFD700] uppercase tracking-widest font-bold mb-0.5">Servicio Seguro</p>
              <p className="text-xs font-medium text-slate-300">Reserva y espera confirmación</p>
            </div>
          </div>
        </div>
      </div>

      {/* RIGHT PANEL - MAIN CONTENT */}
      <div className="flex-1 relative flex flex-col min-w-0 bg-slate-50 md:bg-white h-[100dvh] overflow-y-auto overflow-x-hidden">
        
        {step > 0 && (
          <div className="md:hidden bg-white px-5 py-3 border-b border-slate-100 sticky top-0 z-20 flex items-center justify-between shadow-sm">
            <div className="flex items-center gap-2">
              <button onClick={prevStep} className="p-2 -ml-2 rounded-full hover:bg-slate-100 text-slate-500 transition-colors">
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div className="flex items-center gap-2 cursor-pointer" onClick={() => setShowAdmin(true)}>
                <div className="relative w-7 h-7 bg-[#FFD700] rounded-md flex items-center justify-center">
                  <CarFront className="w-4 h-4 text-slate-900" strokeWidth={2.5} />
                </div>
                <span className="font-bold text-slate-900 tracking-tight">GTaxi</span>
              </div>
            </div>
            <span className="text-xs font-bold text-slate-500 bg-slate-100 px-3 py-1 rounded-full">Paso {step}/5</span>
          </div>
        )}

        <div className="flex-1 w-full relative">
          <AnimatePresence mode="popLayout" custom={direction} initial={false}>
            
            {/* STEP 0: INTRO */}
            {step === 0 && (
              <motion.div
                key="step0"
                custom={direction}
                variants={slideVariants}
                initial="enter"
                animate="center"
                exit="exit"
                className="absolute inset-0 z-50 bg-[#0F172A] md:bg-transparent md:static md:z-auto flex flex-col justify-center px-6 py-12 min-h-[100dvh] md:min-h-full w-full"
              >
                <div className="absolute inset-0 overflow-hidden md:hidden pointer-events-none">
                  <div className="absolute -top-[10%] -right-[20%] w-[80%] h-[60%] rounded-full bg-[#FFD700]  opacity-20" />
                  <div className="absolute -bottom-[20%] -left-[10%] w-[70%] h-[50%] rounded-full bg-blue-500  opacity-10" />
                </div>

                <div className="relative z-10 w-full max-w-xl mx-auto flex flex-col items-center md:items-start text-center md:text-left pt-12 md:pt-0">
                  <div 
                    className="md:hidden relative w-20 h-20 bg-[#FFD700] rounded-[1.5rem] flex items-center justify-center shadow-[0_12px_32px_rgba(255,215,0,0.3)] mb-8 cursor-pointer hover:scale-105 transition-transform"
                    onClick={() => setShowAdmin(true)}
                  >
                    <CarFront className="w-10 h-10 text-slate-900" strokeWidth={2.5} />
                  </div>
                  
                  <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold text-white md:text-slate-900 mb-5 tracking-tight leading-tight">
                    Tu viaje premium, <br /> a un solo toque.
                  </h1>
                  <p className="text-slate-400 md:text-slate-500 mb-10 text-lg max-w-md leading-relaxed font-medium">
                    Reserva tu GTaxi al instante. Indica tus paradas, paga cómodamente y espera la confirmación de nuestro equipo.
                  </p>
                  <button
                    onClick={nextStep}
                    className="w-full sm:w-auto sm:px-12 bg-[#FFD700] text-black font-bold text-lg py-4 rounded-2xl hover:bg-[#F2CB00] active:scale-95 transition-all flex items-center justify-center gap-3 shadow-xl shadow-[#FFD700]/20"
                  >
                    Comenzar Reserva <ArrowRight className="w-6 h-6" />
                  </button>
                </div>
              </motion.div>
            )}

            {/* STEP 1: ROUTE */}
            {step === 1 && (
              <motion.div key="step1" custom={direction} variants={slideVariants} initial="enter" animate="center" exit="exit" className="flex flex-col min-h-full w-full max-w-2xl mx-auto px-4 py-6 md:p-12 lg:p-16">
                <div className="mb-6 md:mb-10">
                  <h1 className="text-2xl md:text-4xl font-extrabold text-slate-900 tracking-tight">¿A dónde vamos?</h1>
                  <p className="text-slate-500 mt-1 md:mt-2 text-sm md:text-lg font-medium">Busca la ciudad, calle o estación.</p>
                </div>
                
                <div className="flex-1 flex flex-col gap-5 md:gap-6 relative">
                  
                  <div className="bg-white rounded-2xl md:rounded-3xl p-4 md:p-6 shadow-sm border border-slate-100 relative z-20">
                    <AddressInput
                      label="Punto de recogida"
                      placeholder="Ej. Calle Gran Vía, Madrid"
                      value={formData.pickup}
                      onChange={(val) => updateForm({ pickup: val })}
                      onLocationSelect={(loc) => updateForm({ pickupLoc: loc })}
                      dotColorClass="bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.4)]"
                      allowCurrentLocation={true}
                    />
                  </div>
                  
                  <div className="bg-white rounded-2xl md:rounded-3xl p-4 md:p-6 shadow-sm border border-slate-100 relative z-10">
                    <AddressInput
                      label="Destino"
                      placeholder="Ej. Aeropuerto Adolfo Suárez"
                      value={formData.dropoff}
                      onChange={(val) => updateForm({ dropoff: val })}
                      onLocationSelect={(loc) => updateForm({ dropoffLoc: loc })}
                      dotColorClass="bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.4)]"
                    />
                  </div>
                </div>

                <div className="mt-8 flex justify-between items-center bg-white md:bg-transparent p-4 md:p-0 border-t border-slate-100 md:border-t-0 -mx-4 md:mx-0">
                  <button onClick={prevStep} className="hidden md:flex text-slate-400 hover:text-slate-700 font-bold items-center gap-2 transition-colors py-4 px-2">
                    <ArrowLeft className="w-5 h-5" /> Volver
                  </button>
                  <button
                    onClick={nextStep}
                    disabled={!isStepValid()}
                    className="w-full md:w-auto bg-[#0F172A] text-white font-bold py-4 px-10 rounded-2xl hover:bg-slate-800 active:scale-95 transition-all flex items-center justify-center gap-3 disabled:opacity-50 disabled:active:scale-100 shadow-lg md:ml-auto text-lg"
                  >
                    Continuar <ArrowRight className="w-5 h-5" />
                  </button>
                </div>
              </motion.div>
            )}

            {/* STEP 2: DATE & TIME */}
            {step === 2 && (
              <motion.div key="step2" custom={direction} variants={slideVariants} initial="enter" animate="center" exit="exit" className="flex flex-col min-h-full w-full max-w-2xl mx-auto px-4 py-6 md:p-12 lg:p-16">
                <div className="mb-6 md:mb-10">
                  <h1 className="text-2xl md:text-4xl font-extrabold text-slate-900 tracking-tight">¿Cuándo viajas?</h1>
                  <p className="text-slate-500 mt-1 md:mt-2 text-sm md:text-lg font-medium">Selecciona la fecha y hora de recogida.</p>
                </div>
                
                <div className="flex-1 flex flex-col gap-4">
                  <div className="bg-white rounded-2xl md:rounded-3xl p-5 md:p-8 shadow-sm border border-slate-100">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-6">
                      <div className="space-y-2 md:space-y-3">
                        <label className="text-xs md:text-sm font-bold text-slate-700 uppercase tracking-wide ml-1">Fecha</label>
                        <div className="relative">
                          <CalendarIcon className="absolute left-4 md:left-5 top-1/2 -translate-y-1/2 w-5 h-5 md:w-6 md:h-6 text-slate-400 z-10 pointer-events-none" />
                          <input
                            type="date"
                            value={formData.date}
                            onChange={(e) => updateForm({ date: e.target.value })}
                            className="w-full pl-12 md:pl-14 pr-4 md:pr-6 py-3.5 md:py-5 bg-white border-2 border-slate-100 focus:ring-4 focus:ring-[#FFD700]/20 focus:border-[#FFD700] rounded-xl md:rounded-2xl outline-none text-slate-900 text-base md:text-lg transition-all shadow-sm [&::-webkit-calendar-picker-indicator]:opacity-0 [&::-webkit-calendar-picker-indicator]:absolute [&::-webkit-calendar-picker-indicator]:inset-0 [&::-webkit-calendar-picker-indicator]:w-full [&::-webkit-calendar-picker-indicator]:h-full [&::-webkit-calendar-picker-indicator]:cursor-pointer relative z-0 appearance-none min-h-[3.5rem] md:min-h-[4rem]"
                          />
                        </div>
                      </div>
                      <div className="space-y-2 md:space-y-3">
                        <label className="text-xs md:text-sm font-bold text-slate-700 uppercase tracking-wide ml-1">Hora</label>
                        <div className="relative">
                          <ClockIcon className="absolute left-4 md:left-5 top-1/2 -translate-y-1/2 w-5 h-5 md:w-6 md:h-6 text-slate-400 z-10 pointer-events-none" />
                          <input
                            type="time"
                            value={formData.time}
                            onChange={(e) => updateForm({ time: e.target.value })}
                            className="w-full pl-12 md:pl-14 pr-4 md:pr-6 py-3.5 md:py-5 bg-white border-2 border-slate-100 focus:ring-4 focus:ring-[#FFD700]/20 focus:border-[#FFD700] rounded-xl md:rounded-2xl outline-none text-slate-900 text-base md:text-lg transition-all shadow-sm [&::-webkit-calendar-picker-indicator]:opacity-0 [&::-webkit-calendar-picker-indicator]:absolute [&::-webkit-calendar-picker-indicator]:inset-0 [&::-webkit-calendar-picker-indicator]:w-full [&::-webkit-calendar-picker-indicator]:h-full [&::-webkit-calendar-picker-indicator]:cursor-pointer relative z-0 appearance-none min-h-[3.5rem] md:min-h-[4rem]"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-8 flex justify-between items-center bg-white md:bg-transparent p-4 md:p-0 border-t border-slate-100 md:border-t-0 -mx-4 md:mx-0">
                  <button onClick={prevStep} className="hidden md:flex text-slate-400 hover:text-slate-700 font-bold items-center gap-2 transition-colors py-4 px-2">
                    <ArrowLeft className="w-5 h-5" /> Volver
                  </button>
                  <button
                    onClick={nextStep}
                    disabled={!isStepValid()}
                    className="w-full md:w-auto bg-[#0F172A] text-white font-bold py-4 px-10 rounded-2xl hover:bg-slate-800 active:scale-95 transition-all flex items-center justify-center gap-3 disabled:opacity-50 disabled:active:scale-100 shadow-lg md:ml-auto text-lg"
                  >
                    Continuar <ArrowRight className="w-5 h-5" />
                  </button>
                </div>
              </motion.div>
            )}

            {/* STEP 3: DETAILS */}
            {step === 3 && (
              <motion.div key="step3" custom={direction} variants={slideVariants} initial="enter" animate="center" exit="exit" className="flex flex-col min-h-full w-full max-w-2xl mx-auto px-4 py-6 md:p-12 lg:p-16">
                <div className="mb-6 md:mb-10">
                  <h1 className="text-2xl md:text-4xl font-extrabold text-slate-900 tracking-tight">Detalles del Viaje</h1>
                  <p className="text-slate-500 mt-1 md:mt-2 text-sm md:text-lg font-medium">Pasajeros y observaciones importantes.</p>
                </div>
                
                <div className="flex-1 flex flex-col gap-4">
                  <div className="bg-white rounded-2xl md:rounded-3xl p-5 md:p-8 shadow-sm border border-slate-100 space-y-6">
                    
                    <div className="space-y-2 md:space-y-3">
                      <label className="text-xs md:text-sm font-bold text-slate-700 uppercase tracking-wide ml-1">Pasajeros</label>
                      <div className="flex items-center gap-4 bg-slate-50 p-3 md:p-4 rounded-xl md:rounded-2xl border border-slate-100">
                        <Users className="w-6 h-6 text-slate-400 ml-2" />
                        <div className="flex-1 text-slate-900 font-semibold text-lg">{formData.passengers}</div>
                        <div className="flex items-center gap-2">
                          <button 
                            onClick={() => formData.passengers > 1 && updateForm({ passengers: formData.passengers - 1 })}
                            className="w-10 h-10 md:w-12 md:h-12 flex items-center justify-center rounded-xl bg-white border border-slate-200 hover:bg-slate-100 active:scale-95 transition-all text-xl md:text-2xl font-medium text-slate-600"
                          >-</button>
                          <button 
                            onClick={() => formData.passengers < 8 && updateForm({ passengers: formData.passengers + 1 })}
                            className="w-10 h-10 md:w-12 md:h-12 flex items-center justify-center rounded-xl bg-white border border-slate-200 hover:bg-slate-100 active:scale-95 transition-all text-xl md:text-2xl font-medium text-slate-600"
                          >+</button>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2 md:space-y-3">
                      <label className="text-xs md:text-sm font-bold text-slate-700 uppercase tracking-wide ml-1">Paradas / Notas para el conductor (Opcional)</label>
                      <div className="relative">
                        <MessageSquare className="absolute left-4 md:left-5 top-5 w-5 h-5 md:w-6 md:h-6 text-slate-400 z-10" />
                        <textarea
                          placeholder="Ej. Parada en calle Alcalá, llevaré 2 maletas grandes..."
                          value={formData.notes}
                          onChange={(e) => updateForm({ notes: e.target.value })}
                          className="w-full pl-12 md:pl-14 pr-4 md:pr-6 py-4 md:py-5 bg-white border-2 border-slate-100 focus:ring-4 focus:ring-[#FFD700]/20 focus:border-[#FFD700] rounded-xl md:rounded-2xl outline-none text-slate-900 text-base md:text-lg transition-all shadow-sm min-h-[120px] resize-y"
                        />
                      </div>
                    </div>

                  </div>
                </div>

                <div className="mt-8 flex justify-between items-center bg-white md:bg-transparent p-4 md:p-0 border-t border-slate-100 md:border-t-0 -mx-4 md:mx-0">
                  <button onClick={prevStep} className="hidden md:flex text-slate-400 hover:text-slate-700 font-bold items-center gap-2 transition-colors py-4 px-2">
                    <ArrowLeft className="w-5 h-5" /> Volver
                  </button>
                  <button
                    onClick={nextStep}
                    disabled={!isStepValid()}
                    className="w-full md:w-auto bg-[#0F172A] text-white font-bold py-4 px-10 rounded-2xl hover:bg-slate-800 active:scale-95 transition-all flex items-center justify-center gap-3 disabled:opacity-50 disabled:active:scale-100 shadow-lg md:ml-auto text-lg"
                  >
                    Continuar <ArrowRight className="w-5 h-5" />
                  </button>
                </div>
              </motion.div>
            )}

            {/* STEP 4: USER DATA */}
            {step === 4 && (
              <motion.div key="step4" custom={direction} variants={slideVariants} initial="enter" animate="center" exit="exit" className="flex flex-col min-h-full w-full max-w-2xl mx-auto px-4 py-6 md:p-12 lg:p-16">
                <div className="mb-6 md:mb-10">
                  <h1 className="text-2xl md:text-4xl font-extrabold text-slate-900 tracking-tight">Tus Datos</h1>
                  <p className="text-slate-500 mt-1 md:mt-2 text-sm md:text-lg font-medium">Para contactarte y confirmar el viaje.</p>
                </div>
                
                <div className="flex-1 flex flex-col gap-4">
                  <div className="bg-white rounded-2xl md:rounded-3xl p-5 md:p-8 shadow-sm border border-slate-100 space-y-5 md:space-y-6">
                    <div className="space-y-2 md:space-y-3">
                      <label className="text-xs md:text-sm font-bold text-slate-700 uppercase tracking-wide ml-1">Nombre y apellidos</label>
                      <div className="relative">
                        <User className="absolute left-4 md:left-5 top-1/2 -translate-y-1/2 w-5 h-5 md:w-6 md:h-6 text-slate-400 z-10" />
                        <input
                          type="text"
                          placeholder="Tu nombre"
                          value={formData.name}
                          onChange={(e) => updateForm({ name: e.target.value })}
                          className="w-full pl-12 md:pl-14 pr-4 md:pr-6 py-3.5 md:py-5 bg-white border-2 border-slate-100 focus:ring-4 focus:ring-[#FFD700]/20 focus:border-[#FFD700] rounded-xl md:rounded-2xl outline-none text-slate-900 text-base md:text-lg transition-all shadow-sm"
                        />
                      </div>
                    </div>
                    <div className="space-y-2 md:space-y-3">
                      <label className="text-xs md:text-sm font-bold text-slate-700 uppercase tracking-wide ml-1">Teléfono</label>
                      <div className="relative">
                        <Phone className="absolute left-4 md:left-5 top-1/2 -translate-y-1/2 w-5 h-5 md:w-6 md:h-6 text-slate-400 z-10" />
                        <input
                          type="tel"
                          placeholder="+34 600 000 000"
                          value={formData.phone}
                          onChange={(e) => updateForm({ phone: e.target.value })}
                          className="w-full pl-12 md:pl-14 pr-4 md:pr-6 py-3.5 md:py-5 bg-white border-2 border-slate-100 focus:ring-4 focus:ring-[#FFD700]/20 focus:border-[#FFD700] rounded-xl md:rounded-2xl outline-none text-slate-900 text-base md:text-lg transition-all shadow-sm"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-8 flex justify-between items-center bg-white md:bg-transparent p-4 md:p-0 border-t border-slate-100 md:border-t-0 -mx-4 md:mx-0">
                  <button onClick={prevStep} className="hidden md:flex text-slate-400 hover:text-slate-700 font-bold items-center gap-2 transition-colors py-4 px-2">
                    <ArrowLeft className="w-5 h-5" /> Volver
                  </button>
                  <button
                    onClick={nextStep}
                    disabled={!isStepValid()}
                    className="w-full md:w-auto bg-[#FFD700] text-black font-bold py-4 px-10 rounded-2xl hover:bg-[#F2CB00] active:scale-95 transition-all flex items-center justify-center gap-3 disabled:opacity-50 disabled:active:scale-100 shadow-lg shadow-[#FFD700]/20 md:ml-auto text-lg"
                  >
                    Resumen y Pago <ArrowRight className="w-5 h-5" />
                  </button>
                </div>
              </motion.div>
            )}

            {/* STEP 5: PAYMENT / SUMMARY */}
            {step === 5 && (
              <motion.div key="step5" custom={direction} variants={slideVariants} initial="enter" animate="center" exit="exit" className="flex flex-col min-h-full w-full max-w-2xl mx-auto px-4 py-6 md:p-12 lg:p-16">
                
                <div className="text-center mb-6 pt-4 md:pt-0">
                  <h1 className="text-2xl md:text-4xl font-extrabold text-slate-900 tracking-tight">Proceso de Pago</h1>
                  <p className="text-slate-500 mt-1 md:mt-2 text-sm md:text-lg font-medium">Revisa tu importe y método de pago</p>
                </div>
                
                <div className="bg-white rounded-2xl md:rounded-3xl p-5 md:p-8 space-y-6 flex-shrink-0 mb-6 md:mb-8 border border-slate-200 shadow-lg shadow-slate-200/40">
                  
                  {/* Summary Block */}
                  <div className="flex justify-between items-center bg-slate-50 p-4 rounded-xl border border-slate-100">
                     <div className="space-y-1">
                        <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Ruta Seleccionada</span>
                        <p className="text-slate-900 font-semibold text-sm truncate max-w-[200px] md:max-w-xs">{formData.pickup}</p>
                     </div>
                     <div className="text-right space-y-1">
                        <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Importe Total</span>
                        <p className="text-3xl font-extrabold text-slate-900 leading-none">{calculatePrice()}€</p>
                     </div>
                  </div>
                  
                  <div className="h-px bg-slate-100 w-full" />
                  
                  {/* Payment Options */}
                  <div className="flex flex-col gap-3">
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Selecciona método de pago</span>
                    
                    <button 
                      onClick={() => setPaymentMethod('tarjeta')}
                      className={`flex items-center p-4 rounded-xl border-2 transition-all ${paymentMethod === 'tarjeta' ? 'border-blue-500 bg-blue-50/50' : 'border-slate-100 hover:border-slate-300 bg-white'}`}
                    >
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center mr-4 ${paymentMethod === 'tarjeta' ? 'bg-blue-100 text-blue-600' : 'bg-slate-100 text-slate-500'}`}>
                        <CreditCard className="w-5 h-5" />
                      </div>
                      <div className="text-left flex-1">
                        <p className={`font-bold ${paymentMethod === 'tarjeta' ? 'text-blue-900' : 'text-slate-700'}`}>Tarjeta de Crédito / Débito</p>
                        <p className="text-xs text-slate-500">Pago seguro procesado online</p>
                      </div>
                      {paymentMethod === 'tarjeta' && <CheckCircle2 className="w-5 h-5 text-blue-500" />}
                    </button>

                    <button 
                      onClick={() => setPaymentMethod('bizum')}
                      className={`flex items-center p-4 rounded-xl border-2 transition-all ${paymentMethod === 'bizum' ? 'border-[#00c4b3] bg-[#00c4b3]/10' : 'border-slate-100 hover:border-slate-300 bg-white'}`}
                    >
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center mr-4 ${paymentMethod === 'bizum' ? 'bg-[#00c4b3]/20 text-[#008f83]' : 'bg-slate-100 text-slate-500'}`}>
                        <Smartphone className="w-5 h-5" />
                      </div>
                      <div className="text-left flex-1">
                        <p className={`font-bold ${paymentMethod === 'bizum' ? 'text-[#008f83]' : 'text-slate-700'}`}>Bizum</p>
                        <p className="text-xs text-slate-500">Recibirás el número al confirmar</p>
                      </div>
                      {paymentMethod === 'bizum' && <CheckCircle2 className="w-5 h-5 text-[#00c4b3]" />}
                    </button>

                    <button 
                      onClick={() => setPaymentMethod('efectivo')}
                      className={`flex items-center p-4 rounded-xl border-2 transition-all ${paymentMethod === 'efectivo' ? 'border-green-500 bg-green-50/50' : 'border-slate-100 hover:border-slate-300 bg-white'}`}
                    >
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center mr-4 ${paymentMethod === 'efectivo' ? 'bg-green-100 text-green-600' : 'bg-slate-100 text-slate-500'}`}>
                        <Banknote className="w-5 h-5" />
                      </div>
                      <div className="text-left flex-1">
                        <p className={`font-bold ${paymentMethod === 'efectivo' ? 'text-green-900' : 'text-slate-700'}`}>Efectivo al Conductor</p>
                        <p className="text-xs text-slate-500">Pago directo en el vehículo</p>
                      </div>
                      {paymentMethod === 'efectivo' && <CheckCircle2 className="w-5 h-5 text-green-500" />}
                    </button>
                  </div>
                </div>

                <div className="mt-auto pb-6">
                  <div className="bg-[#0F172A] rounded-2xl md:rounded-3xl p-5 md:p-8 flex flex-col items-center justify-between gap-5 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-[#FFD700] rounded-full  opacity-20 pointer-events-none"></div>
                    
                    <div className="text-center w-full z-10">
                      <p className="text-white font-bold text-xl">Confirmar Reserva</p>
                      <p className="text-slate-400 text-xs md:text-sm mt-1">El importe será revisado por el administrador antes de ser definitivo.</p>
                    </div>
                    
                    <button
                      onClick={submitReservation}
                      disabled={!paymentMethod || isSending}
                      className="w-full bg-[#FFD700] text-[#0F172A] font-bold py-4 px-6 rounded-2xl hover:bg-[#F2CB00] active:scale-95 transition-all flex items-center justify-center gap-2 shadow-lg shadow-[#FFD700]/20 disabled:opacity-70 disabled:scale-100 text-lg"
                    >
                      {isSending ? (
                        <div className="w-6 h-6 border-2 border-[#0F172A]/30 border-t-[#0F172A] rounded-full animate-spin"></div>
                      ) : (
                        <>Enviar Solicitud <ArrowRight className="w-5 h-5" /></>
                      )}
                    </button>
                  </div>

                  <div className="flex justify-center mt-6">
                     <button onClick={prevStep} disabled={isSending} className="flex text-slate-400 hover:text-slate-700 font-bold items-center gap-2 transition-colors py-2 px-4 disabled:opacity-50">
                       <ArrowLeft className="w-5 h-5" /> Volver atrás
                     </button>
                  </div>
                </div>
              </motion.div>
            )}

            {/* STEP 6: SUCCESS */}
            {step === 6 && (
              <motion.div key="step6" custom={direction} variants={slideVariants} initial="enter" animate="center" exit="exit" className="flex flex-col min-h-full w-full max-w-2xl mx-auto px-4 py-6 md:p-12 lg:p-16">
                <div className="flex-1 flex flex-col items-center justify-center text-center space-y-6">
                  <div className="w-24 h-24 bg-yellow-50 text-yellow-500 rounded-full flex items-center justify-center mx-auto mb-2 border-4 border-yellow-100 shadow-inner">
                    <ClockIcon className="w-12 h-12 animate-pulse" />
                  </div>
                  <h1 className="text-3xl md:text-5xl font-extrabold text-slate-900 tracking-tight leading-tight">Solicitud en Espera</h1>
                  <p className="text-slate-600 text-lg md:text-xl font-medium max-w-md mx-auto leading-relaxed">
                    Hemos recibido tu solicitud. <span className="font-bold text-slate-900">Un administrador debe aceptar el viaje</span> y confirmarlo a través de WhatsApp o llamada telefónica en los próximos minutos.
                  </p>
                  
                  <div className="pt-8 w-full flex flex-col items-center gap-4">
                    <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl w-full max-w-xs flex flex-col items-center">
                      <p className="text-xs text-slate-500 uppercase font-bold tracking-wider mb-1">Tu identificador</p>
                      <p className="font-mono font-bold text-lg text-slate-900">#{Math.random().toString(36).substr(2, 6).toUpperCase()}</p>
                    </div>

                    <button
                      onClick={() => {
                        setStep(0);
                        setFormData(INITIAL_DATA);
                        setPaymentMethod(null);
                      }}
                      className="w-full max-w-xs mx-auto bg-[#0F172A] text-white font-bold py-4 px-8 rounded-2xl hover:bg-slate-800 active:scale-95 transition-all shadow-lg block"
                    >
                      Volver al inicio
                    </button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {showAdmin && (
        <React.Suspense fallback={<div className="fixed inset-0 z-50 bg-slate-900/50 flex items-center justify-center"><div className="w-8 h-8 border-4 border-white border-t-transparent rounded-full animate-spin"></div></div>}>
          <AdminPanel
            onClose={() => setShowAdmin(false)}
            onUpdateSettings={handleUpdateSettings}
            currentWhatsapp={whatsappNumber}
            currentTelegram={telegramUsername}
          />
        </React.Suspense>
      )}
    </div>
  );
}
