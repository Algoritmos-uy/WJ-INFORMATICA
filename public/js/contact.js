const form      = document.getElementById('contactForm');
const statusEl  = document.getElementById('formStatus');
const submitBtn = document.getElementById('submitBtn');

if (form) {
  form.addEventListener('submit', handleSubmit);
  form.addEventListener('reset', () => { clearErrors(); clearStatus(); });
}

async function handleSubmit(e) {
  e.preventDefault();
  if (!validateForm()) return;

  setLoading(true);
  clearStatus();

  const data = {
    nombre:   field('nombre')?.value.trim()   ?? '',
    email:    field('email')?.value.trim()    ?? '',
    telefono: field('telefono')?.value.trim() ?? '',
    mensaje:  field('mensaje')?.value.trim()  ?? '',
  };

  try {
    const res  = await fetch('/api/contact', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify(data),
    });
    const json = await res.json();

    if (res.ok) {
      showStatus('success', json.message ?? '¡Mensaje enviado!');
      form.reset();
    } else if (res.status === 422 && json.errors) {
      // Errores de validación del servidor
      for (const [field_id, msg] of Object.entries(json.errors)) {
        const el = field(field_id);
        if (el) fieldErr(el, msg);
      }
      const first = form.querySelector('[aria-invalid="true"]');
      first?.focus();
    } else if (res.status === 429) {
      showStatus('error', json.error ?? 'Demasiadas solicitudes. Intentá en unos minutos.');
    } else {
      showStatus('error', json.error ?? 'Ocurrió un error. Intentá de nuevo.');
    }
  } catch (_) {
    showStatus('error', 'No se pudo conectar con el servidor. Revisá tu conexión e intentá de nuevo.');
  } finally {
    setLoading(false);
  }
}

function validateForm() {
  clearErrors();
  let ok = true;

  const nombre  = field('nombre');
  const email   = field('email');
  const mensaje = field('mensaje');

  if (!nombre.value.trim()) {
    fieldErr(nombre, 'El nombre es obligatorio.');
    ok = false;
  }

  if (!email.value.trim()) {
    fieldErr(email, 'El correo electrónico es obligatorio.');
    ok = false;
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.value.trim())) {
    fieldErr(email, 'Introduce un correo electrónico válido.');
    ok = false;
  }

  if (!mensaje.value.trim()) {
    fieldErr(mensaje, 'El mensaje es obligatorio.');
    ok = false;
  } else if (mensaje.value.trim().length < 10) {
    fieldErr(mensaje, 'El mensaje debe tener al menos 10 caracteres.');
    ok = false;
  }

  if (!ok) {
    const first = form.querySelector('[aria-invalid="true"]');
    first?.focus();
  }
  return ok;
}

function setLoading(loading) {
  if (!submitBtn) return;
  submitBtn.disabled = loading;
  submitBtn.textContent = loading ? 'Enviando…' : 'Enviar mensaje';
}

function field(id) { return form.querySelector('#' + id); }

function fieldErr(el, msg) {
  el.setAttribute('aria-invalid', 'true');
  const errId = el.id + '-err';
  let errEl = document.getElementById(errId);
  if (!errEl) {
    errEl = document.createElement('span');
    errEl.id = errId;
    errEl.className = 'form__error';
    errEl.setAttribute('role', 'alert');
    el.parentNode.appendChild(errEl);
  }
  errEl.textContent = msg;
  el.setAttribute('aria-describedby', errId);
}

function clearErrors() {
  form.querySelectorAll('[aria-invalid]').forEach(el => {
    el.removeAttribute('aria-invalid');
    el.removeAttribute('aria-describedby');
  });
  form.querySelectorAll('.form__error').forEach(el => el.remove());
}

function showStatus(type, msg) {
  if (!statusEl) return;
  statusEl.className = 'form__status form__status--' + type;
  statusEl.textContent = msg;
  statusEl.removeAttribute('hidden');
  statusEl.setAttribute('tabindex', '-1');
  statusEl.focus();
}

function clearStatus() {
  if (!statusEl) return;
  statusEl.setAttribute('hidden', '');
  statusEl.textContent = '';
  statusEl.className = 'form__status';
}
