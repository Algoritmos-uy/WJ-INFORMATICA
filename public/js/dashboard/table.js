// Tabla de registros — sortable + paginada (25 filas/página)

const PAGE_SIZE = 25;

let state = {
  registros: [],
  sortCol:   'periodo',
  sortAsc:   true,
  pagina:    1,
};

// ─── Formato ──────────────────────────────────────────────────────────────────

const fmtUYU = new Intl.NumberFormat('es-UY', { style: 'currency', currency: 'UYU', maximumFractionDigits: 0 });
const fmtNum = new Intl.NumberFormat('es-UY');

function fmt(col, val) {
  if (['ingresos', 'costos'].includes(col)) return fmtUYU.format(val);
  return fmtNum.format(val);
}

function labelPeriodo(yyyymm) {
  const [y, m] = yyyymm.split('-').map(Number);
  return new Date(y, m - 1, 1).toLocaleDateString('es-UY', { month: 'short', year: 'numeric' });
}

// ─── Columnas ─────────────────────────────────────────────────────────────────

const COLS = [
  { key: 'periodo',              label: 'Período',     render: v => labelPeriodo(v) },
  { key: 'categoria',            label: 'Categoría',   render: v => v },
  { key: 'region',               label: 'Región',      render: v => v },
  { key: 'canal',                label: 'Canal',       render: v => v },
  { key: 'operaciones',          label: 'Operaciones', render: v => fmt('operaciones', v) },
  { key: 'ingresos',             label: 'Ingresos',    render: v => fmt('ingresos', v) },
  { key: 'costos',               label: 'Costos',      render: v => fmt('costos', v) },
  { key: 'clientes_nuevos',      label: 'Cl. nuevos',  render: v => fmtNum.format(v) },
  { key: 'clientes_recurrentes', label: 'Cl. recurr.', render: v => fmtNum.format(v) },
];

// ─── Render ───────────────────────────────────────────────────────────────────

export function renderTabla(registros) {
  state.registros = registros;
  state.pagina    = 1;
  renderImpl();
}

export function actualizarTabla(registros) {
  renderTabla(registros);
}

function renderImpl() {
  const tabla = document.getElementById('tablaContainer');
  if (!tabla) return;

  const sorted = ordenar(state.registros, state.sortCol, state.sortAsc);
  const total  = sorted.length;
  const pages  = Math.max(1, Math.ceil(total / PAGE_SIZE));
  state.pagina = Math.min(state.pagina, pages);

  const start  = (state.pagina - 1) * PAGE_SIZE;
  const slice  = sorted.slice(start, start + PAGE_SIZE);

  tabla.innerHTML = `
    <div class="tabla-info" aria-live="polite">
      Mostrando ${total === 0 ? 0 : start + 1}–${Math.min(start + PAGE_SIZE, total)} de ${fmtNum.format(total)} registros
    </div>
    <div class="tabla-wrap" role="region" aria-label="Tabla de registros" tabindex="0">
      <table class="tabla" aria-label="Datos comerciales filtrados">
        <thead>
          <tr>
            ${COLS.map(col => thCell(col)).join('')}
          </tr>
        </thead>
        <tbody>
          ${slice.length === 0
            ? `<tr><td colspan="${COLS.length}" class="tabla__empty">Sin resultados para los filtros aplicados</td></tr>`
            : slice.map(r => fila(r)).join('')
          }
        </tbody>
      </table>
    </div>
    ${paginacion(state.pagina, pages, total)}
  `;

  attachListeners(tabla, pages);
}

function thCell(col) {
  const active = state.sortCol === col.key;
  const dir    = active ? (state.sortAsc ? 'ascending' : 'descending') : 'none';
  const arrow  = active ? (state.sortAsc ? ' ↑' : ' ↓') : '';
  return `<th scope="col" class="tabla__th${active ? ' tabla__th--active' : ''}"
    data-sort="${col.key}" aria-sort="${dir}" tabindex="0" role="columnheader button">
    ${col.label}${arrow}
  </th>`;
}

function fila(r) {
  return `<tr class="tabla__tr">
    ${COLS.map(col => `<td class="tabla__td tabla__td--${col.key}">${col.render(r[col.key])}</td>`).join('')}
  </tr>`;
}

function paginacion(pagActual, pages, total) {
  if (pages <= 1) return '';
  const prev = pagActual > 1;
  const next = pagActual < pages;

  // Ventana de páginas: mostrar ±2 alrededor de la actual
  const ventana = [];
  for (let p = 1; p <= pages; p++) {
    if (p === 1 || p === pages || (p >= pagActual - 2 && p <= pagActual + 2)) {
      ventana.push(p);
    }
  }

  const items = [];
  let prev_p = null;
  for (const p of ventana) {
    if (prev_p !== null && p - prev_p > 1) items.push('<span class="pag__ellipsis">…</span>');
    const active = p === pagActual;
    items.push(`<button class="pag__btn${active ? ' pag__btn--active' : ''}" data-page="${p}" aria-label="Página ${p}"${active ? ' aria-current="page"' : ''}>${p}</button>`);
    prev_p = p;
  }

  return `
  <nav class="paginacion" aria-label="Paginación de tabla">
    <button class="pag__btn pag__btn--nav" data-page="${pagActual - 1}" ${prev ? '' : 'disabled'} aria-label="Página anterior">‹</button>
    ${items.join('')}
    <button class="pag__btn pag__btn--nav" data-page="${pagActual + 1}" ${next ? '' : 'disabled'} aria-label="Página siguiente">›</button>
  </nav>`;
}

// ─── Event handlers ───────────────────────────────────────────────────────────

function attachListeners(container, pages) {
  // Ordenar por columna
  container.querySelectorAll('[data-sort]').forEach(th => {
    const activate = () => {
      const col = th.dataset.sort;
      if (state.sortCol === col) {
        state.sortAsc = !state.sortAsc;
      } else {
        state.sortCol = col;
        state.sortAsc = true;
      }
      renderImpl();
    };
    th.addEventListener('click', activate);
    th.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); activate(); } });
  });

  // Paginación
  container.querySelectorAll('[data-page]').forEach(btn => {
    if (btn.disabled) return;
    btn.addEventListener('click', () => {
      const p = Number(btn.dataset.page);
      if (p >= 1 && p <= pages) {
        state.pagina = p;
        renderImpl();
        // Scroll al inicio de la tabla
        document.getElementById('tablaContainer')?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }
    });
  });
}

// ─── Ordenamiento ─────────────────────────────────────────────────────────────

function ordenar(arr, col, asc) {
  return [...arr].sort((a, b) => {
    const va = a[col];
    const vb = b[col];
    if (typeof va === 'number' && typeof vb === 'number') {
      return asc ? va - vb : vb - va;
    }
    const sa = String(va ?? '');
    const sb = String(vb ?? '');
    return asc ? sa.localeCompare(sb, 'es') : sb.localeCompare(sa, 'es');
  });
}
