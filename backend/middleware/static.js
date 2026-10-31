import { createReadStream, statSync } from 'node:fs';
import { resolve, extname } from 'node:path';

const MIME = {
  '.html':  'text/html; charset=utf-8',
  '.css':   'text/css; charset=utf-8',
  '.js':    'text/javascript; charset=utf-8',
  '.json':  'application/json',
  '.png':   'image/png',
  '.jpg':   'image/jpeg',
  '.jpeg':  'image/jpeg',
  '.gif':   'image/gif',
  '.svg':   'image/svg+xml',
  '.ico':   'image/x-icon',
  '.webp':  'image/webp',
  '.woff2': 'font/woff2',
  '.woff':  'font/woff',
  '.txt':   'text/plain; charset=utf-8',
  '.xml':   'application/xml',
  '.pdf':   'application/pdf',
};

const PUBLIC = resolve(process.cwd(), 'public');
const ADMIN  = resolve(process.cwd(), 'admin');

const SEC_HEADERS = {
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options':        'SAMEORIGIN',
  'Referrer-Policy':        'strict-origin-when-cross-origin',
};

export function serveStatic(req, res, url) {
  let pathname = decodeURIComponent(url.pathname);

  // Directorio → index.html
  if (pathname.endsWith('/')) pathname += 'index.html';

  // Ruta sin extensión → .html
  if (!extname(pathname)) pathname += '.html';

  // Previene path traversal
  const filePath = resolve(PUBLIC, '.' + pathname);
  if (!filePath.startsWith(PUBLIC + '\\') && filePath !== PUBLIC) {
    res.writeHead(403, SEC_HEADERS);
    res.end();
    return;
  }

  let stat;
  try { stat = statSync(filePath); } catch (_) {
    serve404(res);
    return;
  }

  if (!stat.isFile()) { serve404(res); return; }

  const ext  = extname(filePath).toLowerCase();
  const type = MIME[ext] ?? 'application/octet-stream';

  res.writeHead(200, { ...SEC_HEADERS, 'Content-Type': type, 'Content-Length': stat.size });
  createReadStream(filePath).pipe(res);
}

export function serveAdmin(req, res, url) {
  let pathname = decodeURIComponent(url.pathname).replace(/^\/admin/, '') || '/';
  if (pathname === '/' || pathname === '') pathname = '/index.html';
  if (!extname(pathname)) pathname += '.html';

  const filePath = resolve(ADMIN, '.' + pathname);
  if (!filePath.startsWith(ADMIN + '\\') && filePath !== ADMIN) {
    res.writeHead(403, SEC_HEADERS); res.end(); return;
  }

  let stat;
  try { stat = statSync(filePath); } catch (_) {
    // No hay 404.html específica del admin — redirigir a index
    const idx = resolve(ADMIN, 'index.html');
    try {
      const s = statSync(idx);
      const csp = "default-src 'self'; style-src 'self'; script-src 'self'; img-src 'self' data:;";
      res.writeHead(200, { ...SEC_HEADERS, 'Content-Security-Policy': csp, 'Content-Type': 'text/html; charset=utf-8', 'Content-Length': s.size });
      createReadStream(idx).pipe(res);
    } catch { serve404(res); }
    return;
  }

  if (!stat.isFile()) { serve404(res); return; }

  const ext  = extname(filePath).toLowerCase();
  const type = MIME[ext] ?? 'application/octet-stream';
  const headers = { ...SEC_HEADERS, 'Content-Type': type, 'Content-Length': stat.size };
  if (ext === '.html') {
    headers['Content-Security-Policy'] = "default-src 'self'; style-src 'self'; script-src 'self'; img-src 'self' data:;";
  }
  res.writeHead(200, headers);
  createReadStream(filePath).pipe(res);
}

function serve404(res) {
  const fallback = resolve(PUBLIC, '404.html');
  try {
    const stat = statSync(fallback);
    res.writeHead(404, { ...SEC_HEADERS, 'Content-Type': 'text/html; charset=utf-8', 'Content-Length': stat.size });
    createReadStream(fallback).pipe(res);
  } catch {
    res.writeHead(404, { ...SEC_HEADERS, 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('404 Not Found');
  }
}
