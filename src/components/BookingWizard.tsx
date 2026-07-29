import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Users, 
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  Send,
  CarFront
} from 'lucide-react';
import { BookingData } from '../types';
import AddressInput from './AddressInput';
import AdminPanel from './AdminPanel';

const INITIAL_DATA: BookingData = {
  pickup: '',
  dropoff: '',
  date: '',
  time: '',
  passengers: 1,
  name: '',
  phone: '',
  notes: '',
};

export default function BookingWizard() {
  const [step, setStep] = useState(0);
  const [direction, setDirection] = useState(1);
  const [formData, setFormData] = useState<BookingData>(INITIAL_DATA);
  const [isSending, setIsSending] = useState<boolean>(false);
  
  const [showAdmin, setShowAdmin] = useState(false);
  const [whatsappNumber, setWhatsappNumber] = useState("34600000000");
  const [telegramUsername, setTelegramUsername] = useState("tu_usuario_taxi");

  useEffect(() => {
    fetch('/api/settings')
      .then(res => res.json())
      .then(data => {
        if (data.gtaxi_wa) setWhatsappNumber(data.gtaxi_wa);
        if (data.gtaxi_tg) setTelegramUsername(data.gtaxi_tg);
      })
      .catch(err => console.error(err));
  }, []);

  const handleUpdateSettings = async (wa: string, tg: string) => {
    setWhatsappNumber(wa);
    setTelegramUsername(tg);
    await fetch('/api/settings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ whatsapp: wa, telegram: tg })
    });
  };

  const updateForm = (fields: Partial<BookingData>) => {
    setFormData((prev) => ({ ...prev, ...fields }));
  };

  const nextStep = () => {
    setDirection(1);
    setStep((prev) => prev + 1);
  };

  const prevStep = () => {
    setDirection(-1);
    setStep((prev) => prev - 1);
  };

  const generateMessage = () => {
    return `🚕 *NUEVA RESERVA DE GTaxi* 🚕

📍 *Origen:* ${formData.pickup}
🏁 *Destino:* ${formData.dropoff}
📅 *Fecha:* ${formData.date}
⏰ *Hora:* ${formData.time}
👥 *Pasajeros:* ${formData.passengers}

👤 *Nombre:* ${formData.name}
📱 *Teléfono:* ${formData.phone}
📝 *Notas:* ${formData.notes || 'Ninguna'}

Por favor, confirmar disponibilidad. ¡Gracias!`;
  };

  const saveReservation = async () => {
    const newReservation: BookingData = {
      ...formData,
      id: Math.random().toString(36).substr(2, 9),
      status: 'pending',
      createdAt: Date.now()
    };
    try {
      await fetch('/api/reservations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newReservation)
      });
    } catch (e) {
      console.error(e);
    }
  };

  const submitReservation = async () => {
    setIsSending(true);
    await saveReservation();
    setIsSending(false);
    setStep(5);
  };

  const slideVariants = {
    enter: (direction: number) => ({
      x: direction > 0 ? '10%' : '-10%',
      opacity: 0,
    }),
    center: {
      x: 0,
      opacity: 1,
      transition: { duration: 0.25, ease: 'easeOut' },
    },
    exit: (direction: number) => ({
      x: direction < 0 ? '10%' : '-10%',
      opacity: 0,
      transition: { duration: 0.2, ease: 'easeIn' },
    }),
  };

  const isStep1Valid = formData.pickup.trim() !== '' && formData.dropoff.trim() !== '';
  const isStep2Valid = formData.date !== '' && formData.time !== '';
  const isStep3Valid = formData.name.trim() !== '' && formData.phone.trim() !== '';

  return (
    <div className="flex w-full h-[100dvh] bg-white overflow-hidden">
      
      {/* LEFT PANEL - DESKTOP ONLY */}
      <div className="hidden md:flex md:w-[45%] lg:w-[40%] bg-[#0F172A] relative flex-col justify-between p-12 overflow-hidden border-r border-slate-800">
        {/* Abstract Background Effects */}
        <div className="absolute inset-0 opacity-10 pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '32px 32px' }}></div>
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-[#FFD700] rounded-full blur-[120px] opacity-20 pointer-events-none"></div>
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-blue-500 rounded-full blur-[120px] opacity-10 pointer-events-none"></div>

        {/* Brand Logo */}
        <div className="relative z-10 flex items-center gap-4 cursor-pointer hover:opacity-90 transition-opacity" onClick={() => setShowAdmin(true)}>
          <div className="relative w-14 h-14 bg-[#FFD700] rounded-2xl flex items-center justify-center shadow-[0_8px_24px_rgba(255,215,0,0.3)]">
            <CarFront className="w-8 h-8 text-slate-900" strokeWidth={2.5} />
          </div>
          <span className="text-4xl font-extrabold tracking-tight text-white">GTaxi</span>
        </div>

        {/* Vertical Stepper */}
        <div className="relative z-10 flex-1 flex flex-col justify-center mt-12 space-y-12">
          {/* Step 1 */}
          <div className={`flex items-center gap-6 transition-all duration-500 ${step >= 1 ? (step === 1 ? 'opacity-100 translate-x-2' : 'opacity-100') : 'opacity-30'}`}>
             <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg transition-colors duration-500 ${step === 1 ? 'bg-[#FFD700] text-slate-900 shadow-[0_0_20px_rgba(255,215,0,0.3)]' : step > 1 ? 'bg-green-400 text-slate-900' : 'border-2 border-slate-600 text-slate-400'}`}>
               {step > 1 ? <CheckCircle2 className="w-6 h-6"/> : '1'}
             </div>
             <div>
                <p className="text-xl font-bold text-white mb-1">Tu Ruta</p>
                <p className="text-sm text-slate-400">Origen y destino</p>
             </div>
          </div>
          {/* Step 2 */}
          <div className={`flex items-center gap-6 transition-all duration-500 ${step >= 2 ? (step === 2 ? 'opacity-100 translate-x-2' : 'opacity-100') : 'opacity-30'}`}>
             <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg transition-colors duration-500 ${step === 2 ? 'bg-[#FFD700] text-slate-900 shadow-[0_0_20px_rgba(255,215,0,0.3)]' : step > 2 ? 'bg-green-400 text-slate-900' : 'border-2 border-slate-600 text-slate-400'}`}>
               {step > 2 ? <CheckCircle2 className="w-6 h-6"/> : '2'}
             </div>
             <div>
                <p className="text-xl font-bold text-white mb-1">Horario</p>
                <p className="text-sm text-slate-400">Fecha y cantidad</p>
             </div>
          </div>
          {/* Step 3 & 4 */}
          <div className={`flex items-center gap-6 transition-all duration-500 ${step >= 3 ? (step === 3 || step === 4 ? 'opacity-100 translate-x-2' : 'opacity-100') : 'opacity-30'}`}>
             <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg transition-colors duration-500 ${step >= 3 ? 'bg-[#FFD700] text-slate-900 shadow-[0_0_20px_rgba(255,215,0,0.3)]' : 'border-2 border-slate-600 text-slate-400'}`}>
               {step === 4 ? <CheckCircle2 className="w-6 h-6"/> : '3'}
             </div>
             <div>
                <p className="text-xl font-bold text-white mb-1">Confirmar</p>
                <p className="text-sm text-slate-400">Datos y envío</p>
             </div>
          </div>
        </div>

        {/* Feature Banner */}
        <div className="relative z-10 bg-white/5 border border-white/10 p-6 rounded-3xl backdrop-blur-md">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-slate-800/80 flex items-center justify-center border border-slate-700">
              <CheckCircle2 className="w-6 h-6 text-green-400" />
            </div>
            <div>
              <p className="text-xs text-[#FFD700] uppercase tracking-widest font-bold mb-1">Servicio Premium</p>
              <p className="text-sm font-medium text-slate-300">Reserva y confirmación inmediata</p>
            </div>
          </div>
        </div>
      </div>

      {/* RIGHT PANEL - MAIN CONTENT */}
      <div className="flex-1 relative flex flex-col min-w-0 bg-slate-50 md:bg-white h-[100dvh] overflow-y-auto overflow-x-hidden">
        
        {/* Mobile Header (Hidden on Step 0 and Desktop) */}
        {step > 0 && (
          <div className="md:hidden bg-white px-6 py-4 border-b border-slate-100 sticky top-0 z-20 flex items-center justify-between shadow-sm">
            <div className="flex items-center gap-3">
              <button onClick={prevStep} className="p-2 -ml-2 rounded-full hover:bg-slate-100 text-slate-500 transition-colors">
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div className="flex items-center gap-2 cursor-pointer hover:opacity-80 transition-opacity" onClick={() => setShowAdmin(true)}>
                <div className="relative w-8 h-8 bg-[#FFD700] rounded-lg flex items-center justify-center shadow-sm">
                  <CarFront className="w-5 h-5 text-slate-900" strokeWidth={2.5} />
                </div>
                <span className="font-bold text-slate-900 tracking-tight text-lg">GTaxi</span>
              </div>
            </div>
            <span className="text-xs font-bold text-slate-500 bg-slate-100 px-3 py-1.5 rounded-full">Paso {step}/4</span>
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
                {/* Mobile Background Elements */}
                <div className="absolute inset-0 overflow-hidden md:hidden pointer-events-none">
                  <div className="absolute -top-[10%] -right-[20%] w-[80%] h-[60%] rounded-full bg-[#FFD700] blur-[150px] opacity-20" />
                  <div className="absolute -bottom-[20%] -left-[10%] w-[70%] h-[50%] rounded-full bg-blue-500 blur-[150px] opacity-10" />
                </div>

                <div className="relative z-10 w-full max-w-xl mx-auto flex flex-col items-center md:items-start text-center md:text-left pt-12 md:pt-0">
                  
                  {/* Mobile Logo */}
                  <div 
                    className="md:hidden relative w-24 h-24 bg-[#FFD700] rounded-[2rem] flex items-center justify-center shadow-[0_12px_32px_rgba(255,215,0,0.3)] mb-10 cursor-pointer hover:scale-105 transition-transform"
                    onClick={() => setShowAdmin(true)}
                  >
                    <CarFront className="w-12 h-12 text-slate-900" strokeWidth={2.5} />
                  </div>
                  
                  <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold text-white md:text-slate-900 mb-6 tracking-tight leading-tight">
                    Tu viaje premium, <br /> a un solo toque.
                  </h1>
                  <p className="text-slate-400 md:text-slate-500 mb-12 text-lg md:text-xl max-w-md leading-relaxed font-medium">
                    Reserva tu GTaxi en menos de 2 minutos. Comodidad, rapidez y seguridad en cada trayecto.
                  </p>
                  <button
                    onClick={nextStep}
                    className="w-full sm:w-auto sm:px-16 bg-[#FFD700] text-black font-bold text-lg py-5 rounded-2xl hover:bg-[#F2CB00] active:scale-95 transition-all flex items-center justify-center gap-3 shadow-xl shadow-[#FFD700]/20"
                  >
                    Comenzar Reserva <ArrowRight className="w-6 h-6" />
                  </button>
                </div>
              </motion.div>
            )}

            {/* STEP 1: ROUTE */}
            {step === 1 && (
              <motion.div key="step1" custom={direction} variants={slideVariants} initial="enter" animate="center" exit="exit" className="flex flex-col min-h-full w-full max-w-2xl mx-auto px-4 py-6 md:p-12 lg:p-16">
                <div className="pt-4 md:pt-0 pb-6 md:pb-12">
                   <h2 className="text-2xl md:text-4xl font-extrabold text-slate-900 tracking-tight">¿De dónde a dónde?</h2>
                   <p className="text-slate-500 mt-1 md:mt-2 text-sm md:text-base font-medium">Indícanos tu punto de partida y destino.</p>
                </div>
                
                <div className="space-y-6 md:space-y-8 flex-1">
                  <AddressInput
                    label="Punto de Partida"
                    placeholder="Ej: Aeropuerto Internacional"
                    value={formData.pickup}
                    onChange={(val) => updateForm({ pickup: val })}
                    dotColorClass="bg-green-500 ring-4 ring-green-100"
                    allowCurrentLocation={true}
                  />

                  <AddressInput
                    label="Destino Final"
                    placeholder="Ej: Hotel NH Collection"
                    value={formData.dropoff}
                    onChange={(val) => updateForm({ dropoff: val })}
                    dotColorClass="bg-red-500 ring-4 ring-red-100"
                  />
                </div>

                <div className="pb-6 pt-8 mt-auto flex flex-col md:flex-row-reverse items-center justify-between gap-4">
                  <button
                    onClick={nextStep}
                    disabled={!isStep1Valid}
                    className="w-full md:w-auto md:px-12 bg-[#FFD700] text-black disabled:opacity-50 disabled:pointer-events-none font-bold text-lg py-5 rounded-2xl shadow-lg hover:shadow-xl active:scale-95 transition-all flex items-center justify-center gap-3"
                  >
                    Continuar <ArrowRight className="w-5 h-5" />
                  </button>
                  <button onClick={prevStep} className="hidden md:flex text-slate-400 hover:text-slate-700 font-bold items-center gap-2 transition-colors py-4 px-2">
                    <ArrowLeft className="w-5 h-5" /> Volver
                  </button>
                </div>
              </motion.div>
            )}

            {/* STEP 2: DATE & TIME */}
            {step === 2 && (
              <motion.div key="step2" custom={direction} variants={slideVariants} initial="enter" animate="center" exit="exit" className="flex flex-col min-h-full w-full max-w-2xl mx-auto px-4 py-6 md:p-12 lg:p-16">
                <div className="pt-4 md:pt-0 pb-6 md:pb-12">
                   <h2 className="text-2xl md:text-4xl font-extrabold text-slate-900 tracking-tight">¿Cuándo viajamos?</h2>
                   <p className="text-slate-500 mt-1 md:mt-2 text-sm md:text-base font-medium">Programa tu viaje para cuando lo necesites.</p>
                </div>
                
                <div className="space-y-6 md:space-y-8 flex-1">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-6">
                    <div className="space-y-2 md:space-y-3 w-full">
                      <label className="text-xs md:text-sm font-bold text-slate-700 uppercase tracking-wide ml-1">Fecha</label>
                      <input
                        type="date"
                        value={formData.date}
                        onChange={(e) => updateForm({ date: e.target.value })}
                        className="w-full px-3 md:px-6 py-3.5 md:py-5 bg-white border-2 border-slate-100 focus:ring-4 focus:ring-[#FFD700]/20 focus:border-[#FFD700] rounded-xl md:rounded-2xl outline-none text-slate-900 text-sm md:text-lg transition-all shadow-sm min-w-0"
                      />
                    </div>
                    <div className="space-y-2 md:space-y-3 w-full">
                      <label className="text-xs md:text-sm font-bold text-slate-700 uppercase tracking-wide ml-1">Hora</label>
                      <input
                        type="time"
                        value={formData.time}
                        onChange={(e) => updateForm({ time: e.target.value })}
                        className="w-full px-3 md:px-6 py-3.5 md:py-5 bg-white border-2 border-slate-100 focus:ring-4 focus:ring-[#FFD700]/20 focus:border-[#FFD700] rounded-xl md:rounded-2xl outline-none text-slate-900 text-sm md:text-lg transition-all shadow-sm min-w-0"
                      />
                    </div>
                  </div>

                  <div className="space-y-2 md:space-y-3">
                    <label className="text-xs md:text-sm font-bold text-slate-700 uppercase tracking-wide ml-1">Pasajeros</label>
                    <div className="flex items-center justify-between bg-white border-2 border-slate-100 rounded-xl md:rounded-2xl p-2 md:p-3 shadow-sm">
                      <button
                        onClick={() => updateForm({ passengers: Math.max(1, formData.passengers - 1) })}
                        className="w-12 h-12 md:w-14 md:h-14 bg-slate-50 rounded-lg md:rounded-xl flex items-center justify-center text-xl md:text-2xl font-bold text-slate-700 hover:bg-slate-100 transition-colors border border-slate-200"
                      >
                        -
                      </button>
                      <div className="flex items-center gap-2 md:gap-3">
                        <Users className="w-5 h-5 md:w-6 md:h-6 text-slate-400" />
                        <span className="text-2xl md:text-3xl font-black text-slate-900">{formData.passengers}</span>
                      </div>
                      <button
                        onClick={() => updateForm({ passengers: Math.min(8, formData.passengers + 1) })}
                        className="w-12 h-12 md:w-14 md:h-14 bg-slate-50 rounded-lg md:rounded-xl flex items-center justify-center text-xl md:text-2xl font-bold text-slate-700 hover:bg-slate-100 transition-colors border border-slate-200"
                      >
                        +
                      </button>
                    </div>
                  </div>
                </div>

                <div className="pb-6 pt-8 mt-auto flex flex-col md:flex-row-reverse items-center justify-between gap-4">
                  <button
                    onClick={nextStep}
                    disabled={!isStep2Valid}
                    className="w-full md:w-auto md:px-12 bg-[#FFD700] text-black disabled:opacity-50 disabled:pointer-events-none font-bold text-lg py-5 rounded-2xl shadow-lg hover:shadow-xl active:scale-95 transition-all flex items-center justify-center gap-3"
                  >
                    Continuar <ArrowRight className="w-5 h-5" />
                  </button>
                  <button onClick={prevStep} className="hidden md:flex text-slate-400 hover:text-slate-700 font-bold items-center gap-2 transition-colors py-4 px-2">
                    <ArrowLeft className="w-5 h-5" /> Volver
                  </button>
                </div>
              </motion.div>
            )}

            {/* STEP 3: CONTACT DETAILS */}
            {step === 3 && (
              <motion.div key="step3" custom={direction} variants={slideVariants} initial="enter" animate="center" exit="exit" className="flex flex-col min-h-full w-full max-w-2xl mx-auto px-4 py-6 md:p-12 lg:p-16">
                <div className="pt-4 md:pt-0 pb-6 md:pb-12">
                   <h2 className="text-2xl md:text-4xl font-extrabold text-slate-900 tracking-tight">Tus datos</h2>
                   <p className="text-slate-500 mt-1 md:mt-2 text-sm md:text-base font-medium">¿Cómo nos pondremos en contacto contigo?</p>
                </div>
                
                <div className="space-y-4 md:space-y-6 flex-1">
                  <div className="space-y-2 md:space-y-3">
                    <label className="text-xs md:text-sm font-bold text-slate-700 uppercase tracking-wide ml-1">Nombre y apellidos</label>
                    <input
                      type="text"
                      placeholder="Ej. Juan Pérez"
                      value={formData.name}
                      onChange={(e) => updateForm({ name: e.target.value })}
                      className="w-full bg-white border-2 border-slate-100 focus:ring-4 focus:ring-[#FFD700]/20 focus:border-[#FFD700] rounded-xl md:rounded-2xl py-3.5 md:py-5 px-4 md:px-6 text-slate-900 text-base md:text-lg outline-none transition-all placeholder:text-slate-400 shadow-sm"
                    />
                  </div>

                  <div className="space-y-2 md:space-y-3">
                    <label className="text-xs md:text-sm font-bold text-slate-700 uppercase tracking-wide ml-1">Teléfono</label>
                    <input
                      type="tel"
                      placeholder="Ej. 600 000 000"
                      value={formData.phone}
                      onChange={(e) => updateForm({ phone: e.target.value })}
                      className="w-full bg-white border-2 border-slate-100 focus:ring-4 focus:ring-[#FFD700]/20 focus:border-[#FFD700] rounded-xl md:rounded-2xl py-3.5 md:py-5 px-4 md:px-6 text-slate-900 text-base md:text-lg outline-none transition-all placeholder:text-slate-400 shadow-sm"
                    />
                  </div>

                  <div className="space-y-2 md:space-y-3">
                    <label className="text-xs md:text-sm font-bold text-slate-700 uppercase tracking-wide ml-1">Notas especiales (Opcional)</label>
                    <textarea
                      placeholder="¿Equipaje extra? ¿Mascotas?..."
                      value={formData.notes}
                      onChange={(e) => updateForm({ notes: e.target.value })}
                      rows={3}
                      className="w-full bg-white border-2 border-slate-100 focus:ring-4 focus:ring-[#FFD700]/20 focus:border-[#FFD700] rounded-xl md:rounded-2xl py-3.5 md:py-5 px-4 md:px-6 text-slate-900 text-base md:text-lg outline-none transition-all placeholder:text-slate-400 shadow-sm resize-none"
                    />
                  </div>
                </div>

                <div className="pb-6 pt-8 mt-auto flex flex-col md:flex-row-reverse items-center justify-between gap-4">
                  <button
                    onClick={nextStep}
                    disabled={!isStep3Valid}
                    className="w-full md:w-auto md:px-12 bg-[#FFD700] text-black disabled:opacity-50 disabled:pointer-events-none font-bold text-lg py-5 rounded-2xl shadow-lg hover:shadow-xl active:scale-95 transition-all flex items-center justify-center gap-3"
                  >
                    Revisar Reserva <ArrowRight className="w-5 h-5" />
                  </button>
                  <button onClick={prevStep} className="hidden md:flex text-slate-400 hover:text-slate-700 font-bold items-center gap-2 transition-colors py-4 px-2">
                    <ArrowLeft className="w-5 h-5" /> Volver
                  </button>
                </div>
              </motion.div>
            )}

            {/* STEP 4: SUMMARY */}
            {step === 4 && (
              <motion.div key="step4" custom={direction} variants={slideVariants} initial="enter" animate="center" exit="exit" className="flex flex-col min-h-full w-full max-w-2xl mx-auto px-4 py-6 md:p-12 lg:p-16">
                
                <div className="text-center mb-6 md:mb-8 pt-4 md:pt-0">
                  <div className="w-16 h-16 md:w-20 md:h-20 bg-green-50 text-green-500 rounded-full flex items-center justify-center mx-auto mb-4 md:mb-6 border-4 border-green-100">
                    <CheckCircle2 className="w-8 h-8 md:w-10 md:h-10" />
                  </div>
                  <h1 className="text-2xl md:text-4xl font-extrabold text-slate-900 tracking-tight">Resumen de Viaje</h1>
                  <p className="text-slate-500 mt-1 md:mt-2 text-sm md:text-lg font-medium">Confirma tus datos antes de enviar la solicitud</p>
                </div>
                
                <div className="bg-white rounded-2xl md:rounded-3xl p-5 md:p-8 space-y-5 md:space-y-6 flex-shrink-0 mb-6 md:mb-8 border border-slate-200 shadow-lg shadow-slate-200/40">
                  <div className="flex flex-col gap-2 md:gap-3">
                    <span className="text-[10px] md:text-xs font-bold text-slate-400 uppercase tracking-widest">Ruta</span>
                    <div className="flex items-start gap-3 md:gap-4">
                       <div className="mt-1.5 w-2.5 h-2.5 md:w-3 md:h-3 rounded-full bg-green-500 ring-4 ring-green-100 flex-shrink-0"></div>
                       <p className="text-slate-900 font-semibold text-base md:text-lg leading-tight">{formData.pickup}</p>
                    </div>
                    <div className="w-0.5 h-4 md:h-6 bg-slate-200 ml-1 md:ml-1.5 rounded-full"></div>
                    <div className="flex items-start gap-3 md:gap-4">
                       <div className="mt-1.5 w-2.5 h-2.5 md:w-3 md:h-3 rounded-full bg-red-500 ring-4 ring-red-100 flex-shrink-0"></div>
                       <p className="text-slate-900 font-semibold text-base md:text-lg leading-tight">{formData.dropoff}</p>
                    </div>
                  </div>
                  
                  <div className="h-px bg-slate-100 w-full" />
                  
                  <div className="flex flex-col gap-1 md:gap-2">
                    <span className="text-[10px] md:text-xs font-bold text-slate-400 uppercase tracking-widest">Horario y Pasajeros</span>
                    <div className="flex items-center gap-2 md:gap-4 mt-1">
                      <p className="text-slate-900 font-bold text-lg md:text-xl">{formData.date} <span className="text-slate-400 font-medium px-2">•</span> {formData.time}</p>
                    </div>
                    <p className="text-slate-600 flex items-center gap-2 mt-1 text-sm md:text-base">
                       <Users className="w-4 h-4"/> {formData.passengers} Pasajero{formData.passengers > 1 ? 's' : ''}
                    </p>
                  </div>
                  
                  <div className="h-px bg-slate-100 w-full" />
                  
                  <div className="flex flex-col gap-1 md:gap-2">
                    <span className="text-[10px] md:text-xs font-bold text-slate-400 uppercase tracking-widest">Contacto</span>
                    <p className="text-slate-900 font-bold text-base md:text-lg mt-1">{formData.name}</p>
                    <p className="text-slate-600 text-sm md:text-base">{formData.phone}</p>
                    {formData.notes && (
                      <div className="mt-2 md:mt-3 p-3 md:p-4 bg-yellow-50 text-slate-700 rounded-lg md:rounded-xl text-xs md:text-sm italic border border-yellow-100">
                        "{formData.notes}"
                      </div>
                    )}
                  </div>
                </div>

                <div className="mt-auto pb-6">
                  <div className="bg-[#0F172A] rounded-2xl md:rounded-3xl p-5 md:p-8 flex flex-col items-center justify-between gap-5 md:gap-6 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-[#FFD700] rounded-full blur-[80px] opacity-20 pointer-events-none"></div>
                    
                    <div className="text-center w-full z-10">
                      <p className="text-white font-bold text-xl">Enviar Solicitud</p>
                      <p className="text-slate-400 text-sm mt-1">El conductor te confirmará al instante.</p>
                    </div>
                    
                    <div className="flex flex-col gap-3 w-full z-10">
                      <button
                        onClick={submitReservation}
                        disabled={isSending}
                        className="w-full bg-[#FFD700] text-[#0F172A] font-bold py-4 px-6 rounded-2xl hover:bg-[#F2CB00] active:scale-95 transition-all flex items-center justify-center gap-2 shadow-lg shadow-[#FFD700]/20 disabled:opacity-70 disabled:scale-100 text-lg"
                      >
                        {isSending ? (
                          <div className="w-6 h-6 border-2 border-[#0F172A]/30 border-t-[#0F172A] rounded-full animate-spin"></div>
                        ) : (
                          <><Send className="w-5 h-5" /> Enviar Solicitud</>
                        )}
                      </button>
                    </div>
                  </div>
                  
                  <div className="flex justify-center mt-6">
                     <button onClick={prevStep} className="flex text-slate-400 hover:text-slate-700 font-bold items-center gap-2 transition-colors py-2 px-4">
                       <ArrowLeft className="w-5 h-5" /> Volver a editar
                     </button>
                  </div>
                </div>
              </motion.div>
            )}

            {/* STEP 5: SUCCESS */}
            {step === 5 && (
              <motion.div key="step5" custom={direction} variants={slideVariants} initial="enter" animate="center" exit="exit" className="flex flex-col min-h-full w-full max-w-2xl mx-auto px-4 py-6 md:p-12 lg:p-16">
                <div className="flex-1 flex flex-col items-center justify-center text-center space-y-6">
                  <div className="w-24 h-24 bg-green-50 text-green-500 rounded-full flex items-center justify-center mx-auto mb-2 border-4 border-green-100">
                    <CheckCircle2 className="w-12 h-12" />
                  </div>
                  <h1 className="text-3xl md:text-5xl font-extrabold text-slate-900 tracking-tight leading-tight">¡Solicitud Enviada!</h1>
                  <p className="text-slate-500 text-lg md:text-xl font-medium max-w-md mx-auto">
                    Hemos recibido tu solicitud de viaje. En breve recibirás una confirmación por WhatsApp o Telegram.
                  </p>
                  
                  <div className="pt-8 w-full">
                    <button
                      onClick={() => {
                        setStep(0);
                        setFormData(INITIAL_DATA);
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
        <AdminPanel
          onClose={() => setShowAdmin(false)}
          onUpdateSettings={handleUpdateSettings}
          currentWhatsapp={whatsappNumber}
          currentTelegram={telegramUsername}
        />
      )}
    </div>
  );
}
