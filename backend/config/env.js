import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

// Carga .env sin dependencias externas
try {
  const raw = readFileSync(resolve(process.cwd(), '.env'), 'utf8');
  for (const line of raw.split('\n')) {
    const t = line.trim();
    if (!t || t.startsWith('#')) continue;
    const eq = t.indexOf('=');
    if (eq === -1) continue;
    const key = t.slice(0, eq).trim();
    const val = t.slice(eq + 1).trim();
    if (!(key in process.env)) process.env[key] = val;
  }
} catch (_) {}

export const env = {
  NODE_ENV:             process.env.NODE_ENV              ?? 'production',
  PORT:                 Number(process.env.PORT)           || 3000,
  DB_PATH:              process.env.DB_PATH               ?? 'backend/database/wj.db',
  SESSION_SECRET:       process.env.SESSION_SECRET        ?? '',
  ADMIN_USERNAME:       process.env.ADMIN_USERNAME        ?? '',
  ADMIN_PASSWORD_HASH:  process.env.ADMIN_PASSWORD_HASH   ?? '',
};

if (!env.SESSION_SECRET && env.NODE_ENV === 'production') {
  console.error('[config] SESSION_SECRET no configurado en producción. Abortando.');
  process.exit(1);
}
