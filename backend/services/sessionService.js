import { randomBytes } from 'node:crypto';
import { getDb } from '../database/db.js';

const SESSION_DURATION_S  = 8 * 60 * 60;        // 8 horas
const SESSION_DURATION_MS = SESSION_DURATION_S * 1000;

export function createSession(ip) {
  const token     = randomBytes(32).toString('hex');
  const expiresAt = new Date(Date.now() + SESSION_DURATION_MS).toISOString();
  getDb()
    .prepare('INSERT INTO sessions (token, expires_at, ip) VALUES (?, ?, ?)')
    .run(token, expiresAt, ip ?? null);
  return { token, expiresAt, maxAge: SESSION_DURATION_S };
}

export function getSession(token) {
  if (!token || token.length !== 64) return null;
  return getDb()
    .prepare("SELECT * FROM sessions WHERE token = ? AND expires_at > datetime('now')")
    .get(token) ?? null;
}

export function deleteSession(token) {
  if (token) getDb().prepare('DELETE FROM sessions WHERE token = ?').run(token);
}

export function cleanExpiredSessions() {
  getDb().prepare("DELETE FROM sessions WHERE expires_at <= datetime('now')").run();
}
