import { scrypt, timingSafeEqual } from 'node:crypto';
import { promisify } from 'node:util';
import { env } from '../config/env.js';
import { createSession, deleteSession } from '../services/sessionService.js';
import { rateLimit } from '../middleware/rateLimit.js';
import { logger } from '../services/logger.js';
import { json, parseBody, getIp } from '../utils/http.js';

const scryptAsync    = promisify(scrypt);
const checkLoginRate = rateLimit({ max: 5, windowMs: 15 * 60 * 1000 });

async function verifyPassword(password, storedHash) {
  if (!storedHash?.includes(':')) return false;
  const [salt, hash] = storedHash.split(':');
  try {
    const derived = await scryptAsync(password, salt, 64);
    return timingSafeEqual(Buffer.from(hash, 'hex'), derived);
  } catch { return false; }
}

function buildSessionCookie(token, maxAge) {
  const attrs = [`wj-admin-session=${token}`, 'HttpOnly', 'SameSite=Strict', 'Path=/admin', `Max-Age=${maxAge}`];
  if (env.NODE_ENV === 'production') attrs.push('Secure');
  return attrs.join('; ');
}

function clearSessionCookie() {
  return 'wj-admin-session=; HttpOnly; SameSite=Strict; Path=/admin; Max-Age=0';
}

export async function handleLogin(req, res) {
  const ip   = getIp(req);
  const rate = checkLoginRate(ip);

  if (!rate.allowed) {
    logger.warn('login_rate_limit', { ip });
    res.setHeader('Retry-After', String(rate.retryAfter));
    return json(res, 429, { error: 'Demasiados intentos. Esperá unos minutos.' });
  }

  let body;
  try { body = await parseBody(req); }
  catch { return json(res, 400, { error: 'Solicitud inválida.' }); }

  const { username, password } = body ?? {};

  if (!username || !password) {
    return json(res, 400, { error: 'Usuario y contraseña son obligatorios.' });
  }

  if (!env.ADMIN_USERNAME || !env.ADMIN_PASSWORD_HASH) {
    logger.error('admin_not_configured', {});
    return json(res, 503, { error: 'Panel administrativo no configurado.' });
  }

  // Siempre ejecutar verifyPassword para prevenir timing attacks
  const usernameOk = username === env.ADMIN_USERNAME;
  const passwordOk = await verifyPassword(password, env.ADMIN_PASSWORD_HASH);

  if (!usernameOk || !passwordOk) {
    logger.warn('login_failed', { ip });
    return json(res, 401, { error: 'Credenciales incorrectas.' });
  }

  const { token, maxAge } = createSession(ip);
  logger.info('login_success', { ip });

  res.setHeader('Set-Cookie', buildSessionCookie(token, maxAge));
  return json(res, 200, { ok: true });
}

export function handleLogout(req, res, session) {
  deleteSession(session.token);
  logger.info('logout', { ip: getIp(req) });
  res.setHeader('Set-Cookie', clearSessionCookie());
  return json(res, 200, { ok: true });
}
