// Estado de la aplicación
let contacts = [];
let selectedId = null;

// ── API ──────────────────────────────────────────────────────────────────────

async function api(method, path, body) {
  const opts = { method, headers: { 'Content-Type': 'application/json' } };
  if (body) opts.body = JSON.stringify(body);
  const res  = await fetch(path, opts);
  const json = await res.json().catch(() => ({}));
  return { status: res.status, ok: res.ok, data: json };
}

async function apiLogin(username, password) {
  return api('POST', '/admin/api/login', { username, password });
}

async function apiLogout() {
  return api('POST', '/admin/api/logout');
}

async function apiGetContacts() {
  return api('GET', '/admin/api/contacts');
}

async function apiUpdateEstado(id, estado) {
  return api('PATCH', `/admin/api/contacts/${id}`, { estado });
}

async function apiDelete(id) {
  return api('DELETE', `/admin/api/contacts/${id}`);
}

// ── Vistas ───────────────────────────────────────────────────────────────────

function showView(id) {
  ['view-loading', 'view-login', 'view-dashboard', 'view-detail'].forEach(v => {
    document.getElementById(v)?.classList.toggle('hidden', v !== id);
  });
}

// ── Login ────────────────────────────────────────────────────────────────────

document.getElementById('login-form')?.addEventListener('submit', async e => {
  e.preventDefault();
  const form = e.target;
  const username = form.username.value.trim();
  const password = form.password.value;
  const alertEl  = document.getElementById('login-alert');
  const btn      = form.querySelector('button[type="submit"]');

  alertEl.classList.add('hidden');
  btn.disabled = true;
  btn.textContent = 'Ingresando…';

  const { ok, data } = await apiLogin(username, password).catch(() => ({ ok: false, data: {} }));

  btn.disabled = false;
  btn.textContent = 'Iniciar sesión';

  if (ok) {
    await loadDashboard();
  } else {
    alertEl.textContent = data.error ?? 'Error al iniciar sesión.';
    alertEl.classList.remove('hidden');
  }
});

// ── Dashboard ────────────────────────────────────────────────────────────────

async function loadDashboard() {
  const { ok, data } = await apiGetContacts().catch(() => ({ ok: false, data: {} }));
  if (!ok) { showView('view-login'); return; }

  contacts = data.contacts ?? [];
  renderStats();
  renderTable();
  showView('view-dashboard');
}

function renderStats() {
  const total     = contacts.length;
  const pendiente = contacts.filter(c => c.estado === 'pendiente').length;
  const atendida  = contacts.filter(c => c.estado === 'atendida').length;

  setText('stat-total',     total);
  setText('stat-pendiente', pendiente);
  setText('stat-atendida',  atendida);
}

function renderTable() {
  const tbody = document.getElementById('contacts-tbody');
  if (!tbody) return;

  if (contacts.length === 0) {
    tbody.innerHTML = '<tr><td colspan="6" class="empty-state">No hay consultas registradas.</td></tr>';
    return;
  }

  tbody.innerHTML = contacts.map(c => `
    <tr data-id="${c.id}" class="${c.id === selectedId ? 'selected' : ''}">
      <td class="td-id">${c.id}</td>
      <td><strong>${esc(c.nombre)}</strong><div class="td-msg">${esc(c.email)}</div></td>
      <td class="td-msg">${esc(truncate(c.mensaje, 60))}</td>
      <td><span class="badge badge-${c.estado}">${labelEstado(c.estado)}</span></td>
      <td class="td-date">${formatDate(c.created_at)}</td>
      <td class="td-actions">
        <button class="btn btn-danger btn-sm" data-delete="${c.id}" title="Eliminar" aria-label="Eliminar consulta ${c.id}">✕</button>
      </td>
    </tr>
  `).join('');

  // Click en fila → detalle
  tbody.querySelectorAll('tr[data-id]').forEach(row => {
    row.addEventListener('click', e => {
      if (e.target.dataset.delete) return;
      showDetail(parseInt(row.dataset.id, 10));
    });
  });

  // Botones eliminar
  tbody.querySelectorAll('[data-delete]').forEach(btn => {
    btn.addEventListener('click', e => {
      e.stopPropagation();
      confirmDelete(parseInt(btn.dataset.delete, 10));
    });
  });
}

// ── Detalle ──────────────────────────────────────────────────────────────────

function showDetail(id) {
  const c = contacts.find(x => x.id === id);
  if (!c) return;
  selectedId = id;

  setText('detail-nombre',  c.nombre);
  setText('detail-email',   c.email);
  setText('detail-tel',     c.telefono || '—');
  setText('detail-mensaje', c.mensaje);
  setText('detail-fecha',   formatDate(c.created_at, true));
  setText('detail-id',      `Consulta #${c.id}`);

  const sel = document.getElementById('detail-estado');
  if (sel) sel.value = c.estado;

  showView('view-detail');
  renderTable(); // actualiza fila seleccionada
}

document.getElementById('btn-back')?.addEventListener('click', () => {
  selectedId = null;
  showView('view-dashboard');
  renderTable();
});

document.getElementById('detail-estado')?.addEventListener('change', async e => {
  if (!selectedId) return;
  const estado = e.target.value;
  const { ok, data } = await apiUpdateEstado(selectedId, estado);
  if (ok) {
    const c = contacts.find(x => x.id === selectedId);
    if (c) c.estado = estado;
    renderStats();
    renderTable();
  } else {
    alert(data?.error ?? 'No se pudo cambiar el estado.');
    // Restaurar valor anterior
    const c = contacts.find(x => x.id === selectedId);
    if (c) e.target.value = c.estado;
  }
});

document.getElementById('btn-delete-detail')?.addEventListener('click', () => {
  if (selectedId) confirmDelete(selectedId, true);
});

async function confirmDelete(id, fromDetail = false) {
  const c = contacts.find(x => x.id === id);
  if (!c) return;
  if (!confirm(`¿Eliminar la consulta #${id} de ${c.nombre}?\nEsta acción no puede deshacerse.`)) return;

  const { ok, data } = await apiDelete(id);
  if (ok) {
    contacts = contacts.filter(x => x.id !== id);
    if (fromDetail || selectedId === id) { selectedId = null; showView('view-dashboard'); }
    renderStats();
    renderTable();
  } else {
    alert(data?.error ?? 'No se pudo eliminar la consulta.');
  }
}

// ── Logout ───────────────────────────────────────────────────────────────────

document.getElementById('btn-logout')?.addEventListener('click', async () => {
  await apiLogout();
  contacts = [];
  selectedId = null;
  showView('view-login');
});

// ── Arranque ─────────────────────────────────────────────────────────────────

(async () => {
  showView('view-loading');
  const { ok } = await apiGetContacts().catch(() => ({ ok: false }));
  if (ok) {
    const { data } = await apiGetContacts();
    contacts = data.contacts ?? [];
    renderStats();
    renderTable();
    showView('view-dashboard');
  } else {
    showView('view-login');
  }
})();

// ── Utilidades ───────────────────────────────────────────────────────────────

function setText(id, val) {
  const el = document.getElementById(id);
  if (el) el.textContent = val;
}

function esc(str) {
  return String(str ?? '')
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

function truncate(str, n) {
  return str.length > n ? str.slice(0, n) + '…' : str;
}

function labelEstado(e) {
  return { pendiente: 'Pendiente', leida: 'Leída', atendida: 'Atendida' }[e] ?? e;
}

function formatDate(iso, full = false) {
  if (!iso) return '—';
  const d = new Date(iso.endsWith('Z') ? iso : iso + 'Z');
  if (full) return d.toLocaleString('es-UY', { dateStyle: 'medium', timeStyle: 'short' });
  return d.toLocaleDateString('es-UY', { day: '2-digit', month: '2-digit', year: '2-digit' });
}
