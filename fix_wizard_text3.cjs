const fs = require('fs');

let bContent = fs.readFileSync('src/components/BookingWizard.tsx', 'utf8');

bContent = bContent.replace(/Continuar <ArrowRight/g, '{t("continue")} <ArrowRight');
bContent = bContent.replace(/Resumen y Pago <ArrowRight/g, '{t("summary")} <ArrowRight');

fs.writeFileSync('src/components/BookingWizard.tsx', bContent);
console.log('BookingWizard translated 3');
