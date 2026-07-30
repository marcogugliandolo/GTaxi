const fs = require('fs');
let content = fs.readFileSync('src/components/BookingWizard.tsx', 'utf8');
content = content.replace("import { \n  MapPin", "import { \n  Moon, \n  Sun,\n  MapPin");
fs.writeFileSync('src/components/BookingWizard.tsx', content);
