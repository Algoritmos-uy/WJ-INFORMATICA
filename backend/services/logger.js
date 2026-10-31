// Registro estructurado — nunca loguea valores sensibles
const REDACTED = new Set(['password', 'hash', 'token', 'secret', 'session', 'cookie', 'authorization']);

function sanitize(meta) {
  const safe = {};
  for (const [k, v] of Object.entries(meta)) {
    safe[k] = REDACTED.has(k.toLowerCase()) ? '[REDACTED]' : v;
  }
  return safe;
}

function log(level, msg, meta = {}) {
  const entry = { ts: new Date().toISOString(), level, msg, ...sanitize(meta) };
  process.stdout.write(JSON.stringify(entry) + '\n');
}

export const logger = {
  info:  (msg, meta) => log('INFO',  msg, meta),
  warn:  (msg, meta) => log('WARN',  msg, meta),
  error: (msg, meta) => log('ERROR', msg, meta),
};
