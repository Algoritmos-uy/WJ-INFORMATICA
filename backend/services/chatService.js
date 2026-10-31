import { readFileSync, readdirSync } from 'node:fs';
import { resolve, extname } from 'node:path';

// ─── Tokenización y similitud Jaccard ───────────────────────────────────────

function tokenize(text) {
  return new Set(
    text.toLowerCase()
      .normalize('NFD').replace(/[̀-ͯ]/g, '')
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter(w => w.length > 2),
  );
}

function jaccard(a, b) {
  let inter = 0;
  for (const t of a) if (b.has(t)) inter++;
  const union = a.size + b.size - inter;
  return union === 0 ? 0 : inter / union;
}

// ─── Carga de FAQs ──────────────────────────────────────────────────────────

function loadFaqs() {
  try {
    const raw = readFileSync(resolve(process.cwd(), 'backend/knowledge/faqs.md'), 'utf8');
    const faqs = [];
    const chunks = raw.split(/^###\s*/m).slice(1);
    for (const chunk of chunks) {
      const nl = chunk.indexOf('\n');
      if (nl === -1) continue;
      const q = chunk.slice(0, nl).trim();
      const a = chunk.slice(nl + 1).trim();
      if (q && a) faqs.push({ q, a, tokens: tokenize(q + ' ' + a) });
    }
    return faqs;
  } catch (_) {
    return [];
  }
}

// ─── Índice de contenido de páginas públicas ────────────────────────────────

function stripHtml(html) {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<!--[\s\S]*?-->/g, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function buildPageIndex() {
  const publicDir = resolve(process.cwd(), 'public');
  const index = [];
  try {
    for (const file of readdirSync(publicDir)) {
      if (extname(file) !== '.html') continue;
      try {
        const html = readFileSync(resolve(publicDir, file), 'utf8');
        const text = stripHtml(html).slice(0, 3000);
        index.push({ file, text, tokens: tokenize(text) });
      } catch (_) {}
    }
  } catch (_) {}
  return index;
}

const FAQS       = loadFaqs();
const PAGE_INDEX = buildPageIndex();

// ─── Construcción de contexto ────────────────────────────────────────────────

export function buildContext(userMessage) {
  const q = tokenize(userMessage);

  const faqMatches = FAQS
    .map(f => ({ ...f, score: jaccard(q, f.tokens) }))
    .filter(f => f.score > 0.05)
    .sort((a, b) => b.score - a.score)
    .slice(0, 3);

  const pageMatches = PAGE_INDEX
    .map(p => ({ ...p, score: jaccard(q, p.tokens) }))
    .filter(p => p.score > 0.03)
    .sort((a, b) => b.score - a.score)
    .slice(0, 2);

  let ctx = '';
  if (faqMatches.length) {
    ctx += 'PREGUNTAS FRECUENTES RELEVANTES:\n';
    for (const f of faqMatches) ctx += `P: ${f.q}\nR: ${f.a}\n\n`;
  }
  if (pageMatches.length) {
    ctx += 'CONTENIDO DEL SITIO:\n';
    for (const p of pageMatches) ctx += `[${p.file}]: ${p.text.slice(0, 400)}\n\n`;
  }
  return ctx;
}

// ─── System prompt de Tito ───────────────────────────────────────────────────

export function buildSystemPrompt(context) {
  return `Sos Tito, el asistente virtual de WJ-INFORMATICA. Tu personalidad es amable, rioplatense y profesional. Siempre usás voseo.

Tu misión:
- Ayudar a los visitantes a entender qué servicios ofrece WJ-INFORMATICA
- Identificar qué solución necesitan para su problema
- Facilitar el contacto con el equipo cuando corresponde

Reglas:
1. Respondé solo sobre temas relacionados con WJ-INFORMATICA y tecnología. Para otros temas, decí amablemente que no podés ayudar con eso.
2. Respuestas cortas y directas (máximo 3 párrafos). Sin exceso de formalidad.
3. Nunca inventes precios, plazos ni compromisos concretos. Siempre derivá al contacto para presupuestos.
4. Si no sabés algo específico o el usuario quiere avanzar, derivá: WhatsApp +598 091 941 935 o wjdev@algoritmos.uy.
5. Usá siempre español rioplatense con voseo.

${context ? `CONTEXTO RELEVANTE:\n${context}` : ''}

Cuando derives al contacto, mencioná:
- WhatsApp: +598 091 941 935
- Correo: wjdev@algoritmos.uy`;
}
