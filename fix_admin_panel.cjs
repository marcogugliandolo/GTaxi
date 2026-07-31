const fs = require('fs');

let content = fs.readFileSync('src/components/AdminPanel.tsx', 'utf8');

content = content.replace("import React, { useState, useEffect } from 'react';", "import React, { useState, useEffect, useRef } from 'react';\nimport { useNavigate } from 'react-router-dom';");

content = content.replace("import { updateBookingStatus, getBookings } from '../api';", "import { updateBookingStatus, getBookings, getSettings, saveSettings } from '../api';");

content = content.replace(
  "interface AdminPanelProps {\n  onClose: () => void;\n  onUpdateSettings: (whatsapp: string, telegram: string) => void;\n  currentWhatsapp: string;\n  currentTelegram: string;\n}",
  ""
);

content = content.replace(
  "export default function AdminPanel({ onClose, onUpdateSettings, currentWhatsapp, currentTelegram }: AdminPanelProps) {",
  "export default function AdminPanel() {\n  const navigate = useNavigate();\n  const audioRef = useRef<HTMLAudioElement | null>(null);"
);

content = content.replace(/onClose/g, "() => navigate('/')");

content = content.replace(
  "const [waNumber, setWaNumber] = useState(currentWhatsapp);\n  const [tgUser, setTgUser] = useState(currentTelegram);",
  "const [waNumber, setWaNumber] = useState('');\n  const [tgUser, setTgUser] = useState('');"
);

content = content.replace(
  "const handleSave = () => {\n    onUpdateSettings(waNumber, tgUser);\n    alert('Configuración guardada exitosamente');\n  };",
  "const handleSave = async () => {\n    await saveSettings({ whatsapp: waNumber, telegram: tgUser });\n    alert('Configuración guardada exitosamente');\n  };"
);

// We need to inject SSE into useEffect after login.
// We'll search for fetchReservations
const sseLogic = `
  useEffect(() => {
    if (isAuthenticated) {
      fetchReservations();
      getSettings().then(s => {
        setWaNumber(s.whatsapp || '');
        setTgUser(s.telegram || '');
      });
      
      const evtSource = new EventSource('/api/admin/events');
      evtSource.addEventListener('new_booking', (event) => {
        const booking = JSON.parse(event.data);
        setReservations(prev => [booking, ...prev]);
        if (audioRef.current) {
          audioRef.current.play().catch(e => console.log('Audio play failed', e));
        }
        // Optional: show a toast here
      });
      return () => evtSource.close();
    }
  }, [isAuthenticated]);
`;

// replace the original useEffect:
content = content.replace(/useEffect\(\(\) => \{\n\s*if \(isAuthenticated\) \{\n\s*fetchReservations\(\);\n\s*\}\n\s*\}, \[isAuthenticated\]\);/g, sseLogic);

fs.writeFileSync('src/components/AdminPanel.tsx', content);
console.log('AdminPanel fixed');
