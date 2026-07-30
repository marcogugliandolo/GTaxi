const fs = require('fs');
let content = fs.readFileSync('src/components/AdminPanel.tsx', 'utf8');

content = content.replace(
  'selectedReservation.price ? `€${selectedReservation.price.toFixed(2)}`',
  'selectedReservation.price ? `€${Number(selectedReservation.price).toFixed(2)}`'
);
content = content.replace(
  'actionConfirm.res.price ? `€${actionConfirm.res.price.toFixed(2)}`',
  'actionConfirm.res.price ? `€${Number(actionConfirm.res.price).toFixed(2)}`'
);

fs.writeFileSync('src/components/AdminPanel.tsx', content);
console.log('Price fixed');
