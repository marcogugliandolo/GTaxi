const fs = require('fs');

let tContent = fs.readFileSync('src/i18n/translations.ts', 'utf8');
tContent = tContent.replace("slogan: 'Llega a tiempo. Viaja seguro.',", "slogan1: 'Tu viaje premium,', slogan2: 'a un solo toque.',");
tContent = tContent.replace("slogan: 'On time. Safe travels.',", "slogan1: 'Your premium ride,', slogan2: 'just one tap away.',");

tContent = tContent.replace("heroFeatures: 'Disponible 24/7 • Precios fijos • Conductores verificados',", "heroFeatures: 'Reserva tu GTaxi al instante. Indica tus paradas, paga cómodamente y espera la confirmación de nuestro equipo.',");
tContent = tContent.replace("heroFeatures: 'Available 24/7 • Fixed prices • Verified drivers',", "heroFeatures: 'Book your GTaxi instantly. Indicate your stops, pay comfortably and wait for our team\\'s confirmation.',");
fs.writeFileSync('src/i18n/translations.ts', tContent);

let bContent = fs.readFileSync('src/components/BookingWizard.tsx', 'utf8');
bContent = bContent.replace('{t("slogan")}', '{t("slogan1")} <br /> {t("slogan2")}');
fs.writeFileSync('src/components/BookingWizard.tsx', bContent);
console.log('Intro text fixed');
