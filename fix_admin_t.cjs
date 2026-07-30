const fs = require('fs');
let content = fs.readFileSync('src/components/AdminPanel.tsx', 'utf8');

content = content.replace(
  'export default function AdminPanel({ onClose, onUpdateSettings, currentWhatsapp, currentTelegram }: AdminPanelProps) {',
  'export default function AdminPanel({ onClose, onUpdateSettings, currentWhatsapp, currentTelegram }: AdminPanelProps) {\n  const { t } = useLanguage();'
);

fs.writeFileSync('src/components/AdminPanel.tsx', content);
console.log('Fixed t');
