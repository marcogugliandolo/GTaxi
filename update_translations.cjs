const fs = require('fs');

let tContent = fs.readFileSync('src/i18n/translations.ts', 'utf8');

// Add new keys to 'es'
tContent = tContent.replace("yourDetails: 'Tus datos',", "tripDetails: 'Detalles del Viaje',\n    passengersNotes: 'Pasajeros y observaciones importantes.',\n    stopsNotes: 'Paradas / Notas para el conductor (Opcional)',\n    yourData: 'Tus Datos',\n    contactConfirm: 'Para contactarte y confirmar el viaje.',\n    paymentProcess: 'Proceso de Pago',\n    reviewPayment: 'Revisa tu importe y método de pago',\n    selectedRoute: 'Ruta Seleccionada',\n    totalAmount: 'Importe Total',\n    yourDetails: 'Tus datos',");

// Add new keys to 'en'
tContent = tContent.replace("yourDetails: 'Your details',", "tripDetails: 'Trip Details',\n    passengersNotes: 'Passengers and important notes.',\n    stopsNotes: 'Stops / Notes for the driver (Optional)',\n    yourData: 'Your Data',\n    contactConfirm: 'To contact you and confirm the trip.',\n    paymentProcess: 'Payment Process',\n    reviewPayment: 'Review your amount and payment method',\n    selectedRoute: 'Selected Route',\n    totalAmount: 'Total Amount',\n    yourDetails: 'Your details',");

fs.writeFileSync('src/i18n/translations.ts', tContent);
console.log('Translations updated');
