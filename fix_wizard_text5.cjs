const fs = require('fs');
let bContent = fs.readFileSync('src/components/BookingWizard.tsx', 'utf8');

bContent = bContent.replace('>Fecha</label>', '>{t("dateLabel")}</label>');
bContent = bContent.replace('>Hora</label>', '>{t("timeLabel")}</label>');

fs.writeFileSync('src/components/BookingWizard.tsx', bContent);
console.log('BookingWizard translated 5');
