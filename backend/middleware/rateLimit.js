const store = new Map(); // ip → { count, resetAt }

export function rateLimit({ max = 3, windowMs = 15 * 60 * 1000 } = {}) {
  return function check(ip) {
    const now   = Date.now();
    const entry = store.get(ip);

    if (!entry || now > entry.resetAt) {
      store.set(ip, { count: 1, resetAt: now + windowMs });
      return { allowed: true };
    }

    if (entry.count >= max) {
      const retryAfter = Math.ceil((entry.resetAt - now) / 1000);
      return { allowed: false, retryAfter };
    }

    entry.count++;
    return { allowed: true };
  };
}

// Para pruebas: limpia el estado del store
export function resetRateLimitStore() {
  store.clear();
}

// Limpia entradas vencidas cada 10 minutos
setInterval(() => {
  const now = Date.now();
  for (const [ip, entry] of store) {
    if (now > entry.resetAt) store.delete(ip);
  }
}, 10 * 60 * 1000).unref();
