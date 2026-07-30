const fs = require('fs');
let bContent = fs.readFileSync('src/components/BookingWizard.tsx', 'utf8');

bContent = bContent.replace('label="Destino"', 'label={t("toLabel")}');
bContent = bContent.replace('placeholder="Ej. Aeropuerto Adolfo Suárez"', 'placeholder={t("toPlaceholder")}');

fs.writeFileSync('src/components/BookingWizard.tsx', bContent);
console.log('BookingWizard translated 6');
