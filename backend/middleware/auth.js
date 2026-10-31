import { parseCookies, json } from '../utils/http.js';
import { getSession } from '../services/sessionService.js';

export function requireAuth(req, res) {
  const cookies = parseCookies(req);
  const session = getSession(cookies['wj-admin-session']);
  if (!session) {
    json(res, 401, { error: 'No autenticado.' });
    return null;
  }
  return session;
}
