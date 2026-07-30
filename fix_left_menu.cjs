const fs = require('fs');
let bContent = fs.readFileSync('src/components/BookingWizard.tsx', 'utf8');

// The original left menu texts:
// "Horario" -> "Fecha y hora"
// "Detalles" -> "Paradas y notas"
// "Contacto" -> "{t("yourDetails")}"
// "Resumen" -> "Pago"

bContent = bContent.replace('>Horario</p>', '>{t("dateTime")}</p>');
bContent = bContent.replace('>Fecha y hora</p>', '>{t("whenTravel")}</p>');
bContent = bContent.replace('>Detalles</p>', '>{t("tripDetails")}</p>');
bContent = bContent.replace('>Paradas y notas</p>', '>{t("passengersNotes")}</p>');
bContent = bContent.replace('>Contacto</p>', '>{t("yourData")}</p>');
// Contact description is already {t("yourDetails")}
bContent = bContent.replace('>Resumen</p>', '>{t("summary")}</p>');
bContent = bContent.replace('>Pago</p>', '>{t("paymentProcess")}</p>');

fs.writeFileSync('src/components/BookingWizard.tsx', bContent);
console.log('Left menu fixed');
