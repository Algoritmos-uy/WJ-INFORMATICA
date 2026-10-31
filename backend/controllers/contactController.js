import { rateLimit } from '../middleware/rateLimit.js';
import { validateContact, saveContact } from '../services/contactService.js';
import { logger } from '../services/logger.js';
import { json, parseBody, getIp } from '../utils/http.js';

const checkRate = rateLimit({ max: 3, windowMs: 15 * 60 * 1000 });

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
  if (Object.keys(errors).length) return json(res, 422, { errors });

  try {
    const id = saveContact({ ...body, ip });
    logger.info('contact_saved', { id, ip });
    return json(res, 201, { ok: true, message: '¡Mensaje recibido! Te contactaremos a la brevedad.' });
  } catch (err) {
    logger.error('contact_save_failed', { ip, message: err.message });
    return json(res, 500, { error: 'No se pudo guardar tu mensaje. Por favor intentá de nuevo.' });
  }
}
