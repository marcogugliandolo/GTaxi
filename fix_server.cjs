const fs = require('fs');

let content = fs.readFileSync('server.ts', 'utf8');

const sseCode = `
const clients = new Set<express.Response>();

app.get('/api/admin/events', (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();

  clients.add(res);

  req.on('close', () => {
    clients.delete(res);
  });
});

function notifyAdmins(event: string, data: any) {
  for (const client of clients) {
    client.write(\`event: \${event}\\ndata: \${JSON.stringify(data)}\\n\\n\`);
  }
}
`;

content = content.replace("app.post('/api/bookings', async (req, res) => {", sseCode + "\napp.post('/api/bookings', async (req, res) => {");

content = content.replace(
  "res.json(newBooking);",
  "notifyAdmins('new_booking', newBooking);\n    res.json(newBooking);"
);

fs.writeFileSync('server.ts', content);
console.log('server fixed');
