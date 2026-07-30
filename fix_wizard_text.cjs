const fs = require('fs');

let bContent = fs.readFileSync('src/components/BookingWizard.tsx', 'utf8');

bContent = bContent.replace('>Detalles del Viaje</h1>', '>{t("tripDetails")}</h1>');
bContent = bContent.replace('>Pasajeros y observaciones importantes.</p>', '>{t("passengersNotes")}</p>');
bContent = bContent.replace('>Paradas / Notas para el conductor (Opcional)</label>', '>{t("stopsNotes")}</label>');
bContent = bContent.replace('>Tus Datos</h1>', '>{t("yourData")}</h1>');
bContent = bContent.replace('>Para contactarte y confirmar el viaje.</p>', '>{t("contactConfirm")}</p>');
bContent = bContent.replace('>Proceso de Pago</h1>', '>{t("paymentProcess")}</h1>');
bContent = bContent.replace('>Revisa tu importe y método de pago</p>', '>{t("reviewPayment")}</p>');
bContent = bContent.replace('>Ruta Seleccionada</span>', '>{t("selectedRoute")}</span>');
bContent = bContent.replace('>Importe Total</span>', '>{t("totalAmount")}</span>');

fs.writeFileSync('src/components/BookingWizard.tsx', bContent);
console.log('BookingWizard translated');
