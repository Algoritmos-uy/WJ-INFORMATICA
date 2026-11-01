// Renderizado de KPIs, filtros y utilidades de formato

import { PERIODOS, CATEGORIAS, REGIONES, CANALES } from './data.js';

// ─── Formato regional Uruguay ─────────────────────────────────────────────────

const fmtUYU = new Intl.NumberFormat('es-UY', {
  style: 'currency', currency: 'UYU',
  minimumFractionDigits: 0, maximumFractionDigits: 0,
});

const fmtNum = new Intl.NumberFormat('es-UY', {
  minimumFractionDigits: 0, maximumFractionDigits: 0,
});

const fmtPct = new Intl.NumberFormat('es-UY', {
  style: 'percent', minimumFractionDigits: 1, maximumFractionDigits: 1,
});

export const formatUYU  = n => fmtUYU.format(n);
export const formatNum  = n => fmtNum.format(n);
export const formatPct  = n => fmtPct.format(n);

/** Formatea YYYY-MM como "nov. 2024" */
export function labelPeriodo(yyyymm) {
  const [y, m] = yyyymm.split('-').map(Number);
  return new Date(y, m - 1, 1).toLocaleDateString('es-UY', { month: 'short', year: 'numeric' });
}

// ─── Inicialización de filtros ────────────────────────────────────────────────

export function initFiltros() {
  const sDesde  = document.getElementById('f-desde');
  const sHasta  = document.getElementById('f-hasta');
  const sCat    = document.getElementById('f-cat');
  const sReg    = document.getElementById('f-reg');
  const sCanal  = document.getElementById('f-canal');

  // Poblar períodos
  for (const p of PERIODOS) {
    const label = labelPeriodo(p);
    sDesde.add(new Option(label, p));
    sHasta.add(new Option(label, p));
  }

  // Poblar categorías
  for (const c of CATEGORIAS) sCat.add(new Option(c, c));

  // Poblar regiones
  for (const r of REGIONES) sReg.add(new Option(r, r));

  // Poblar canales
  for (const c of CANALES) sCanal.add(new Option(c, c));

  // Defecto: últimos 12 meses (para comparación con año anterior)
  sDesde.value = PERIODOS[12] ?? PERIODOS[0];
  sHasta.value = PERIODOS[PERIODOS.length - 1];
}

/** Lee los valores actuales de los filtros */
export function getFiltros() {
  return {
    desde:     document.getElementById('f-desde')?.value ?? '',
    hasta:     document.getElementById('f-hasta')?.value ?? '',
    categoria: document.getElementById('f-cat')?.value   ?? '',
    region:    document.getElementById('f-reg')?.value   ?? '',
    canal:     document.getElementById('f-canal')?.value ?? '',
  };
}

/** Restablece filtros a valores por defecto */
export function resetFiltros() {
  document.getElementById('f-desde').value  = PERIODOS[12] ?? PERIODOS[0];
  document.getElementById('f-hasta').value  = PERIODOS[PERIODOS.length - 1];
  document.getElementById('f-cat').value    = '';
  document.getElementById('f-reg').value    = '';
  document.getElementById('f-canal').value  = '';
}

// ─── Renderizado de KPIs ──────────────────────────────────────────────────────

/**
 * @param {{ ingresos, operaciones, ticket, margen }} kpis
 */
export function renderKPIs(kpis) {
  const grid = document.getElementById('kpiGrid');
  if (!grid) return;

  const cards = [
    {
      id: 'kpi-ingresos',
      titulo:   'Ingresos totales',
      valor:    formatUYU(kpis.ingresos.valor),
      var:      kpis.ingresos.var,
      desc:     'Suma de ingresos del período y filtros activos',
    },
    {
      id: 'kpi-ops',
      titulo:   'Operaciones',
      valor:    formatNum(kpis.operaciones.valor),
      var:      kpis.operaciones.var,
      desc:     'Cantidad de operaciones comerciales del período',
    },
    {
      id: 'kpi-ticket',
      titulo:   'Ticket promedio',
      valor:    formatUYU(kpis.ticket.valor),
      var:      kpis.ticket.var,
      desc:     'Ingresos divididos entre operaciones',
    },
    {
      id: 'kpi-margen',
      titulo:   'Margen bruto',
      valor:    formatUYU(kpis.margen.valor),
      sub:      formatPct(kpis.margen.pct),
      var:      kpis.margen.var,
      desc:     'Diferencia entre ingresos y costos del período',
    },
  ];

  grid.innerHTML = cards.map(c => kpiCard(c)).join('');
}

function kpiCard({ id, titulo, valor, sub, var: v, desc }) {
  const hasVar = v !== null && v !== undefined;
  const up     = hasVar && v >= 0;
  const varStr = hasVar ? formatPct(Math.abs(v)) : '';
  const arrow  = up ? '↑' : '↓';
  const varClass = up ? 'kpi__var--up' : 'kpi__var--down';
  const varLabel = hasVar ? `${up ? '+' : '−'} ${varStr} vs. año anterior` : '';

  return `
  <article class="kpi-card" id="${id}" aria-label="${desc}">
    <span class="kpi__label">${titulo}</span>
    <span class="kpi__value">${valor}</span>
    ${sub ? `<span class="kpi__sub">${sub}</span>` : ''}
    ${hasVar
      ? `<span class="kpi__var ${varClass}" aria-label="${varLabel}">
           <span class="kpi__arrow" aria-hidden="true">${arrow}</span>
           ${varStr}
         </span>`
      : '<span class="kpi__var kpi__var--neutral">Sin datos previos</span>'
    }
  </article>`;
}

// ─── Etiqueta de período activo ───────────────────────────────────────────────

export function actualizarPeriodoLabel(filtros) {
  const el = document.getElementById('periodoLabel');
  if (!el) return;
  const desde = filtros.desde ? labelPeriodo(filtros.desde) : '—';
  const hasta = filtros.hasta ? labelPeriodo(filtros.hasta) : '—';
  el.textContent = `${desde} · ${hasta}`;
}
