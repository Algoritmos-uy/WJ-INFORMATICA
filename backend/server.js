import { createServer } from 'node:http';
import { env } from './config/env.js';
import { initDb } from './database/db.js';
import { serveStatic } from './middleware/static.js';
import { handleContact } from './routes/contact.js';
import { logger } from './services/logger.js';

initDb();

const server = createServer(async (req, res) => {
  const start = Date.now();
  const url   = new URL(req.url, `http://localhost:${env.PORT}`);

  res.on('finish', () => {
    logger.info('request', { method: req.method, url: url.pathname, status: res.statusCode, ms: Date.now() - start });
  });

  try {
    if (req.method === 'POST' && url.pathname === '/api/contact') {
      await handleContact(req, res);
      return;
    }

    if (req.method !== 'GET' && req.method !== 'HEAD') {
      res.writeHead(405, { Allow: 'GET, HEAD, POST' });
      res.end();
      return;
    }

    serveStatic(req, res, url);
  } catch (err) {
    logger.error('unhandled', { message: err.message });
    if (!res.headersSent) {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Error interno del servidor.' }));
    }
  }
});

server.listen(env.PORT, () => {
  logger.info('server_start', { port: env.PORT, env: env.NODE_ENV });
});
