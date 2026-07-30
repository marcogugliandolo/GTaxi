const fs = require('fs');
let bContent = fs.readFileSync('src/components/BookingWizard.tsx', 'utf8');

bContent = bContent.replace('>Resumen y confirmación</p>', '>{t("summaryConfirm")}</p>');
bContent = bContent.replace('>Servicio Seguro</p>', '>{t("secureService")}</p>');
bContent = bContent.replace('>Reserva y espera confirmación</p>', '>{t("bookAndWait")}</p>');
bContent = bContent.replace('>Selecciona la fecha y hora de recogida.</p>', '>{t("selectDateTime")}</p>');
bContent = bContent.replace('>Busca la ciudad, calle o estación. (Origen/Destino)</p>', '>{t("searchCity")}</p>');

fs.writeFileSync('src/components/BookingWizard.tsx', bContent);

let tContent = fs.readFileSync('src/i18n/translations.ts', 'utf8');

tContent = tContent.replace("errorProcessing: 'Hubo un error al procesar tu solicitud. Por favor intenta de nuevo.',", "errorProcessing: 'Hubo un error al procesar tu solicitud. Por favor intenta de nuevo.',\n    summaryConfirm: 'Resumen y confirmación',\n    secureService: 'Servicio Seguro',\n    bookAndWait: 'Reserva y espera confirmación',\n    selectDateTime: 'Selecciona la fecha y hora de recogida.',\n    searchCity: 'Busca la ciudad, calle o estación. (Origen/Destino)',");

tContent = tContent.replace("errorProcessing: 'There was an error processing your request. Please try again.',", "errorProcessing: 'There was an error processing your request. Please try again.',\n    summaryConfirm: 'Summary and confirmation',\n    secureService: 'Secure Service',\n    bookAndWait: 'Book and wait for confirmation',\n    selectDateTime: 'Select the pickup date and time.',\n    searchCity: 'Search city, street or station. (Origin/Destination)',");

fs.writeFileSync('src/i18n/translations.ts', tContent);
console.log('BookingWizard translated 4');
