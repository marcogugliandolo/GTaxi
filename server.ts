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
        CREATE TABLE IF NOT EXISTS users (
          username TEXT PRIMARY KEY,
          password TEXT,
          role TEXT
        );
      `);
    } else {
      throw error;
    }
  }

  // Ensure default user exists
  try {
    await db.run('CREATE TABLE IF NOT EXISTS users (username TEXT PRIMARY KEY, password TEXT, role TEXT)');
    const userCount = await db.get('SELECT COUNT(*) as count FROM users');
    if (userCount.count === 0) {
      await db.run('INSERT INTO users (username, password, role) VALUES (?, ?, ?)', ['gabriel', 'gtaxi2026', 'admin']);
    }
  } catch(e) {
    console.error("Error setting up users table", e);
  }

  // Migrations for new user fields
  try { await db.run('ALTER TABLE users ADD COLUMN fullName TEXT'); } catch(e) {}
  try { await db.run('ALTER TABLE users ADD COLUMN carModel TEXT'); } catch(e) {}
  try { await db.run('ALTER TABLE users ADD COLUMN carPlate TEXT'); } catch(e) {}

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
app.post('/api/auth/login', async (req, res) => {
  const { username, password } = req.body;
  try {
    const user = await db.get('SELECT * FROM users WHERE username = ? COLLATE NOCASE', [username]);
    if (user && user.password === password) {
      res.json({ success: true, username: user.username, role: user.role });
    } else {
      res.status(401).json({ error: 'Usuario o contraseña incorrectos' });
    }
  } catch (error) {
    res.status(500).json({ error: 'Error en el servidor' });
  }
});

app.post('/api/auth/change-password', async (req, res) => {
  const { username, oldPassword, newPassword } = req.body;
  try {
    const user = await db.get('SELECT * FROM users WHERE username = ? COLLATE NOCASE', [username]);
    if (user && user.password === oldPassword) {
      await db.run('UPDATE users SET password = ? WHERE username = ? COLLATE NOCASE', [newPassword, username]);
      res.json({ success: true });
    } else {
      res.status(401).json({ error: 'Contraseña actual incorrecta' });
    }
  } catch (error) {
    res.status(500).json({ error: 'Error en el servidor' });
  }
});

app.put('/api/auth/profile', async (req, res) => {
  const { username, fullName, carModel, carPlate } = req.body;
  try {
    await db.run(
      'UPDATE users SET fullName = ?, carModel = ?, carPlate = ? WHERE username = ? COLLATE NOCASE',
      [fullName, carModel, carPlate, username]
    );
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Error updating profile' });
  }
});

app.get('/api/admin/users', async (req, res) => {
  try {
    const rows = await db.all('SELECT username, role, fullName, carModel, carPlate FROM users');
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: 'Error fetching users' });
  }
});

app.post('/api/admin/users', async (req, res) => {
  const { username, password, role, fullName, carModel, carPlate } = req.body;
  try {
    const existing = await db.get('SELECT username FROM users WHERE username = ? COLLATE NOCASE', [username]);
    if (existing) {
      return res.status(400).json({ error: 'El usuario ya existe' });
    }
    await db.run(
      'INSERT INTO users (username, password, role, fullName, carModel, carPlate) VALUES (?, ?, ?, ?, ?, ?)',
      [username, password, role || 'admin', fullName || '', carModel || '', carPlate || '']
    );
    res.json({ success: true, username, role: role || 'admin', fullName, carModel, carPlate });
  } catch (error) {
    res.status(500).json({ error: 'Error creating user' });
  }
});

app.delete('/api/admin/users/:username', async (req, res) => {
  const { username } = req.params;
  try {
    const count = await db.get('SELECT COUNT(*) as count FROM users');
    if (count.count <= 1) {
      return res.status(400).json({ error: 'No puedes eliminar el único usuario' });
    }
    await db.run('DELETE FROM users WHERE username = ? COLLATE NOCASE', [username]);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Error deleting user' });
  }
});

app.get('/api/config', (req, res) => {
  const googleMapsKey =
    process.env.GOOGLE_MAPS_PLATFORM_KEY ||
    process.env.VITE_GOOGLE_MAPS_PLATFORM_KEY ||
    '';
  res.json({ googleMapsKey });
});

app.get('/api/settings', async (req, res) => {
  try {
    const row = await db.get('SELECT data FROM settings WHERE id = 1');
    if (row && row.data) {
      res.json(JSON.parse(row.data));
    } else {
      res.json({ whatsapp: '34664287876', telegram: '' });
    }
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


const clients = new Set<express.Response>();

app.get('/api/admin/events', (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no'); // Disable Nginx buffering
  res.flushHeaders();

  clients.add(res);
  
  // Send a heartbeat ping every 15 seconds to keep the connection alive
  const pingInterval = setInterval(() => {
    res.write(': ping\n\n');
  }, 15000);

  req.on('close', () => {
    clearInterval(pingInterval);
    clients.delete(res);
  });
});

function notifyAdmins(event: string, data: any) {
  for (const client of clients) {
    client.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
  }
}

app.post('/api/bookings', async (req, res) => {
  try {
    const newBooking = { ...req.body, id: Date.now().toString(), createdAt: Date.now(), status: 'pending' };
    await db.run(
      'INSERT INTO bookings (id, status, createdAt, data) VALUES (?, ?, ?, ?)',
      [newBooking.id, newBooking.status, newBooking.createdAt, JSON.stringify(newBooking)]
    );
    notifyAdmins('new_booking', newBooking);
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
  
  const distPath = path.join(process.cwd(), 'dist');
  const hasDist = fs.existsSync(path.join(distPath, 'index.html'));

  if (process.env.NODE_ENV === 'production' || hasDist) {
    app.use(express.static(distPath, {
      maxAge: '0',
      setHeaders: (res, filePath) => {
        if (filePath.endsWith('.html')) {
          res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate, max-age=0');
          res.setHeader('Pragma', 'no-cache');
          res.setHeader('Expires', '0');
        } else {
          res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
        }
      },
    }));

    app.get('*', (req, res) => {
      // Do not return HTML for missing API routes or missing static files (js, css, images, map, json)
      if (req.path.startsWith('/api') || req.path.includes('.')) {
        return res.status(404).send('Not found');
      }
      res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate, max-age=0');
      res.setHeader('Pragma', 'no-cache');
      res.setHeader('Expires', '0');
      res.sendFile(path.join(distPath, 'index.html'));
    });
  } else {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on port ${PORT}`);
  });
}

startServer();
