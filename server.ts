import express from 'express';
import compression from 'compression';
import path from 'path';
import fs from 'fs';
import { createServer as createViteServer } from 'vite';
import sqlite3 from 'sqlite3';
import { open } from 'sqlite';

const app = express();
const PORT = 3000;

app.use(compression());
app.use(express.json());


// Set up data directory
const DATA_DIR = process.env.NODE_ENV === 'production' ? '/app/data' : path.join(process.cwd(), 'data');

if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

let db: any;

async function initDb() {
  const dbPath = path.join(DATA_DIR, 'database.sqlite');
  
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database
    });

    await db.exec(`
      CREATE TABLE IF NOT EXISTS settings (
        id INTEGER PRIMARY KEY CHECK (id = 1),
        data TEXT
      );
      CREATE TABLE IF NOT EXISTS bookings (
        id TEXT PRIMARY KEY,
        status TEXT,
        createdAt INTEGER,
        data TEXT
      );
    `);
  } catch (error: any) {
    if (error.code === 'SQLITE_CORRUPT') {
      console.warn('Database is corrupt. Creating a backup and starting fresh...');
      if (fs.existsSync(dbPath)) {
        fs.renameSync(dbPath, dbPath + '.corrupt.' + Date.now());
      }
      
      db = await open({
        filename: dbPath,
        driver: sqlite3.Database
      });

      await db.exec(`
        CREATE TABLE IF NOT EXISTS settings (
          id INTEGER PRIMARY KEY CHECK (id = 1),
          data TEXT
        );
        CREATE TABLE IF NOT EXISTS bookings (
          id TEXT PRIMARY KEY,
          status TEXT,
          createdAt INTEGER,
          data TEXT
        );
      `);
    } else {
      throw error;
    }
  }

  const settings = await db.get('SELECT data FROM settings WHERE id = 1');
  if (!settings) {
    await db.run('INSERT INTO settings (id, data) VALUES (1, ?)', JSON.stringify({ whatsapp: '34664287876', telegram: '' }));
  }
  
  // Try to migrate from JSON if exists (for backwards compatibility if they have existing data in JSON)
  const BOOKINGS_FILE = path.join(DATA_DIR, 'bookings.json');
  const SETTINGS_FILE = path.join(DATA_DIR, 'settings.json');
  
  if (fs.existsSync(SETTINGS_FILE)) {
    try {
      const data = fs.readFileSync(SETTINGS_FILE, 'utf-8');
      await db.run('UPDATE settings SET data = ? WHERE id = 1', data);
      fs.renameSync(SETTINGS_FILE, SETTINGS_FILE + '.bak');
    } catch (e) {}
  }
  
  if (fs.existsSync(BOOKINGS_FILE)) {
    try {
      const data = JSON.parse(fs.readFileSync(BOOKINGS_FILE, 'utf-8'));
      for (const b of data) {
        await db.run('INSERT OR IGNORE INTO bookings (id, status, createdAt, data) VALUES (?, ?, ?, ?)', [b.id, b.status, b.createdAt, JSON.stringify(b)]);
      }
      fs.renameSync(BOOKINGS_FILE, BOOKINGS_FILE + '.bak');
    } catch (e) {}
  }
}

// API ROUTES
app.get('/api/settings', async (req, res) => {
  try {
    const row = await db.get('SELECT data FROM settings WHERE id = 1');
    res.json(JSON.parse(row.data));
  } catch (error) {
    res.status(500).json({ error: 'Failed to read settings' });
  }
});

app.post('/api/settings', async (req, res) => {
  try {
    await db.run('UPDATE settings SET data = ? WHERE id = 1', JSON.stringify(req.body));
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to save settings' });
  }
});

app.get('/api/bookings', async (req, res) => {
  try {
    const rows = await db.all('SELECT data FROM bookings ORDER BY createdAt DESC');
    const data = rows.map((r: any) => JSON.parse(r.data));
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: 'Failed to read bookings' });
  }
});

app.post('/api/bookings', async (req, res) => {
  try {
    const newBooking = { ...req.body, id: Date.now().toString(), createdAt: Date.now(), status: 'pending' };
    await db.run(
      'INSERT INTO bookings (id, status, createdAt, data) VALUES (?, ?, ?, ?)',
      [newBooking.id, newBooking.status, newBooking.createdAt, JSON.stringify(newBooking)]
    );
    res.json(newBooking);
  } catch (error) {
    res.status(500).json({ error: 'Failed to save booking' });
  }
});

app.put('/api/bookings/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    
    const row = await db.get('SELECT data FROM bookings WHERE id = ?', id);
    if (row) {
      const booking = JSON.parse(row.data);
      booking.status = status;
      await db.run('UPDATE bookings SET status = ?, data = ? WHERE id = ?', [status, JSON.stringify(booking), id]);
      res.json(booking);
    } else {
      res.status(404).json({ error: 'Booking not found' });
    }
  } catch (error) {
    res.status(500).json({ error: 'Failed to update booking' });
  }
});

async function startServer() {
  await initDb();
  
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath, { maxAge: '1y' }));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on port ${PORT}`);
  });
}

startServer();
