import { getDb } from '../database/db.js';
import { rateLimit } from '../middleware/rateLimit.js';

const checkRate = rateLimit({ max: 3, windowMs: 15 * 60 * 1000 });

function getIp(req) {
  return (req.headers['x-forwarded-for'] ?? req.socket?.remoteAddress ?? '')
    .split(',')[0].trim();
}

function parseBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', chunk => {
      body += chunk;
      if (body.length > 8192) reject(new Error('Payload demasiado grande'));
    });
    req.on('end', () => {
      try { resolve(JSON.parse(body)); }
      catch { reject(new Error('JSON inválido')); }
    });
    req.on('error', reject);
  });
}

function validate({ nombre, email, telefono, mensaje }) {
  const errors = {};

  const n = nombre?.trim() ?? '';
  if (!n) errors.nombre = 'El nombre es obligatorio.';
  else if (n.length > 100) errors.nombre = 'Nombre demasiado largo (máx. 100 caracteres).';

  const e = email?.trim() ?? '';
  if (!e) errors.email = 'El correo electrónico es obligatorio.';
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e)) errors.email = 'Correo electrónico inválido.';
  else if (e.length > 254) errors.email = 'Correo demasiado largo.';

  if (telefono?.trim() && telefono.trim().length > 30) {
    errors.telefono = 'Teléfono demasiado largo (máx. 30 caracteres).';
  }

  const m = mensaje?.trim() ?? '';
  if (!m) errors.mensaje = 'El mensaje es obligatorio.';
  else if (m.length < 10) errors.mensaje = 'El mensaje debe tener al menos 10 caracteres.';
  else if (m.length > 2000) errors.mensaje = 'El mensaje no puede superar los 2000 caracteres.';

  return errors;
}

function json(res, status, data) {
  const body = JSON.stringify(data);
  res.writeHead(status, {
    'Content-Type':    'application/json',
    'Content-Length':  Buffer.byteLength(body),
    'X-Content-Type-Options': 'nosniff',
  });
  res.end(body);
}

export async function handleContact(req, res) {
  const ip   = getIp(req);
  const rate = checkRate(ip);

  if (!rate.allowed) {
    res.setHeader('Retry-After', String(rate.retryAfter));
    return json(res, 429, { error: 'Demasiadas solicitudes. Por favor intentá de nuevo en unos minutos.' });
  }

  let body;
  try { body = await parseBody(req); }
  catch { return json(res, 400, { error: 'Solicitud inválida.' }); }

  const errors = validate(body);
  if (Object.keys(errors).length) return json(res, 422, { errors });

  const nombre   = body.nombre.trim();
  const email    = body.email.trim();
  const telefono = body.telefono?.trim() || null;
  const mensaje  = body.mensaje.trim();

  try {
    const stmt = getDb().prepare(
      'INSERT INTO contacts (nombre, email, telefono, mensaje, ip) VALUES (?, ?, ?, ?, ?)'
    );
    stmt.run(nombre, email, telefono, mensaje, ip);
  } catch (err) {
    console.error('[contact] error al guardar:', err.message);
    return json(res, 500, { error: 'No se pudo guardar tu mensaje. Por favor intentá de nuevo.' });
  }

  console.log(`[contact] nuevo mensaje de ${email} (${ip})`);
  return json(res, 201, { ok: true, message: '¡Mensaje recibido! Te contactaremos a la brevedad.' });
}
