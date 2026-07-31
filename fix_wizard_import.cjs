const fs = require('fs');

let content = fs.readFileSync('src/components/BookingWizard.tsx', 'utf8');

content = content.replace("const AdminPanel = React.lazy(() => import('./AdminPanel'));", "");

fs.writeFileSync('src/components/BookingWizard.tsx', content);
