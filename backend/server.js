import { createServer } from 'node:http';
import { env } from './config/env.js';
import { initDb } from './database/db.js';
import { serveStatic } from './middleware/static.js';
import { handleContact } from './routes/contact.js';

initDb();

const server = createServer(async (req, res) => {
  const url = new URL(req.url, `http://localhost:${env.PORT}`);

  try {
    // API de contacto
    if (req.method === 'POST' && url.pathname === '/api/contact') {
      await handleContact(req, res);
      return;
    }

    // Solo GET y HEAD para archivos estáticos
    if (req.method !== 'GET' && req.method !== 'HEAD') {
      res.writeHead(405, { Allow: 'GET, HEAD, POST' });
      res.end();
      return;
    }

    serveStatic(req, res, url);
  } catch (err) {
    console.error('[server]', err);
    if (!res.headersSent) {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Error interno del servidor.' }));
    }
  }
});

server.listen(env.PORT, () => {
  console.log(`[WJ-INFORMATICA] http://localhost:${env.PORT}  (${env.NODE_ENV})`);
});
