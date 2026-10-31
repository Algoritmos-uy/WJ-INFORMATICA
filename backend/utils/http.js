// Utilidades HTTP compartidas entre controladores

export function json(res, status, data) {
  const body = JSON.stringify(data);
  res.writeHead(status, {
    'Content-Type':           'application/json',
    'Content-Length':         Buffer.byteLength(body),
    'X-Content-Type-Options': 'nosniff',
  });
  res.end(body);
}

export function parseBody(req, maxBytes = 8192) {
  return new Promise((resolve, reject) => {
    let raw = '';
    req.on('data', chunk => {
      raw += chunk;
      if (raw.length > maxBytes) reject(new Error('Payload demasiado grande'));
    });
    req.on('end', () => {
      try { resolve(JSON.parse(raw)); }
      catch { reject(new Error('JSON inválido')); }
    });
    req.on('error', reject);
  });
}

export function parseCookies(req) {
  const cookies = {};
  const header = req.headers.cookie ?? '';
  for (const part of header.split(';')) {
    const idx = part.indexOf('=');
    if (idx === -1) continue;
    cookies[part.slice(0, idx).trim()] = part.slice(idx + 1).trim();
  }
  return cookies;
}

export function getIp(req) {
  return (req.headers['x-forwarded-for'] ?? req.socket?.remoteAddress ?? '')
    .split(',')[0].trim();
}
