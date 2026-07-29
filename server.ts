import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import fs from 'fs';

async function startServer() {
  const app = express();
  const PORT = 3000;
  
  app.use(express.json());

  // Ensure data directory exists
  const dbDir = path.join(process.cwd(), 'data');
  if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir);
  }

  const dbPath = path.join(dbDir, 'database.json');

  const defaultData = {
    reservations: [],
    settings: {
      gtaxi_wa: '34600000000',
      gtaxi_tg: 'tu_usuario_taxi'
    }
  };

  if (!fs.existsSync(dbPath)) {
    fs.writeFileSync(dbPath, JSON.stringify(defaultData, null, 2));
  }

  const readDb = () => {
    try {
      const data = fs.readFileSync(dbPath, 'utf8');
      return JSON.parse(data);
    } catch (e) {
      return defaultData;
    }
  };

  const writeDb = (data: any) => {
    fs.writeFileSync(dbPath, JSON.stringify(data, null, 2));
  };

  // API Routes
  app.get('/api/reservations', (req, res) => {
    try {
      const db = readDb();
      res.json(db.reservations.sort((a: any, b: any) => b.createdAt - a.createdAt));
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch reservations' });
    }
  });

  app.post('/api/reservations', (req, res) => {
    try {
      const { id, pickup, dropoff, date, time, passengers, name, phone, notes, status, createdAt } = req.body;
      const db = readDb();
      db.reservations.unshift({ id, pickup, dropoff, date, time, passengers, name, phone, notes, status, createdAt });
      writeDb(db);
      res.json({ success: true });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Failed to save reservation' });
    }
  });

  app.put('/api/reservations/:id/status', (req, res) => {
    try {
      const { id } = req.params;
      const { status } = req.body;
      const db = readDb();
      db.reservations = db.reservations.map((r: any) => r.id === id ? { ...r, status } : r);
      writeDb(db);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: 'Failed to update reservation' });
    }
  });

  app.get('/api/settings', (req, res) => {
    try {
      const db = readDb();
      res.json(db.settings);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch settings' });
    }
  });

  app.post('/api/settings', (req, res) => {
    try {
      const { whatsapp, telegram } = req.body;
      const db = readDb();
      if (whatsapp) db.settings.gtaxi_wa = whatsapp;
      if (telegram) db.settings.gtaxi_tg = telegram;
      writeDb(db);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: 'Failed to update settings' });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
