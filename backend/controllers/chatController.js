import { randomBytes } from 'node:crypto';
import { json, parseBody, parseCookies } from '../utils/http.js';
import { buildContext, buildSystemPrompt } from '../services/chatService.js';
import { callDeepSeek } from '../services/deepseekService.js';
import { logger } from '../services/logger.js';

const MAX_MESSAGES   = 20;
const MAX_MSG_CHARS  = 1000;
const MAX_HISTORY    = 10;
const SESSION_COOKIE = 'wj-chat-session';

// Almacenamiento de sesiones en memoria (no persiste entre reinicios — diseño deliberado)
const sessions = new Map();

// Limpieza periódica de sesiones antiguas
setInterval(() => {
  const cutoff = Date.now() - 24 * 60 * 60 * 1000;
  for (const [k, v] of sessions) {
    if (v.createdAt < cutoff) sessions.delete(k);
  }
}, 60 * 60 * 1000);

function newToken() {
  return randomBytes(24).toString('hex');
}

function cookieHeader(token) {
  return `${SESSION_COOKIE}=${token}; HttpOnly; SameSite=Strict; Path=/; Max-Age=86400`;
}

export async function handleChat(req, res) {
  let body;
  try { body = await parseBody(req, 16_384); }
  catch (err) {
    return json(res, 400, { error: 'Solicitud inválida.' });
  }

  const raw = typeof body?.message === 'string' ? body.message.trim() : '';
  if (!raw) return json(res, 422, { error: 'El campo "message" es requerido.' });

  const userMsg = raw.slice(0, MAX_MSG_CHARS);

  // Sesión y límite de mensajes
  const cookies = parseCookies(req);
  let token = cookies[SESSION_COOKIE];
  if (!token || !sessions.has(token)) {
    token = newToken();
    sessions.set(token, { count: 0, createdAt: Date.now() });
  }
  const session = sessions.get(token);

  if (session.count >= MAX_MESSAGES) {
    res.setHeader('Set-Cookie', cookieHeader(token));
    return json(res, 429, {
      error: '¡Alcanzaste el límite de 20 mensajes por sesión! Para seguir hablando con nosotros, contactanos directamente.',
      limit_reached: true,
    });
  }

  session.count++;
  const remaining = MAX_MESSAGES - session.count;

  // Historial validado (solo roles válidos, truncado)
  const rawHistory = Array.isArray(body?.history) ? body.history : [];
  const history = rawHistory
    .slice(-MAX_HISTORY)
    .filter(m => m?.role === 'user' || m?.role === 'assistant')
    .map(m => ({ role: m.role, content: String(m.content ?? '').slice(0, 2000) }));

  // Contexto y prompt
  const context    = buildContext(userMsg);
  const systemPmpt = buildSystemPrompt(context);

  const messages = [
    { role: 'system', content: systemPmpt },
    ...history,
    { role: 'user', content: userMsg },
  ];

  try {
    const reply = await callDeepSeek(messages);
    logger.info('chat_ok', { remaining });
    res.setHeader('Set-Cookie', cookieHeader(token));
    return json(res, 200, { reply, remaining });
  } catch (err) {
    session.count--; // no contamos mensajes fallidos
    logger.error('chat_fail', { message: err.message });
    res.setHeader('Set-Cookie', cookieHeader(token));
    return json(res, 502, { error: 'No pude conectarme con el asistente. Intentá de nuevo en un momento.' });
  }
}
