import { rateLimit } from '../middleware/rateLimit.js';
import { validateContact, saveContact } from '../services/contactService.js';
import { logger } from '../services/logger.js';

const checkRate = rateLimit({ max: 3, windowMs: 15 * 60 * 1000 });

export function getIp(req) {
  return (req.headers['x-forwarded-for'] ?? req.socket?.remoteAddress ?? '')
    .split(',')[0].trim();
}

function parseBody(req) {
  return new Promise((resolve, reject) => {
    let raw = '';
    req.on('data', chunk => {
      raw += chunk;
      if (raw.length > 8192) reject(new Error('Payload demasiado grande'));
    });
    req.on('end', () => {
      try { resolve(JSON.parse(raw)); }
      catch { reject(new Error('JSON inválido')); }
    });
    req.on('error', reject);
  });
}

function json(res, status, data) {
  const body = JSON.stringify(data);
  res.writeHead(status, {
    'Content-Type':           'application/json',
    'Content-Length':         Buffer.byteLength(body),
    'X-Content-Type-Options': 'nosniff',
  });
  res.end(body);
}

export async function handleContact(req, res) {
  const ip   = getIp(req);
  const rate = checkRate(ip);

  if (!rate.allowed) {
    logger.warn('rate_limit', { ip });
    res.setHeader('Retry-After', String(rate.retryAfter));
    return json(res, 429, { error: 'Demasiadas solicitudes. Intentá de nuevo en unos minutos.' });
  }

  let body;
  try { body = await parseBody(req); }
  catch (err) {
    logger.warn('parse_error', { ip, message: err.message });
    return json(res, 400, { error: 'Solicitud inválida.' });
  }

  const errors = validateContact(body);
  if (Object.keys(errors).length) {
    return json(res, 422, { errors });
  }

  try {
    const id = saveContact({ ...body, ip });
    logger.info('contact_saved', { id, ip });
    return json(res, 201, { ok: true, message: '¡Mensaje recibido! Te contactaremos a la brevedad.' });
  } catch (err) {
    logger.error('contact_save_failed', { ip, message: err.message });
    return json(res, 500, { error: 'No se pudo guardar tu mensaje. Por favor intentá de nuevo.' });
  }
}
