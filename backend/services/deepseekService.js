import { env } from '../config/env.js';

const DEEPSEEK_URL = 'https://api.deepseek.com/v1/chat/completions';
const MAX_TOKENS   = 500;
const TEMPERATURE  = 0.7;
const TIMEOUT_MS   = 30_000;

export async function callDeepSeek(messages) {
  const key = env.DEEPSEEK_API_KEY;
  if (!key) throw new Error('DEEPSEEK_API_KEY no configurado');

  const res = await fetch(DEEPSEEK_URL, {
    method:  'POST',
    headers: {
      'Content-Type':  'application/json',
      'Authorization': `Bearer ${key}`,
    },
    body:   JSON.stringify({ model: env.DEEPSEEK_MODEL, messages, max_tokens: MAX_TOKENS, temperature: TEMPERATURE }),
    signal: AbortSignal.timeout(TIMEOUT_MS),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`DeepSeek ${res.status}: ${text.slice(0, 200)}`);
  }

  const data = await res.json();
  const content = data?.choices?.[0]?.message?.content;
  if (typeof content !== 'string') throw new Error('Respuesta inesperada de la API');
  return content;
}
