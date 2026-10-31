import { createServer } from 'node:http';
import { env } from './config/env.js';
import { initDb } from './database/db.js';
import { serveStatic, serveAdmin } from './middleware/static.js';
import { handleContact } from './routes/contact.js';
import { handleAdminApi } from './routes/admin.js';
import { logger } from './services/logger.js';

initDb();

const server = createServer(async (req, res) => {
  const start = Date.now();
  const url   = new URL(req.url, `http://localhost:${env.PORT}`);

  res.on('finish', () => {
    logger.info('request', { method: req.method, url: url.pathname, status: res.statusCode, ms: Date.now() - start });
  });

  try {
    const { pathname } = url;

    // API de contacto público
    if (req.method === 'POST' && pathname === '/api/contact') {
      return await handleContact(req, res);
    }

    // Rutas de administración (API + archivos estáticos del panel)
    if (pathname.startsWith('/admin')) {
      if (pathname.startsWith('/admin/api/')) {
        return await handleAdminApi(req, res, url);
      }
      // Archivos estáticos del panel admin (HTML, CSS, JS)
      if (req.method === 'GET' || req.method === 'HEAD') {
        return serveAdmin(req, res, url);
      }
      res.writeHead(405, { Allow: 'GET, HEAD, POST' });
      return res.end();
    }

    // Archivos públicos
    if (req.method !== 'GET' && req.method !== 'HEAD') {
      res.writeHead(405, { Allow: 'GET, HEAD' });
      return res.end();
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
