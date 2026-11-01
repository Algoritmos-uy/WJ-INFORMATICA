// Chatbot Tito — widget flotante WJ-INFORMATICA

const MAX_MSGS   = 20;
const WELCOME    = 'Hola, soy Tito 👋 El asistente virtual de WJ-INFORMATICA. ¿En qué puedo ayudarte hoy?';
const SUGGESTIONS = [
  '¿Qué servicios ofrecen?',
  '¿Hacen sitios web?',
  '¿Desarrollan chatbots con IA?',
  '¿Cómo puedo contactarlos?',
];

// Estado de conversación (en memoria — se pierde al navegar a otra página)
let history  = [];
let count    = 0;
let loading  = false;

// ─── Estilos ─────────────────────────────────────────────────────────────────

const CSS = `
.tito-btn {
  position: fixed;
  bottom: calc(1.5rem + 56px + 16px + 250px);
  right: 1.5rem;
  width: 56px; height: 56px;
  border-radius: 50%;
  background: var(--c-primary, #2563eb);
  color: #fff; border: none; cursor: pointer;
  display: flex; align-items: center; justify-content: center;
  box-shadow: 0 4px 14px rgba(0,0,0,.28);
  z-index: 91; padding: 0; overflow: hidden;
  transition: transform .2s, box-shadow .2s;
}
.tito-btn:hover  { transform: scale(1.08); box-shadow: 0 6px 20px rgba(0,0,0,.35); }
.tito-btn--open  { background: #374151; overflow: visible; }

.tito-window {
  position: fixed;
  bottom: 80px;
  right: calc(1.5rem + 56px + 12px);
  width: 340px; height: 480px;
  max-height: calc(100vh - 100px);
  min-height: 280px;
  background: var(--c-surface, #fff);
  border: 1px solid var(--c-border, #e5e7eb);
  border-radius: 16px;
  box-shadow: 0 8px 32px rgba(0,0,0,.18);
  display: flex; flex-direction: column;
  overflow: hidden; z-index: 91;
}
.tito-window[hidden] { display: none !important; }

.tito-header {
  background: var(--c-primary, #2563eb);
  color: #fff; padding: .75rem 1rem;
  display: flex; align-items: center; gap: .5rem;
  flex-shrink: 0;
}
.tito-avatar {
  width: 34px; height: 34px; border-radius: 50%;
  background: rgba(255,255,255,.2);
  display: flex; align-items: center; justify-content: center;
  flex-shrink: 0; overflow: hidden;
}
.tito-avatar img { width: 100%; height: 100%; object-fit: cover; border-radius: 50%; }
.tito-header-info { flex: 1; }
.tito-header-name { font-weight: 700; font-size: .9rem; line-height: 1.2; }
.tito-header-sub  { font-size: .72rem; opacity: .85; }
.tito-close {
  background: none; border: none; color: #fff; cursor: pointer;
  padding: .3rem; border-radius: 6px; display: flex; align-items: center;
  opacity: .8; transition: opacity .15s; line-height: 0;
}
.tito-close:hover { opacity: 1; }

.tito-msgs {
  flex: 1; overflow-y: auto; padding: .75rem 1rem;
  display: flex; flex-direction: column; gap: .5rem;
  scroll-behavior: smooth;
}
.tito-msg {
  max-width: 88%; padding: .5rem .8rem;
  border-radius: 12px; font-size: .875rem; line-height: 1.5;
  word-break: break-word; white-space: pre-wrap;
}
.tito-msg--bot  {
  background: var(--c-surface-2, #f3f4f6);
  color: var(--c-text, #111);
  align-self: flex-start; border-bottom-left-radius: 4px;
}
.tito-msg--user {
  background: var(--c-primary, #2563eb); color: #fff;
  align-self: flex-end; border-bottom-right-radius: 4px;
}
.tito-typing {
  align-self: flex-start;
  background: var(--c-surface-2, #f3f4f6);
  padding: .55rem .8rem; border-radius: 12px; border-bottom-left-radius: 4px;
  display: flex; align-items: center; gap: 5px;
}
.tito-typing span {
  width: 7px; height: 7px; border-radius: 50%;
  background: var(--c-text-muted, #9ca3af); display: inline-block;
  animation: titoBounce .9s ease-in-out infinite;
}
.tito-typing span:nth-child(2) { animation-delay: .15s; }
.tito-typing span:nth-child(3) { animation-delay: .3s; }
@keyframes titoBounce {
  0%,60%,100% { transform: translateY(0); }
  30%          { transform: translateY(-6px); }
}

.tito-sugg {
  padding: 0 .75rem .4rem;
  display: flex; flex-direction: column; gap: .35rem;
  flex-shrink: 0;
}
.tito-sugg-btn {
  background: var(--c-surface-2, #f3f4f6);
  border: 1px solid var(--c-border, #e5e7eb);
  border-radius: 8px; padding: .38rem .7rem;
  font-size: .8rem; text-align: left; cursor: pointer;
  color: var(--c-text, #111); transition: background .15s; font-family: inherit;
}
.tito-sugg-btn:hover { background: var(--c-border, #e5e7eb); }

.tito-counter {
  text-align: right; font-size: .7rem;
  color: var(--c-text-muted, #9ca3af);
  padding: 0 1rem .25rem; flex-shrink: 0; min-height: 1.2em;
}

.tito-form {
  flex-shrink: 0; padding: .6rem .75rem;
  border-top: 1px solid var(--c-border, #e5e7eb);
  display: flex; gap: .5rem; align-items: flex-end;
}
.tito-input {
  flex: 1; resize: none; border: 1px solid var(--c-border, #e5e7eb);
  border-radius: 10px; padding: .5rem .75rem;
  font-size: .875rem; font-family: inherit;
  background: var(--c-surface, #fff); color: var(--c-text, #111);
  min-height: 38px; max-height: 100px; line-height: 1.4;
  outline-offset: 2px;
}
.tito-input:focus { outline: 2px solid var(--c-primary, #2563eb); border-color: transparent; }
.tito-send {
  width: 38px; height: 38px; border-radius: 10px; flex-shrink: 0;
  background: var(--c-primary, #2563eb); color: #fff; border: none; cursor: pointer;
  display: flex; align-items: center; justify-content: center;
  transition: filter .15s;
}
.tito-send:hover:not(:disabled) { filter: brightness(1.1); }
.tito-send:disabled { opacity: .45; cursor: default; }

.tito-bubble {
  position: fixed;
  bottom: calc(1.5rem + 56px + 16px + 250px + 8px);
  right: calc(1.5rem + 56px + 14px);
  background: var(--c-primary, #2563eb);
  color: #fff;
  padding: .42rem .9rem;
  border-radius: 20px;
  font-size: .72rem;
  font-weight: 700;
  white-space: nowrap;
  letter-spacing: .05em;
  box-shadow: 0 4px 14px rgba(0,0,0,.22);
  z-index: 91;
  animation: titoPopIn .4s cubic-bezier(.34,1.56,.64,1) both;
  animation-delay: .8s;
  opacity: 0;
}
.tito-bubble::after {
  content: '';
  position: absolute;
  right: -7px;
  top: 50%;
  transform: translateY(-50%);
  border: 6px solid transparent;
  border-left-color: var(--c-primary, #2563eb);
  border-right-width: 0;
}
.tito-bubble[hidden] { display: none !important; }
@keyframes titoPopIn {
  from { opacity: 0; transform: scale(.75) translateX(8px); }
  to   { opacity: 1; transform: scale(1)   translateX(0);   }
}

@media (max-width: 480px) {
  .tito-window {
    width: calc(100vw - 1.5rem);
    right: .75rem;
    height: 65vh;
    bottom: 72px;
  }
  .tito-btn    { bottom: calc(1.5rem + 56px + 16px + 160px); }
  .tito-bubble { bottom: calc(1.5rem + 56px + 16px + 160px + 8px); right: calc(.75rem + 56px + 14px); }
}
`;

// ─── Iconos SVG ───────────────────────────────────────────────────────────────

const AVATAR_SRC = new URL('../assets/images/Tito.png', import.meta.url).href;
const IMG_TITO   = `<img src="${AVATAR_SRC}" alt="Tito" width="56" height="56" style="width:100%;height:100%;object-fit:cover;border-radius:50%;">`;
const IMG_AVATAR = `<img src="${AVATAR_SRC}" alt="" width="34" height="34" aria-hidden="true">`;
const SVG_CLOSE  = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" aria-hidden="true"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>`;
const SVG_SEND   = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>`;

// ─── Bootstrap ────────────────────────────────────────────────────────────────

function init() {
  // Inyectar estilos
  const style = document.createElement('style');
  style.textContent = CSS;
  document.head.appendChild(style);

  // Burbuja "Pregunta lo que quieras"
  const bubble = document.createElement('div');
  bubble.className = 'tito-bubble';
  bubble.setAttribute('aria-hidden', 'true');
  bubble.textContent = 'PREGUNTA LO QUE QUIERAS';
  const bubbleDismissed = (() => { try { return sessionStorage.getItem('tito-bubble-seen'); } catch(_) { return false; } })();
  if (bubbleDismissed) bubble.setAttribute('hidden', '');
  document.body.appendChild(bubble);
  // Auto-ocultar después de 6 s
  if (!bubbleDismissed) {
    setTimeout(() => {
      bubble.setAttribute('hidden', '');
      try { sessionStorage.setItem('tito-bubble-seen', '1'); } catch(_) {}
    }, 7000);
  }

  // Botón toggle
  const btn = document.createElement('button');
  btn.className = 'tito-btn';
  btn.setAttribute('aria-label', 'Abrir chat con Tito');
  btn.setAttribute('aria-expanded', 'false');
  btn.setAttribute('aria-controls', 'titoWindow');
  btn.innerHTML = IMG_TITO;

  // Ventana del chat
  const win = document.createElement('div');
  win.id = 'titoWindow';
  win.className = 'tito-window';
  win.setAttribute('hidden', '');
  win.setAttribute('role', 'dialog');
  win.setAttribute('aria-modal', 'false');
  win.setAttribute('aria-label', 'Chat con Tito — WJ-INFORMATICA');
  win.innerHTML = `
    <div class="tito-header">
      <div class="tito-avatar">${IMG_AVATAR}</div>
      <div class="tito-header-info">
        <div class="tito-header-name">Tito</div>
        <div class="tito-header-sub">Asistente WJ-INFORMATICA</div>
      </div>
      <button class="tito-close" aria-label="Cerrar chat">${SVG_CLOSE}</button>
    </div>
    <div class="tito-msgs" id="titoMsgs" aria-live="polite" aria-atomic="false"></div>
    <div class="tito-sugg" id="titoSugg" aria-label="Preguntas frecuentes"></div>
    <div class="tito-counter" id="titoCounter" aria-live="polite" aria-atomic="true"></div>
    <form class="tito-form" id="titoForm" autocomplete="off" novalidate>
      <textarea
        class="tito-input" id="titoInput"
        placeholder="Escribí tu consulta…"
        rows="1" maxlength="1000"
        aria-label="Mensaje para Tito"
      ></textarea>
      <button type="submit" class="tito-send" id="titoSend" aria-label="Enviar mensaje">
        ${SVG_SEND}
      </button>
    </form>`;

  document.body.append(btn, win);

  const msgs    = win.querySelector('#titoMsgs');
  const sugg    = win.querySelector('#titoSugg');
  const counter = win.querySelector('#titoCounter');
  const form    = win.querySelector('#titoForm');
  const input   = win.querySelector('#titoInput');
  const sendBtn = win.querySelector('#titoSend');
  const closeBtn = win.querySelector('.tito-close');

  let isOpen = false;

  // ── Apertura / cierre ────────────────────────────────────────────────────

  function open() {
    isOpen = true;
    win.removeAttribute('hidden');
    btn.classList.add('tito-btn--open');
    btn.setAttribute('aria-expanded', 'true');
    btn.innerHTML = SVG_CLOSE;  // imagen ocultada vía CSS cuando --open
    bubble.setAttribute('hidden', '');
    try { sessionStorage.setItem('tito-bubble-seen', '1'); } catch(_) {}
    if (msgs.children.length === 0) {
      addMsg('bot', WELCOME);
      showSugg();
    }
    requestAnimationFrame(() => input.focus());
  }

  function close() {
    isOpen = false;
    win.setAttribute('hidden', '');
    btn.classList.remove('tito-btn--open');
    btn.setAttribute('aria-expanded', 'false');
    btn.innerHTML = IMG_TITO;
    btn.focus();
  }

  btn.addEventListener('click', () => isOpen ? close() : open());
  closeBtn.addEventListener('click', close);

  // Cerrar con Escape
  win.addEventListener('keydown', e => { if (e.key === 'Escape') close(); });

  // ── Textarea auto-resize ─────────────────────────────────────────────────

  input.addEventListener('input', () => {
    input.style.height = 'auto';
    input.style.height = Math.min(input.scrollHeight, 100) + 'px';
  });

  // Enter = enviar; Shift+Enter = nueva línea
  input.addEventListener('keydown', e => {
    if (e.key === 'Enter' && !e.shiftKey && !loading) {
      e.preventDefault();
      form.dispatchEvent(new SubmitEvent('submit', { cancelable: true }));
    }
  });

  // ── Envío ────────────────────────────────────────────────────────────────

  form.addEventListener('submit', async e => {
    e.preventDefault();
    const text = input.value.trim();
    if (!text || loading || count >= MAX_MSGS) return;
    input.value = '';
    input.style.height = 'auto';
    hideSugg();
    await send(text);
  });

  async function send(text) {
    addMsg('user', text);
    const typing = addTyping();
    loading = true;
    sendBtn.disabled = true;

    // Enviamos el historial previo (sin el mensaje actual)
    const payload = { message: text, history };

    try {
      const res  = await fetch('/api/chat', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify(payload),
      });
      const data = await res.json();
      removeTyping(typing);

      if (res.ok) {
        count++;
        history.push({ role: 'user', content: text });
        history.push({ role: 'assistant', content: data.reply ?? '' });
        addMsg('bot', data.reply ?? 'Sin respuesta.');
        updateCounter(data.remaining ?? (MAX_MSGS - count));
        if (data.limit_reached || count >= MAX_MSGS) lockInput();
      } else if (res.status === 429) {
        count = MAX_MSGS;
        addMsg('bot', data.error ?? 'Alcanzaste el límite de mensajes.');
        lockInput();
      } else {
        addMsg('bot', data.error ?? 'Ocurrió un error. Intentá de nuevo.');
      }
    } catch (_) {
      removeTyping(typing);
      addMsg('bot', 'No pude conectarme. Revisá tu conexión e intentá de nuevo.');
    } finally {
      loading = false;
      if (count < MAX_MSGS) sendBtn.disabled = false;
      scrollDown();
    }
  }

  // ── DOM helpers ──────────────────────────────────────────────────────────

  function addMsg(role, text) {
    const el = document.createElement('div');
    el.className = `tito-msg tito-msg--${role}`;
    el.textContent = text;
    msgs.appendChild(el);
    scrollDown();
    return el;
  }

  function addTyping() {
    const el = document.createElement('div');
    el.className = 'tito-typing';
    el.setAttribute('aria-label', 'Tito está escribiendo');
    el.innerHTML = '<span></span><span></span><span></span>';
    msgs.appendChild(el);
    scrollDown();
    return el;
  }

  function removeTyping(el) { el?.remove(); }

  function scrollDown() {
    msgs.scrollTop = msgs.scrollHeight;
  }

  function showSugg() {
    sugg.innerHTML = '';
    for (const s of SUGGESTIONS) {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'tito-sugg-btn';
      b.textContent = s;
      b.addEventListener('click', () => {
        hideSugg();
        if (!loading && count < MAX_MSGS) {
          input.value = '';
          send(s);
        }
      });
      sugg.appendChild(b);
    }
  }

  function hideSugg() { sugg.innerHTML = ''; }

  function updateCounter(remaining) {
    if (remaining <= 5 && remaining > 0) {
      counter.textContent = `${remaining} mensaje${remaining !== 1 ? 's' : ''} restante${remaining !== 1 ? 's' : ''}`;
    } else if (remaining <= 0) {
      counter.textContent = 'Límite alcanzado';
    } else {
      counter.textContent = '';
    }
  }

  function lockInput() {
    sendBtn.disabled = true;
    input.disabled   = true;
    input.placeholder = 'Límite alcanzado — contactanos directamente';
    counter.textContent = 'Límite de 20 mensajes alcanzado';
  }
}

init();
