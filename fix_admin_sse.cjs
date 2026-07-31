const fs = require('fs');

let content = fs.readFileSync('src/components/AdminPanel.tsx', 'utf8');

const sseLogic = `
  useEffect(() => {
    if (isAuthenticated) {
      loadReservations();
      getSettings().then(s => {
        setWaNumber(s.whatsapp || '');
        setTgUser(s.telegram || '');
      }).catch(e => console.error(e));
      
      const evtSource = new EventSource('/api/admin/events');
      evtSource.addEventListener('new_booking', (event) => {
        const booking = JSON.parse(event.data);
        setReservations(prev => [booking, ...prev]);
        if (audioRef.current) {
          audioRef.current.play().catch(e => console.log('Audio play failed', e));
        }
      });
      return () => evtSource.close();
    }
  }, [isAuthenticated]);
`;

content = content.replace(
  /useEffect\(\(\) => \{\n\s*if \(isAuthenticated\) \{\n\s*loadReservations\(\);\n\s*\}\n\s*\}, \[isAuthenticated\]\);/g,
  sseLogic
);

// also need to import getSettings
if (!content.includes('getSettings')) {
  content = content.replace(
    "import { getBookings, updateBookingStatus } from '../api';",
    "import { getBookings, updateBookingStatus, getSettings, saveSettings } from '../api';"
  );
}

fs.writeFileSync('src/components/AdminPanel.tsx', content);
console.log('SSE added');
