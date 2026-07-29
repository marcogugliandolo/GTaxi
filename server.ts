import express from 'express';
import path from 'path';
import fs from 'fs';
import { createServer as createViteServer } from 'vite';

const app = express();
const PORT = 3000;

app.use(express.json());

// Set up data directory
const DATA_DIR = process.env.NODE_ENV === 'production' ? '/app/data' : path.join(process.cwd(), 'data');

if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

const BOOKINGS_FILE = path.join(DATA_DIR, 'bookings.json');
const SETTINGS_FILE = path.join(DATA_DIR, 'settings.json');

// Initialize files if they don't exist
if (!fs.existsSync(BOOKINGS_FILE)) fs.writeFileSync(BOOKINGS_FILE, JSON.stringify([]));
if (!fs.existsSync(SETTINGS_FILE)) fs.writeFileSync(SETTINGS_FILE, JSON.stringify({ whatsapp: '', telegram: '' }));

// API ROUTES
app.get('/api/settings', (req, res) => {
  try {
    const data = JSON.parse(fs.readFileSync(SETTINGS_FILE, 'utf-8'));
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: 'Failed to read settings' });
  }
});

app.post('/api/settings', (req, res) => {
  try {
    fs.writeFileSync(SETTINGS_FILE, JSON.stringify(req.body, null, 2));
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to save settings' });
  }
});

app.get('/api/bookings', (req, res) => {
  try {
    const data = JSON.parse(fs.readFileSync(BOOKINGS_FILE, 'utf-8'));
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: 'Failed to read bookings' });
  }
});

app.post('/api/bookings', (req, res) => {
  try {
    const data = JSON.parse(fs.readFileSync(BOOKINGS_FILE, 'utf-8'));
    const newBooking = { ...req.body, id: Date.now().toString(), createdAt: Date.now() };
    data.push(newBooking);
    fs.writeFileSync(BOOKINGS_FILE, JSON.stringify(data, null, 2));
    res.json(newBooking);
  } catch (error) {
    res.status(500).json({ error: 'Failed to save booking' });
  }
});

app.put('/api/bookings/:id/status', (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const data = JSON.parse(fs.readFileSync(BOOKINGS_FILE, 'utf-8'));
    
    const index = data.findIndex((b: any) => b.id === id);
    if (index !== -1) {
      data[index].status = status;
      fs.writeFileSync(BOOKINGS_FILE, JSON.stringify(data, null, 2));
      res.json(data[index]);
    } else {
      res.status(404).json({ error: 'Booking not found' });
    }
  } catch (error) {
    res.status(500).json({ error: 'Failed to update booking' });
  }
});

async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on port ${PORT}`);
  });
}

startServer();
