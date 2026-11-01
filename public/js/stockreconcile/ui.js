// Módulo de UI — StockReconcile
// Renderiza KPIs, tabla de resultados, filtros y mensajes de estado.

import { i18n } from './i18n.js';

// ─── Íconos SVG inline ────────────────────────────────────────────────────────

const ICONS = {
  run:    `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polygon points="5 3 19 12 5 21 5 3"/></svg>`,
  export: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>`,
  file:   `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>`,
  lock:   `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>`,
  check:  `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="20 6 9 17 4 12"/></svg>`,
};

// ─── KPIs ─────────────────────────────────────────────────────────────────────

export function renderKPIs(summary, placeholder = false) {
  const grid = document.getElementById('srKpiGrid');
  if (!grid) return;

  const t = (k) => i18n.t(k);

  const items = [
    { cls: 'total',     key: 'kpi_analyzed',  val: summary?.total     ?? '—' },
    { cls: 'unchanged', key: 'kpi_unchanged',  val: summary?.unchanged ?? '—' },
    { cls: 'increase',  key: 'kpi_increase',   val: summary?.increase  ?? '—' },
    { cls: 'decrease',  key: 'kpi_decrease',   val: summary?.decrease  ?? '—' },
    { cls: 'new',       key: 'kpi_new',        val: summary?.new       ?? '—' },
    { cls: 'missing',   key: 'kpi_missing',    val: summary?.missing   ?? '—' },
    { cls: 'review',    key: 'kpi_review',     val: summary?.review    ?? '—' },
  ];

  grid.innerHTML = items.map(({ cls, key, val }) => `
    <div class="sr-kpi sr-kpi--${cls}${placeholder ? ' sr-kpi--placeholder' : ''}" role="status" aria-label="${t(key)}: ${val}">
      <span class="sr-kpi__value">${val}</span>
      <span class="sr-kpi__label">${t(key)}</span>
    </div>`).join('');
}

// ─── Tabla de resultados ──────────────────────────────────────────────────────

let _allRecords   = [];
let _sortCol      = 'status';
let _sortAsc      = true;
let _filterStatus = '';
let _searchTerm   = '';

export function setRecords(records) {
  _allRecords   = records;
  _filterStatus = '';
  _searchTerm   = '';
  const sel = document.getElementById('srFilterStatus');
  if (sel) sel.value = '';
  const srch = document.getElementById('srSearch');
  if (srch) srch.value = '';
  renderTable();
}

export function renderTable() {
  const wrap = document.getElementById('srTableWrap');
  const foot = document.getElementById('srTableFooter');
  if (!wrap) return;

  const t = (k, ...a) => i18n.t(k, ...a);

  if (!_allRecords.length) {
    wrap.innerHTML = `
      <div class="sr-empty" role="status">
        <span class="sr-empty__icon" aria-hidden="true">📋</span>
        <p class="sr-empty__text">${t('table_no_run')}</p>
      </div>`;
    if (foot) foot.textContent = '';
    return;
  }

  // Filtrar
  let rows = _allRecords.filter(r => {
    if (_filterStatus && r.status !== _filterStatus) return false;
    if (_searchTerm) {
      const q = _searchTerm.toLowerCase();
      if (!r.sku.toLowerCase().includes(q) && !r.description.toLowerCase().includes(q)) return false;
    }
    return true;
  });

  // Ordenar
  const ORDER_STATUS = { duplicate:0, invalid:1, new:2, missing:3, decrease:4, increase:5, unchanged:6 };
  rows = [...rows].sort((a, b) => {
    let va = a[_sortCol], vb = b[_sortCol];
    if (_sortCol === 'status') { va = ORDER_STATUS[a.status] ?? 9; vb = ORDER_STATUS[b.status] ?? 9; }
    const cmp = (typeof va === 'number' && typeof vb === 'number')
      ? va - vb
      : String(va ?? '').localeCompare(String(vb ?? ''), undefined, { numeric: true });
    return _sortAsc ? cmp : -cmp;
  });

  if (!rows.length) {
    wrap.innerHTML = `
      <div class="sr-empty" role="status">
        <span class="sr-empty__icon" aria-hidden="true">🔍</span>
        <p class="sr-empty__text">${t('table_empty')}</p>
      </div>`;
    if (foot) foot.textContent = t('rows_shown', 0, _allRecords.length);
    return;
  }

  const thSort = (col, label) => {
    const dir = _sortCol === col ? (_sortAsc ? 'ascending' : 'descending') : 'none';
    return `<th scope="col" data-col="${col}" aria-sort="${dir}" tabindex="0">${label}</th>`;
  };

  const fmtNum  = n => n === null || n === undefined ? '—' : new Intl.NumberFormat('es-UY').format(n);
  const fmtDiff = (n, status) => {
    if (n === null || n === undefined || status === 'duplicate' || status === 'invalid') return '—';
    if (n === 0) return `<span class="diff-zero">0</span>`;
    return n > 0
      ? `<span class="diff-pos">+${new Intl.NumberFormat('es-UY').format(n)}</span>`
      : `<span class="diff-neg">${new Intl.NumberFormat('es-UY').format(n)}</span>`;
  };

  const statusBadge = (s) => `<span class="sr-status sr-status--${s}">${t('status_' + s)}</span>`;
  const noteText    = (notes) => (notes ?? []).map(k => t(k)).filter(Boolean).join(' · ');

  wrap.innerHTML = `
    <table class="sr-table" aria-label="${t('table_title')}">
      <thead>
        <tr>
          ${thSort('sku',         t('col_sku'))}
          ${thSort('description', t('col_desc'))}
          ${thSort('qtyPrev',     t('col_prev'))}
          ${thSort('qtyCurr',     t('col_curr'))}
          ${thSort('diff',        t('col_diff'))}
          ${thSort('status',      t('col_status'))}
          <th scope="col">${t('col_notes')}</th>
        </tr>
      </thead>
      <tbody>
        ${rows.map(r => `
          <tr>
            <td class="col-sku">${escHtml(r.sku)}</td>
            <td>${escHtml(r.description)}</td>
            <td class="col-num">${fmtNum(r.qtyPrev)}</td>
            <td class="col-num">${fmtNum(r.qtyCurr)}</td>
            <td class="col-diff">${fmtDiff(r.diff, r.status)}</td>
            <td>${statusBadge(r.status)}</td>
            <td class="col-notes">${escHtml(noteText(r.notes))}</td>
          </tr>`).join('')}
      </tbody>
    </table>`;

  // Cabeceras ordenables
  wrap.querySelectorAll('th[data-col]').forEach(th => {
    th.style.cursor = 'pointer';
    const activate = () => {
      const col = th.dataset.col;
      if (_sortCol === col) _sortAsc = !_sortAsc;
      else { _sortCol = col; _sortAsc = true; }
      renderTable();
    };
    th.addEventListener('click', activate);
    th.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); activate(); }});
  });

  if (foot) foot.textContent = t('rows_shown', rows.length, _allRecords.length);
}

// ─── Populación del select de filtro de estado ────────────────────────────────

export function buildFilterOptions() {
  const sel = document.getElementById('srFilterStatus');
  if (!sel) return;
  const t = (k) => i18n.t(k);
  const statuses = ['unchanged','increase','decrease','new','missing','invalid','duplicate'];
  sel.innerHTML = `<option value="">${t('filter_all')}</option>` +
    statuses.map(s => `<option value="${s}">${t('status_' + s)}</option>`).join('');
  sel.value = _filterStatus;
}

export function onFilterChange() {
  const sel  = document.getElementById('srFilterStatus');
  const srch = document.getElementById('srSearch');
  _filterStatus = sel?.value  ?? '';
  _searchTerm   = srch?.value ?? '';
  renderTable();
}

// ─── Mensajes de estado ───────────────────────────────────────────────────────

export function setStatusBar(type, text) {
  const bar = document.getElementById('srStatusBar');
  if (!bar) return;
  bar.className = `sr-status-bar sr-status-bar--${type}`;
  bar.textContent = text;
}

export function clearStatusBar() {
  const bar = document.getElementById('srStatusBar');
  if (!bar) return;
  bar.className = 'sr-status-bar';
  bar.textContent = '';
}

// ─── Estado del botón Run ─────────────────────────────────────────────────────

export function setRunning(running) {
  const btn = document.getElementById('srRunBtn');
  if (!btn) return;
  btn.disabled = running;
  btn.innerHTML = running
    ? `<span style="animation:spin .7s linear infinite;display:inline-block">⟳</span> ${i18n.t('btn_running')}`
    : `${ICONS.run} ${i18n.t('btn_run')}`;
}

// ─── Botón exportar ───────────────────────────────────────────────────────────

export function setExportEnabled(enabled) {
  const btn = document.getElementById('srExportBtn');
  if (!btn) return;
  btn.disabled = !enabled;
}

// ─── Label de modo activo ─────────────────────────────────────────────────────

export function setModeLabel(mode, prevName, currName) {
  const el = document.getElementById('srModeLabel');
  if (!el) return;
  const t = (k) => i18n.t(k);
  el.innerHTML = `
    <span class="sr-mode-dot" aria-hidden="true"></span>
    ${mode === 'demo' ? t('mode_demo') : t('mode_user')}
    &nbsp;·&nbsp;
    <strong>${escHtml(prevName)}</strong> → <strong>${escHtml(currName)}</strong>
  `;
}

// ─── i18n: re-render de todos los textos ─────────────────────────────────────

export function applyTranslations() {
  const t = (k) => i18n.t(k);

  // Elementos con data-i18n
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.dataset.i18n;
    el.textContent = t(key);
  });

  // Placeholders
  document.querySelectorAll('[data-i18n-ph]').forEach(el => {
    el.placeholder = t(el.dataset.i18nPh);
  });

  // aria-label
  document.querySelectorAll('[data-i18n-aria]').forEach(el => {
    el.setAttribute('aria-label', t(el.dataset.i18nAria));
  });

  // Botón run
  const runBtn = document.getElementById('srRunBtn');
  if (runBtn && !runBtn.disabled) {
    runBtn.innerHTML = `${ICONS.run} ${t('btn_run')}`;
  }

  // Botón export
  const expBtn = document.getElementById('srExportBtn');
  if (expBtn) {
    expBtn.innerHTML = `${ICONS.export} ${t('btn_export')}`;
    expBtn.title = t('export_tooltip');
  }

  // Select de filtro (re-poblar)
  buildFilterOptions();

  // Volver a renderizar tabla para actualizar etiquetas de estado
  if (_allRecords.length) renderTable();

  // KPIs: si están en placeholder, re-render
  const grid = document.getElementById('srKpiGrid');
  if (grid?.querySelector('.sr-kpi--placeholder')) renderKPIs(null, true);
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function escHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
