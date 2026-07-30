const fs = require('fs');

let tContent = fs.readFileSync('src/i18n/translations.ts', 'utf8');
tContent = tContent.replace("errorProcessing: 'Hubo un error al procesar tu solicitud. Por favor intenta de nuevo.',", "errorProcessing: 'Hubo un error al procesar tu solicitud. Por favor intenta de nuevo.',\n    useCurrentLocation: 'Usar mi ubicación actual',\n    noGeoSupport: 'Tu navegador no soporta geolocalización',\n    noLocationAccess: 'No se pudo acceder a tu ubicación. Por favor, revisa los permisos.',\n    noLocationFound: 'No se pudo obtener la dirección de tu ubicación.',");
tContent = tContent.replace("errorProcessing: 'There was an error processing your request. Please try again.',", "errorProcessing: 'There was an error processing your request. Please try again.',\n    useCurrentLocation: 'Use my current location',\n    noGeoSupport: 'Your browser does not support geolocation',\n    noLocationAccess: 'Could not access your location. Please check your permissions.',\n    noLocationFound: 'Could not get the address for your location.',");
fs.writeFileSync('src/i18n/translations.ts', tContent);

let aContent = fs.readFileSync('src/components/AddressInput.tsx', 'utf8');
if (!aContent.includes('useLanguage')) {
  aContent = aContent.replace(
    "import { LocationData } from '../types';", 
    "import { LocationData } from '../types';\nimport { useLanguage } from '../contexts/LanguageContext';"
  );
  aContent = aContent.replace(
    "export default function AddressInput({ label, placeholder, value, onChange, onLocationSelect, dotColorClass, allowCurrentLocation = false }: AddressInputProps) {",
    "export default function AddressInput({ label, placeholder, value, onChange, onLocationSelect, dotColorClass, allowCurrentLocation = false }: AddressInputProps) {\n  const { t } = useLanguage();"
  );
  aContent = aContent.replace(
    "alert('Tu navegador no soporta geolocalización');",
    "alert(t('noGeoSupport'));"
  );
  aContent = aContent.replace(
    "alert('No se pudo acceder a tu ubicación. Por favor, revisa los permisos.');",
    "alert(t('noLocationAccess'));"
  );
  aContent = aContent.replace(
    "alert('No se pudo obtener la dirección de tu ubicación.');",
    "alert(t('noLocationFound'));"
  );
  aContent = aContent.replace(
    "Usar mi ubicación actual",
    "{t('useCurrentLocation')}"
  );
  fs.writeFileSync('src/components/AddressInput.tsx', aContent);
  console.log('AddressInput fixed');
}
