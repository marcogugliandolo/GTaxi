const fs = require('fs');

let content = fs.readFileSync('src/components/BookingWizard.tsx', 'utf8');

// Add import
if (!content.includes('useLanguage')) {
  content = content.replace(
    "import AddressInput from './AddressInput';",
    "import AddressInput from './AddressInput';\nimport { useLanguage } from '../contexts/LanguageContext';"
  );
}

// Add hook
if (!content.includes('const { t, language, setLanguage } = useLanguage();')) {
  content = content.replace(
    'export default function BookingWizard() {',
    'export default function BookingWizard() {\n  const { t, language, setLanguage } = useLanguage();\n'
  );
}

// Simple text replacements in JSX
const replacements = [
  ['Tu viaje premium, <br /> a un solo toque.', '{t("slogan")}'],
  ['Reserva tu GTaxi al instante. Indica tus paradas, paga cómodamente y espera la confirmación de nuestro equipo.', '{t("heroFeatures")}'],
  ['Comenzar Reserva', '{t("bookNow")}'],
  
  ['>Ruta</p>', '>{t("route")}</p>'],
  ['Origen y destino', '{t("whereTo")}'],
  ['>Fecha y Hora</p>', '>{t("dateTime")}</p>'],
  ['>Pasajeros</p>', '>{t("passengers")}</p>'],
  ['>Tus datos</p>', '>{t("yourDetails")}</p>'],
  ['>Resumen</p>', '>{t("summary")}</p>'],

  ['>¿A dónde vamos?</h1>', '>{t("whereTo")}</h1>'],
  ['Busca la ciudad, calle o estación.', 'Busca la ciudad, calle o estación. (Origen/Destino)'], // Simplified
  ['label="Punto de recogida"', 'label={t("fromLabel")}'],
  ['placeholder="Ej. Calle Gran Vía, Madrid"', 'placeholder={t("fromPlaceholder")}'],
  ['label="Destino final"', 'label={t("toLabel")}'],
  ['placeholder="Ej. Aeropuerto, Estación..."', 'placeholder={t("toPlaceholder")}'],

  ['>¿Cuándo viajas?</h1>', '>{t("whenTravel")}</h1>'],
  ['Elige la fecha y hora de tu traslado.', ''],
  ['>Fecha del viaje</label>', '>{t("dateLabel")}</label>'],
  ['>Hora de recogida</label>', '>{t("timeLabel")}</label>'],

  ['>¿Cuántos viajan?</h1>', '>{t("whoTravels")}</h1>'],
  ['>Número de pasajeros</label>', '>{t("passengersLabel")}</label>'],

  ['>Tus datos</h1>', '>{t("yourDetails")}</h1>'],
  ['>Nombre completo</label>', '>{t("nameLabel")}</label>'],
  ['placeholder="Ej. Juan Pérez"', 'placeholder={t("namePlaceholder")}'],
  ['>Teléfono</label>', '>{t("phoneLabel")}</label>'],
  ['placeholder="Ej. +34 600 000 000"', 'placeholder={t("phonePlaceholder")}'],
  ['>Notas adicionales (Opcional)</label>', '>{t("notesLabel")}</label>'],
  ['placeholder="Vuelo nº, equipaje especial, sillita de bebé..."', 'placeholder={t("notesPlaceholder")}'],

  ['>Resumen</h1>', '>{t("summary")}</h1>'],
  ['>Selecciona método de pago</span>', '>{t("selectPayment")}</span>'],
  ['>Tarjeta de Crédito / Débito</p>', '>{t("card")}</p>'],
  ['>Pago seguro procesado online</p>', '>{t("cardDesc")}</p>'],
  ['>Bizum</p>', '>{t("bizum")}</p>'],
  ['>Recibirás el número al confirmar</p>', '>{t("bizumDesc")}</p>'],
  ['>Efectivo al Conductor</p>', '>{t("cash")}</p>'],
  ['>Pago directo en el vehículo</p>', '>{t("cashDesc")}</p>'],
  
  ['>Confirmar Reserva</p>', '>{t("confirmBooking")}</p>'],
  ['>El importe será revisado por el administrador antes de ser definitivo.</p>', '>{t("confirmDesc")}</p>'],
  ['Enviar Solicitud', '{t("sendRequest")}'],
  ['Volver atrás', '{t("back")}'],
  ['>Siguiente <ArrowRight', '>{t("continue")} <ArrowRight'],
  
  ['>Solicitud en Espera</h1>', '>{t("requestWaiting")}</h1>'],
  ['Hemos recibido tu solicitud.', '{t("requestReceived")}'],
  ['Un administrador debe aceptar el viaje', '{t("adminMustAccept")}'],
  ['y confirmarlo a través de WhatsApp o llamada telefónica en los próximos minutos.', '{t("andConfirm")}'],
  ['>Tu identificador</p>', '>{t("yourId")}</p>'],
  ['>Volver al inicio</button>', '>{t("backHome")}</button>'],
  
  // ALERTS (These might be tricky with simple string replace in JSX vs Code)
  ["alert('Por favor, rellena todos los campos para continuar.')", "alert(t('fillFields'))"],
  ["alert('Por favor, selecciona una hora válida.')", "alert(t('selectValidDate'))"],
  ["alert('Hubo un error al procesar tu solicitud. Por favor intenta de nuevo.')", "alert(t('errorProcessing'))"]
];

replacements.forEach(([search, replace]) => {
  content = content.split(search).join(replace);
});

// Add a Language Toggle Button inside the mobile and desktop headers
const langToggleCode = `
<button onClick={() => setLanguage(language === 'es' ? 'en' : 'es')} className="absolute top-4 right-4 md:right-8 z-[60] bg-white/20 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/30 text-white font-bold text-sm shadow-lg hover:bg-white/30 transition-colors flex items-center gap-2">
  <span className={language === 'es' ? 'opacity-100' : 'opacity-50'}>ES</span>
  <span className="w-px h-3 bg-white/50"></span>
  <span className={language === 'en' ? 'opacity-100' : 'opacity-50'}>EN</span>
</button>
`;

if (!content.includes('setLanguage(language ===')) {
  // Put it before <div className="hidden md:flex... left panel" and in mobile step 0
  content = content.replace(
    '<div className="flex h-[100dvh] w-full bg-slate-50 font-sans overflow-hidden">',
    '<div className="flex h-[100dvh] w-full bg-slate-50 font-sans overflow-hidden">\n' + langToggleCode.replace('text-white', 'text-slate-900').replace('bg-white/20', 'bg-black/5').replace('border-white/30', 'border-black/10').replace('bg-white/50', 'bg-black/20')
  );
}

fs.writeFileSync('src/components/BookingWizard.tsx', content);
console.log('Replacements done.');
