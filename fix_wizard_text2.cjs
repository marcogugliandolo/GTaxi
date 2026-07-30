const fs = require('fs');

let bContent = fs.readFileSync('src/components/BookingWizard.tsx', 'utf8');

bContent = bContent.replace('>Nombre y apellidos</label>', '>{t("nameLabel")}</label>');
bContent = bContent.replace('>Pasajeros</label>', '>{t("passengersLabel")}</label>');

fs.writeFileSync('src/components/BookingWizard.tsx', bContent);
console.log('BookingWizard translated 2');
