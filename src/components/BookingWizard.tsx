import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Moon, 
  Sun,
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
import ModernDateTimePicker from './ModernDateTimePicker';
import VaixaLogo from './VaixaLogo';
import { useLanguage } from '../contexts/LanguageContext';
import { useTheme } from '../contexts/ThemeContext';



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
      type: 'spring' as const,
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
      type: 'spring' as const,
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
  const navigate = useNavigate();
  const { t, language, setLanguage } = useLanguage();
  const { theme, toggleTheme } = useTheme();

  const [step, setStep] = useState(0);
  const [direction, setDirection] = useState(1);
  const [formData, setFormData] = useState(INITIAL_DATA);
  const [isSending, setIsSending] = useState(false);
  
  const [whatsappNumber, setWhatsappNumber] = useState('34664287876');
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

      let contactUrl = '';
      if (whatsappNumber) {
        let cleanNumber = whatsappNumber.replace(/[^0-9]/g, '');
        if (cleanNumber.length === 9) {
          cleanNumber = '34' + cleanNumber;
        }
        contactUrl = `https://wa.me/${cleanNumber}?text=${encodeURIComponent(text)}`;
      } else if (telegramUsername) {
        contactUrl = `https://t.me/${telegramUsername}?text=${encodeURIComponent(text)}`;
      }
      
      if (contactUrl) {
        window.open(contactUrl, '_blank');
      }
      
      nextStep();
    } catch (error) {
      console.error('Error submitting:', error);
      alert(t('errorProcessing'));
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="flex flex-1 h-full min-h-0 w-full bg-slate-50 dark:bg-slate-800/50 font-sans overflow-hidden">


      {/* LEFT PANEL - DESKTOP ONLY */}
      <div className="hidden md:flex md:w-[35%] lg:w-[30%] bg-[#0F172A] relative flex-col justify-between p-8 overflow-hidden border-r border-slate-800">
        <div className="absolute inset-0 opacity-10 pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '32px 32px' }}></div>
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-[#FFD700] rounded-full  opacity-20 pointer-events-none"></div>
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-blue-500 rounded-full  opacity-10 pointer-events-none"></div>

        <div className="relative z-10 cursor-pointer hover:opacity-90 transition-opacity" onClick={() => navigate('/admin')}>
          <VaixaLogo size={160} variant="light" />
          <div className="mt-2 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-[11px] font-medium text-slate-300">
            <span className="w-1.5 h-1.5 rounded-full bg-[#FFD700]"></span>
            <span>{t("serviceAreaBadge")}</span>
          </div>
        </div>

        <div className="relative z-10 flex-1 flex flex-col justify-center my-4 space-y-4 lg:space-y-6">
          <div className={`flex items-center gap-4 transition-all duration-500 ${step >= 1 ? (step === 1 ? 'opacity-100 translate-x-2' : 'opacity-100') : 'opacity-30'}`}>
             <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold transition-colors duration-500 ${step === 1 ? 'bg-[#FFD700] text-slate-900 shadow-[0_0_20px_rgba(255,215,0,0.3)]' : step > 1 ? 'bg-green-400 text-slate-900' : 'border-2 border-slate-600 text-slate-400'}`}>
               {step > 1 ? <CheckCircle2 className="w-5 h-5"/> : '1'}
             </div>
             <div>
                <p className="text-lg font-bold text-white mb-0.5">{t("route")}</p>
                <p className="text-xs text-slate-400">{t("whereTo")}</p>
             </div>
          </div>
          <div className={`flex items-center gap-4 transition-all duration-500 ${step >= 2 ? (step === 2 ? 'opacity-100 translate-x-2' : 'opacity-100') : 'opacity-30'}`}>
             <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold transition-colors duration-500 ${step === 2 ? 'bg-[#FFD700] text-slate-900 shadow-[0_0_20px_rgba(255,215,0,0.3)]' : step > 2 ? 'bg-green-400 text-slate-900' : 'border-2 border-slate-600 text-slate-400'}`}>
               {step > 2 ? <CheckCircle2 className="w-5 h-5"/> : '2'}
             </div>
             <div>
                <p className="text-lg font-bold text-white mb-0.5">{t("dateTime")}</p>
                <p className="text-xs text-slate-400">{t("whenTravel")}</p>
             </div>
          </div>
          <div className={`flex items-center gap-4 transition-all duration-500 ${step >= 3 ? (step === 3 ? 'opacity-100 translate-x-2' : 'opacity-100') : 'opacity-30'}`}>
             <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold transition-colors duration-500 ${step === 3 ? 'bg-[#FFD700] text-slate-900 shadow-[0_0_20px_rgba(255,215,0,0.3)]' : step > 3 ? 'bg-green-400 text-slate-900' : 'border-2 border-slate-600 text-slate-400'}`}>
               {step > 3 ? <CheckCircle2 className="w-5 h-5"/> : '3'}
             </div>
             <div>
                <p className="text-lg font-bold text-white mb-0.5">{t("tripDetails")}</p>
                <p className="text-xs text-slate-400">{t("passengersNotes")}</p>
             </div>
          </div>
          <div className={`flex items-center gap-4 transition-all duration-500 ${step >= 4 ? (step === 4 ? 'opacity-100 translate-x-2' : 'opacity-100') : 'opacity-30'}`}>
             <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold transition-colors duration-500 ${step === 4 ? 'bg-[#FFD700] text-slate-900 shadow-[0_0_20px_rgba(255,215,0,0.3)]' : step > 4 ? 'bg-green-400 text-slate-900' : 'border-2 border-slate-600 text-slate-400'}`}>
               {step > 4 ? <CheckCircle2 className="w-5 h-5"/> : '4'}
             </div>
             <div>
                <p className="text-lg font-bold text-white mb-0.5">{t("yourData")}</p>
                <p className="text-xs text-slate-400">{t("yourDetails")}</p>
             </div>
          </div>
          <div className={`flex items-center gap-4 transition-all duration-500 ${step >= 5 ? (step === 5 || step === 6 ? 'opacity-100 translate-x-2' : 'opacity-100') : 'opacity-30'}`}>
             <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold transition-colors duration-500 ${step >= 5 ? 'bg-[#FFD700] text-slate-900 shadow-[0_0_20px_rgba(255,215,0,0.3)]' : 'border-2 border-slate-600 text-slate-400'}`}>
               {step === 6 ? <CheckCircle2 className="w-5 h-5"/> : '5'}
             </div>
             <div>
                <p className="text-lg font-bold text-white mb-0.5">{t("paymentProcess")}</p>
                <p className="text-xs text-slate-400">{t("summaryConfirm")}</p>
             </div>
          </div>
        </div>

        <div className="relative z-10 bg-white/5 border border-white/10 p-5 rounded-2xl">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-slate-800/80 flex items-center justify-center border border-slate-700">
              <ShieldCheck className="w-5 h-5 text-green-400" />
            </div>
            <div>
              <p className="text-[10px] text-[#FFD700] uppercase tracking-widest font-bold mb-0.5">{t("secureService")}</p>
              <p className="text-xs font-medium text-slate-300">{t("bookAndWait")}</p>
            </div>
          </div>
        </div>

      </div>

      {/* RIGHT PANEL - MAIN CONTENT */}
      <div className="flex-1 relative flex flex-col min-w-0 bg-slate-50 dark:bg-slate-800/50 md:bg-white dark:bg-slate-900 h-full min-h-0 overflow-y-auto overflow-x-hidden">
        
        {step > 0 && (
          <div className="md:hidden flex-shrink-0 bg-white dark:bg-slate-900 px-5 py-3 border-b border-slate-100 dark:border-slate-700 sticky top-0 z-20 flex items-center justify-between shadow-sm">
            <div className="flex items-center gap-2">
              <button onClick={prevStep} className={`p-2 -ml-2 rounded-full hover:bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 transition-colors ${step === 1 ? 'opacity-0 pointer-events-none' : ''}`}>
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div className="flex items-center cursor-pointer" onClick={() => navigate('/admin')}>
                <VaixaLogo size={46} />
              </div>
            </div>
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-3 py-1 rounded-full">Paso {step}/5</span>
          </div>
        )}

        <div className="flex-1 w-full relative flex flex-col min-h-full">
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
                className="absolute inset-0 z-50 bg-[#0F172A] md:bg-transparent md:static md:z-auto flex flex-col justify-center px-6 py-12 min-h-full md:min-h-full w-full"
              >
                <div className="absolute inset-0 overflow-hidden md:hidden pointer-events-none">
                  <div className="absolute -top-[10%] -right-[20%] w-[80%] h-[60%] rounded-full bg-[#FFD700]  opacity-20" />
                  <div className="absolute -bottom-[20%] -left-[10%] w-[70%] h-[50%] rounded-full bg-blue-500  opacity-10" />
                </div>

                <div className="relative z-10 w-full max-w-xl mx-auto flex flex-col items-center md:items-start text-center md:text-left pt-12 md:pt-0">
                  <div 
                    className="md:hidden cursor-pointer hover:scale-105 transition-transform mb-8"
                    onClick={() => navigate('/admin')}
                  >
                    <VaixaLogo size={180} layout="vertical" variant="light" />
                  </div>
                  
                  <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-800/90 border border-slate-700 text-amber-300 md:bg-amber-50 md:border-amber-200/80 md:text-amber-950 dark:md:bg-slate-800/90 dark:md:border-slate-700 dark:md:text-amber-300 text-xs font-semibold mb-5 shadow-sm">
                    <span className="w-2 h-2 rounded-full bg-amber-400 dark:bg-amber-300 shrink-0"></span>
                    <span className="tracking-wide">{t("serviceAreaBadge")}</span>
                  </div>

                  <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold text-white md:text-slate-900 dark:text-white mb-5 tracking-tight leading-tight">
                    {t("slogan1")} <br /> {t("slogan2")}
                  </h1>
                  <p className="text-slate-400 md:text-slate-500 dark:text-slate-400 mb-10 text-lg max-w-md leading-relaxed font-medium">
                    {t("heroFeatures")}
                  </p>
                  <button
                    onClick={nextStep}
                    className="w-full sm:w-auto sm:px-12 bg-[#FFD700] text-black font-bold text-lg py-4 rounded-2xl hover:bg-[#F2CB00] active:scale-95 transition-all flex items-center justify-center gap-3 shadow-xl shadow-[#FFD700]/20"
                  >
                    {t("bookNow")} <ArrowRight className="w-6 h-6" />
                  </button>
                </div>
              </motion.div>
            )}

            {/* STEP 1: ROUTE */}
            {step === 1 && (
              <motion.div key="step1" custom={direction} variants={slideVariants} initial="enter" animate="center" exit="exit" className="flex-1 flex flex-col min-h-full w-full max-w-2xl mx-auto px-4 py-4 md:p-12 lg:p-16 pb-6 md:pb-8">
                <div className="mb-4 md:mb-10">
                  <h1 className="text-xl sm:text-2xl md:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight">{t("whereTo")}</h1>
                  <p className="text-slate-500 dark:text-slate-400 mt-1 md:mt-2 text-xs sm:text-sm md:text-lg font-medium">{t("searchCity")}</p>
                </div>
                
                <div className="flex-1 flex flex-col gap-4 md:gap-6 relative">
                  
                  <div className="bg-white dark:bg-slate-900 rounded-2xl md:rounded-3xl p-4 md:p-6 shadow-sm border border-slate-100 dark:border-slate-700 relative z-20">
                    <AddressInput
                      label={t("fromLabel")}
                      placeholder={t("fromPlaceholder")}
                      value={formData.pickup}
                      onChange={(val) => updateForm({ pickup: val })}
                      onLocationSelect={(loc) => updateForm({ pickupLoc: loc })}
                      dotColorClass="bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.4)]"
                      allowCurrentLocation={true}
                    />
                  </div>
                  
                  <div className="bg-white dark:bg-slate-900 rounded-2xl md:rounded-3xl p-4 md:p-6 shadow-sm border border-slate-100 dark:border-slate-700 relative z-10">
                    <AddressInput
                      label={t("toLabel")}
                      placeholder={t("toPlaceholder")}
                      value={formData.dropoff}
                      onChange={(val) => updateForm({ dropoff: val })}
                      onLocationSelect={(loc) => updateForm({ dropoffLoc: loc })}
                      dotColorClass="bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.4)]"
                    />
                  </div>
                </div>

                <div className="mt-auto pt-6 pb-[calc(0.5rem+env(safe-area-inset-bottom))] md:pb-[env(safe-area-inset-bottom)] flex gap-3 items-center border-t border-slate-200 dark:border-slate-800 md:border-t-0">
                  <button onClick={prevStep} className="flex text-slate-600 dark:text-slate-200 bg-slate-100 dark:bg-slate-700/50 hover:bg-slate-200 dark:hover:bg-slate-600 font-bold items-center justify-center gap-2 transition-colors py-3.5 px-4 sm:px-5 rounded-xl text-sm sm:text-base shrink-0 border border-transparent dark:border-slate-600">
                    <ArrowLeft className="w-5 h-5" /> <span>{t("back")}</span>
                  </button>
                  <button
                    onClick={nextStep}
                    disabled={!isStepValid()}
                    className="flex-1 bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold py-3.5 px-6 rounded-xl hover:bg-slate-800 dark:hover:bg-slate-100 active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:active:scale-100 shadow-md shadow-slate-900/20 dark:shadow-white/10 text-sm sm:text-base"
                  >
                    {t("continue")} <ArrowRight className="w-5 h-5" />
                  </button>
                </div>
              </motion.div>
            )}

            {/* STEP 2: DATE & TIME */}
            {step === 2 && (
              <motion.div key="step2" custom={direction} variants={slideVariants} initial="enter" animate="center" exit="exit" className="flex-1 flex flex-col min-h-full w-full max-w-4xl mx-auto px-4 py-4 md:p-8 lg:p-12 pb-6 md:pb-8">
                <div className="mb-4 md:mb-8">
                  <h1 className="text-xl sm:text-2xl md:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight">{t("whenTravel")}</h1>
                  <p className="text-slate-500 dark:text-slate-400 mt-1 md:mt-2 text-xs sm:text-sm md:text-base font-medium">{t("selectDateTime")}</p>
                </div>
                
                <div className="flex-1">
                  <ModernDateTimePicker
                    date={formData.date}
                    time={formData.time}
                    onDateChange={(d) => updateForm({ date: d })}
                    onTimeChange={(t) => updateForm({ time: t })}
                  />
                </div>

                <div className="mt-auto pt-6 pb-[calc(0.5rem+env(safe-area-inset-bottom))] md:pb-[env(safe-area-inset-bottom)] flex gap-3 items-center border-t border-slate-200 dark:border-slate-800 md:border-t-0">
                  <button onClick={prevStep} className="flex text-slate-600 dark:text-slate-200 bg-slate-100 dark:bg-slate-700/50 hover:bg-slate-200 dark:hover:bg-slate-600 font-bold items-center justify-center gap-2 transition-colors py-3.5 px-4 sm:px-5 rounded-xl text-sm sm:text-base shrink-0 border border-transparent dark:border-slate-600">
                    <ArrowLeft className="w-5 h-5" /> <span>{t("back")}</span>
                  </button>
                  <button
                    onClick={nextStep}
                    disabled={!isStepValid()}
                    className="flex-1 bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold py-3.5 px-6 rounded-xl hover:bg-slate-800 dark:hover:bg-slate-100 active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:active:scale-100 shadow-md shadow-slate-900/20 dark:shadow-white/10 text-sm sm:text-base"
                  >
                    {t("continue")} <ArrowRight className="w-5 h-5" />
                  </button>
                </div>
              </motion.div>
            )}

            {/* STEP 3: DETAILS */}
            {step === 3 && (
              <motion.div key="step3" custom={direction} variants={slideVariants} initial="enter" animate="center" exit="exit" className="flex-1 flex flex-col min-h-full w-full max-w-2xl mx-auto px-4 py-4 md:p-12 lg:p-16 pb-6 md:pb-8">
                <div className="mb-4 md:mb-10">
                  <h1 className="text-xl sm:text-2xl md:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight">{t("tripDetails")}</h1>
                  <p className="text-slate-500 dark:text-slate-400 mt-1 md:mt-2 text-xs sm:text-sm md:text-lg font-medium">{t("passengersNotes")}</p>
                </div>
                
                <div className="flex-1 flex flex-col gap-4">
                  <div className="bg-white dark:bg-slate-900 rounded-2xl md:rounded-3xl p-4 sm:p-5 md:p-8 shadow-sm border border-slate-100 dark:border-slate-700 space-y-5 sm:space-y-6">
                    
                    <div className="space-y-2 md:space-y-3">
                      <label className="text-xs md:text-sm font-bold text-slate-700 dark:text-slate-200 uppercase tracking-wide ml-1">{t("passengersLabel")}</label>
                      <div className="flex items-center gap-4 bg-slate-50 dark:bg-slate-800/50 p-3 md:p-4 rounded-xl md:rounded-2xl border border-slate-100 dark:border-slate-700">
                        <Users className="w-6 h-6 text-slate-400 ml-2" />
                        <div className="flex-1 text-slate-900 dark:text-white font-semibold text-lg">{formData.passengers}</div>
                        <div className="flex items-center gap-2">
                          <button 
                            onClick={() => formData.passengers > 1 && updateForm({ passengers: formData.passengers - 1 })}
                            className="w-10 h-10 md:w-12 md:h-12 flex items-center justify-center rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:bg-slate-800 active:scale-95 transition-all text-xl md:text-2xl font-medium text-slate-600 dark:text-slate-300"
                          >-</button>
                          <button 
                            onClick={() => formData.passengers < 8 && updateForm({ passengers: formData.passengers + 1 })}
                            className="w-10 h-10 md:w-12 md:h-12 flex items-center justify-center rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:bg-slate-800 active:scale-95 transition-all text-xl md:text-2xl font-medium text-slate-600 dark:text-slate-300"
                          >+</button>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2 md:space-y-3">
                      <label className="text-xs md:text-sm font-bold text-slate-700 dark:text-slate-200 uppercase tracking-wide ml-1">{t("stopsNotes")}</label>
                      <div className="relative">
                        <MessageSquare className="absolute left-4 md:left-5 top-5 w-5 h-5 md:w-6 md:h-6 text-slate-400 z-10" />
                        <textarea
                          placeholder="Ej. Parada en calle Alcalá, llevaré 2 maletas grandes..."
                          value={formData.notes}
                          onChange={(e) => updateForm({ notes: e.target.value })}
                          className="w-full pl-12 md:pl-14 pr-4 md:pr-6 py-4 md:py-5 bg-white dark:bg-slate-900 border-2 border-slate-100 dark:border-slate-700 focus:ring-4 focus:ring-[#FFD700]/20 focus:border-[#FFD700] rounded-xl md:rounded-2xl outline-none text-slate-900 dark:text-white text-base md:text-lg transition-all shadow-sm min-h-[120px] resize-y"
                        />
                      </div>
                    </div>

                  </div>
                </div>

                <div className="mt-auto pt-6 pb-[calc(0.5rem+env(safe-area-inset-bottom))] md:pb-[env(safe-area-inset-bottom)] flex gap-3 items-center border-t border-slate-200 dark:border-slate-800 md:border-t-0">
                  <button onClick={prevStep} className="flex text-slate-600 dark:text-slate-200 bg-slate-100 dark:bg-slate-700/50 hover:bg-slate-200 dark:hover:bg-slate-600 font-bold items-center justify-center gap-2 transition-colors py-3.5 px-4 sm:px-5 rounded-xl text-sm sm:text-base shrink-0 border border-transparent dark:border-slate-600">
                    <ArrowLeft className="w-5 h-5" /> <span>{t("back")}</span>
                  </button>
                  <button
                    onClick={nextStep}
                    disabled={!isStepValid()}
                    className="flex-1 bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold py-3.5 px-6 rounded-xl hover:bg-slate-800 dark:hover:bg-slate-100 active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:active:scale-100 shadow-md shadow-slate-900/20 dark:shadow-white/10 text-sm sm:text-base"
                  >
                    {t("continue")} <ArrowRight className="w-5 h-5" />
                  </button>
                </div>
              </motion.div>
            )}

            {/* STEP 4: USER DATA */}
            {step === 4 && (
              <motion.div key="step4" custom={direction} variants={slideVariants} initial="enter" animate="center" exit="exit" className="flex-1 flex flex-col min-h-full w-full max-w-2xl mx-auto px-4 py-4 md:p-12 lg:p-16 pb-6 md:pb-8">
                <div className="mb-4 md:mb-10">
                  <h1 className="text-xl sm:text-2xl md:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight">{t("yourData")}</h1>
                  <p className="text-slate-500 dark:text-slate-400 mt-1 md:mt-2 text-xs sm:text-sm md:text-lg font-medium">{t("contactConfirm")}</p>
                </div>
                
                <div className="flex-1 flex flex-col gap-4">
                  <div className="bg-white dark:bg-slate-900 rounded-2xl md:rounded-3xl p-4 sm:p-5 md:p-8 shadow-sm border border-slate-100 dark:border-slate-700 space-y-4 sm:space-y-5 md:space-y-6">
                    <div className="space-y-2 md:space-y-3">
                      <label className="text-xs md:text-sm font-bold text-slate-700 dark:text-slate-200 uppercase tracking-wide ml-1">{t("nameLabel")}</label>
                      <div className="relative">
                        <User className="absolute left-4 md:left-5 top-1/2 -translate-y-1/2 w-5 h-5 md:w-6 md:h-6 text-slate-400 z-10" />
                        <input
                          type="text"
                          placeholder="Tu nombre"
                          value={formData.name}
                          onChange={(e) => updateForm({ name: e.target.value })}
                          className="w-full pl-12 md:pl-14 pr-4 md:pr-6 py-3.5 md:py-5 bg-white dark:bg-slate-900 border-2 border-slate-100 dark:border-slate-700 focus:ring-4 focus:ring-[#FFD700]/20 focus:border-[#FFD700] rounded-xl md:rounded-2xl outline-none text-slate-900 dark:text-white text-base md:text-lg transition-all shadow-sm"
                        />
                      </div>
                    </div>
                    <div className="space-y-2 md:space-y-3">
                      <label className="text-xs md:text-sm font-bold text-slate-700 dark:text-slate-200 uppercase tracking-wide ml-1">{t("phoneLabel")}</label>
                      <div className="relative">
                        <Phone className="absolute left-4 md:left-5 top-1/2 -translate-y-1/2 w-5 h-5 md:w-6 md:h-6 text-slate-400 z-10" />
                        <input
                          type="tel"
                          placeholder="+34 600 000 000"
                          value={formData.phone}
                          onChange={(e) => updateForm({ phone: e.target.value })}
                          className="w-full pl-12 md:pl-14 pr-4 md:pr-6 py-3.5 md:py-5 bg-white dark:bg-slate-900 border-2 border-slate-100 dark:border-slate-700 focus:ring-4 focus:ring-[#FFD700]/20 focus:border-[#FFD700] rounded-xl md:rounded-2xl outline-none text-slate-900 dark:text-white text-base md:text-lg transition-all shadow-sm"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-auto pt-6 pb-[calc(0.5rem+env(safe-area-inset-bottom))] md:pb-[env(safe-area-inset-bottom)] flex gap-3 items-center border-t border-slate-200 dark:border-slate-800 md:border-t-0">
                  <button onClick={prevStep} className="flex text-slate-600 dark:text-slate-200 bg-slate-100 dark:bg-slate-700/50 hover:bg-slate-200 dark:hover:bg-slate-600 font-bold items-center justify-center gap-2 transition-colors py-3.5 px-4 sm:px-5 rounded-xl text-sm sm:text-base shrink-0 border border-transparent dark:border-slate-600">
                    <ArrowLeft className="w-5 h-5" /> <span>{t("back")}</span>
                  </button>
                  <button
                    onClick={nextStep}
                    disabled={!isStepValid()}
                    className="flex-1 bg-[#FFD700] text-black font-bold py-3.5 px-6 rounded-xl hover:bg-[#F2CB00] active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:active:scale-100 shadow-md text-sm sm:text-base"
                  >
                    {t("summary")} <ArrowRight className="w-5 h-5" />
                  </button>
                </div>
              </motion.div>
            )}

            {/* STEP 5: PAYMENT / SUMMARY */}
            {step === 5 && (
              <motion.div key="step5" custom={direction} variants={slideVariants} initial="enter" animate="center" exit="exit" className="flex-1 flex flex-col min-h-full w-full max-w-2xl mx-auto px-4 py-4 md:p-12 lg:p-16 pb-6 md:pb-8">
                
                <div className="text-center mb-4 md:mb-6 pt-2 md:pt-0">
                  <h1 className="text-xl sm:text-2xl md:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight">{t("paymentProcess")}</h1>
                  <p className="text-slate-500 dark:text-slate-400 mt-1 text-xs sm:text-sm md:text-lg font-medium">{t("reviewPayment")}</p>
                </div>
                
                <div className="bg-white dark:bg-slate-900 rounded-2xl md:rounded-3xl p-4 sm:p-6 md:p-8 space-y-4 sm:space-y-6 flex-shrink-0 mb-6 border border-slate-200 dark:border-slate-700 shadow-md shadow-slate-200/40 dark:shadow-none">
                  
                  {/* Detailed Summary Card for Mobile & Desktop */}
                  <div className="bg-slate-50 dark:bg-slate-800/60 p-3.5 sm:p-5 rounded-xl border border-slate-100 dark:border-slate-700/80 space-y-3 sm:space-y-4">
                     <div className="flex justify-between items-start gap-2 border-b border-slate-200/60 dark:border-slate-700/60 pb-3">
                        <div className="space-y-0.5 min-w-0 flex-1">
                           <span className="text-[10px] sm:text-xs font-bold text-slate-400 dark:text-slate-400 uppercase tracking-widest block">{t("selectedRoute")}</span>
                           <div className="space-y-1 mt-1">
                             <div className="flex items-center gap-2">
                               <div className="w-2 h-2 rounded-full bg-green-500 shrink-0"></div>
                               <p className="text-slate-900 dark:text-white font-semibold text-xs sm:text-sm truncate">{formData.pickup || "Origen no especificado"}</p>
                             </div>
                             {formData.dropoff && (
                               <div className="flex items-center gap-2">
                                 <div className="w-2 h-2 rounded-full bg-red-500 shrink-0"></div>
                                 <p className="text-slate-900 dark:text-white font-semibold text-xs sm:text-sm truncate">{formData.dropoff}</p>
                               </div>
                             )}
                           </div>
                        </div>
                        <div className="text-right shrink-0">
                           <span className="text-[10px] sm:text-xs font-bold text-slate-400 dark:text-slate-400 uppercase tracking-widest block">{t("totalAmount")}</span>
                           <p className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white leading-none mt-1">{calculatePrice()}€</p>
                        </div>
                     </div>

                     {/* Trip badges */}
                     <div className="flex flex-wrap items-center gap-2 text-xs text-slate-600 dark:text-slate-300 pt-0.5">
                       {formData.date && (
                         <span className="inline-flex items-center gap-1 bg-white dark:bg-slate-900 px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700 font-medium">
                           <CalendarIcon className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                           {formData.date}
                         </span>
                       )}
                       {formData.time && (
                         <span className="inline-flex items-center gap-1 bg-white dark:bg-slate-900 px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700 font-medium">
                           <ClockIcon className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                           {formData.time}
                         </span>
                       )}
                       <span className="inline-flex items-center gap-1 bg-white dark:bg-slate-900 px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700 font-medium">
                         <Users className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                         {formData.passengers} {formData.passengers === 1 ? 'pasajero' : 'pasajeros'}
                       </span>
                     </div>
                  </div>
                  
                  {/* Payment Options */}
                  <div className="flex flex-col gap-2.5 sm:gap-3">
                    <span className="text-[10px] sm:text-xs font-bold text-slate-400 uppercase tracking-widest">{t("selectPayment")}</span>
                    
                    <button 
                      onClick={() => setPaymentMethod('tarjeta')}
                      className={`flex items-center p-3.5 sm:p-4 rounded-xl border-2 transition-all ${paymentMethod === 'tarjeta' ? 'border-blue-500 bg-blue-50/50 dark:bg-blue-950/30' : 'border-slate-100 dark:border-slate-800 hover:border-slate-300 bg-white dark:bg-slate-900'}`}
                    >
                      <div className={`w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center mr-3 sm:mr-4 shrink-0 ${paymentMethod === 'tarjeta' ? 'bg-blue-100 text-blue-600 dark:bg-blue-900/50 dark:text-blue-400' : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'}`}>
                        <CreditCard className="w-5 h-5" />
                      </div>
                      <div className="text-left flex-1 min-w-0">
                        <p className={`font-bold text-sm sm:text-base ${paymentMethod === 'tarjeta' ? 'text-blue-900 dark:text-blue-300' : 'text-slate-700 dark:text-slate-200'}`}>{t("card")}</p>
                        <p className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400 truncate">{t("cardDesc")}</p>
                      </div>
                      {paymentMethod === 'tarjeta' && <CheckCircle2 className="w-5 h-5 text-blue-500 shrink-0 ml-2" />}
                    </button>

                    <button 
                      onClick={() => setPaymentMethod('bizum')}
                      className={`flex items-center p-3.5 sm:p-4 rounded-xl border-2 transition-all ${paymentMethod === 'bizum' ? 'border-[#00c4b3] bg-[#00c4b3]/10 dark:bg-[#00c4b3]/20' : 'border-slate-100 dark:border-slate-800 hover:border-slate-300 bg-white dark:bg-slate-900'}`}
                    >
                      <div className={`w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center mr-3 sm:mr-4 shrink-0 ${paymentMethod === 'bizum' ? 'bg-[#00c4b3]/20 text-[#008f83] dark:text-[#00e6d2]' : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'}`}>
                        <Smartphone className="w-5 h-5" />
                      </div>
                      <div className="text-left flex-1 min-w-0">
                        <p className={`font-bold text-sm sm:text-base ${paymentMethod === 'bizum' ? 'text-[#008f83] dark:text-[#00e6d2]' : 'text-slate-700 dark:text-slate-200'}`}>{t("bizum")}</p>
                        <p className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400 truncate">{t("bizumDesc")}</p>
                      </div>
                      {paymentMethod === 'bizum' && <CheckCircle2 className="w-5 h-5 text-[#00c4b3] shrink-0 ml-2" />}
                    </button>

                    <button 
                      onClick={() => setPaymentMethod('efectivo')}
                      className={`flex items-center p-3.5 sm:p-4 rounded-xl border-2 transition-all ${paymentMethod === 'efectivo' ? 'border-green-500 bg-green-50/50 dark:bg-green-950/30' : 'border-slate-100 dark:border-slate-800 hover:border-slate-300 bg-white dark:bg-slate-900'}`}
                    >
                      <div className={`w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center mr-3 sm:mr-4 shrink-0 ${paymentMethod === 'efectivo' ? 'bg-green-100 text-green-600 dark:bg-green-900/50 dark:text-green-400' : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'}`}>
                        <Banknote className="w-5 h-5" />
                      </div>
                      <div className="text-left flex-1 min-w-0">
                        <p className={`font-bold text-sm sm:text-base ${paymentMethod === 'efectivo' ? 'text-green-900 dark:text-green-300' : 'text-slate-700 dark:text-slate-200'}`}>{t("cash")}</p>
                        <p className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400 truncate">{t("cashDesc")}</p>
                      </div>
                      {paymentMethod === 'efectivo' && <CheckCircle2 className="w-5 h-5 text-green-500 shrink-0 ml-2" />}
                    </button>
                  </div>
                </div>

                <div className="mt-auto pb-[calc(1.5rem+env(safe-area-inset-bottom))] sm:pb-[calc(2rem+env(safe-area-inset-bottom))] md:pb-[calc(1.5rem+env(safe-area-inset-bottom))]">
                  <div className="bg-[#0F172A] rounded-2xl md:rounded-3xl p-4 sm:p-6 md:p-8 flex flex-col items-center justify-between gap-4 sm:gap-5 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-[#FFD700] rounded-full opacity-20 pointer-events-none"></div>
                    
                    <div className="text-center w-full z-10">
                      <p className="text-white font-bold text-lg sm:text-xl">{t("confirmBooking")}</p>
                      <p className="text-slate-400 text-xs sm:text-sm mt-0.5">{t("confirmDesc")}</p>
                    </div>
                    
                    <button
                      onClick={submitReservation}
                      disabled={!paymentMethod || isSending}
                      className="w-full bg-[#FFD700] text-[#0F172A] font-bold py-3.5 sm:py-4 px-6 rounded-2xl hover:bg-[#F2CB00] active:scale-95 transition-all flex items-center justify-center gap-2 shadow-lg shadow-[#FFD700]/20 disabled:opacity-70 disabled:scale-100 text-base sm:text-lg"
                    >
                      {isSending ? (
                        <div className="w-6 h-6 border-2 border-[#0F172A]/30 border-t-[#0F172A] rounded-full animate-spin"></div>
                      ) : (
                        <>{t("sendRequest")} <ArrowRight className="w-5 h-5" /></>
                      )}
                    </button>
                  </div>

                  <div className="flex justify-center mt-4">
                     <button onClick={prevStep} disabled={isSending} className="flex text-slate-400 hover:text-slate-700 dark:text-slate-300 dark:hover:text-white font-bold items-center gap-2 transition-colors py-2 px-4 disabled:opacity-50 text-sm sm:text-base">
                       <ArrowLeft className="w-5 h-5" /> {t("back")}
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
                  <h1 className="text-3xl md:text-5xl font-extrabold text-slate-900 dark:text-white tracking-tight leading-tight">{t("requestWaiting")}</h1>
                  <p className="text-slate-600 dark:text-slate-300 text-lg md:text-xl font-medium max-w-md mx-auto leading-relaxed">
                    {t("requestReceived")} <span className="font-bold text-slate-900 dark:text-white">{t("adminMustAccept")}</span> {t("andConfirm")}
                  </p>
                  
                  <div className="pt-8 w-full flex flex-col items-center gap-4">
                    <div className="p-4 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl w-full max-w-xs flex flex-col items-center">
                      <p className="text-xs text-slate-500 dark:text-slate-400 uppercase font-bold tracking-wider mb-1">{t("yourId")}</p>
                      <p className="font-mono font-bold text-lg text-slate-900 dark:text-white">#{Math.random().toString(36).substr(2, 6).toUpperCase()}</p>
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

      
    </div>
  );
}
