// Orquestador del dashboard Nexo Comercial
// Coordina filtros → cálculos → KPIs → gráficos → tabla + observa cambios de tema

import { REGISTROS, CATEGORIAS, REGIONES, CANALES, PERIODOS } from './data.js';
import { filtrar, filtrarAnterior, calcularKPIs, agruparPor, porPeriodo, periodosPresentes, sumar } from './calc.js';
import { initFiltros, getFiltros, resetFiltros, renderKPIs, actualizarPeriodoLabel, formatUYU } from './ui.js';
import { initGraficoLinea, initGraficoBarras, initGraficoDonut, initGraficoCanal, actualizarTema } from './charts.js';
import { renderTabla } from './table.js';

// ─── Actualización completa del dashboard ─────────────────────────────────────

function actualizar() {
  const filtros  = getFiltros();
  const actual   = filtrar(filtros);
  const anterior = filtrarAnterior(filtros);

  // KPIs
  const kpis = calcularKPIs(actual, anterior);
  renderKPIs(kpis);
  actualizarPeriodoLabel(filtros);

  // ── Gráfico 1: Ingresos mensuales por categoría ────────────────────────────
  const periodos = periodosPresentes(actual).sort();

  const lineaDatasets = CATEGORIAS.map(cat => {
    const porMes = porPeriodo(actual.filter(r => r.categoria === cat), ['ingresos']);
    return {
      label: cat,
      data: periodos.map(p => porMes[p]?.ingresos ?? 0),
    };
  });
  initGraficoLinea(periodos.map(p => {
    const [y, m] = p.split('-').map(Number);
    return new Date(y, m - 1, 1).toLocaleDateString('es-UY', { month: 'short', year: '2-digit' });
  }), lineaDatasets);

  // ── Gráfico 2: Operaciones por categoría (barras) ──────────────────────────
  const opsPorCat = agruparPor(actual, 'categoria', 'operaciones');
  initGraficoBarras(
    CATEGORIAS.filter(c => opsPorCat[c] !== undefined),
    CATEGORIAS.filter(c => opsPorCat[c] !== undefined).map(c => opsPorCat[c] ?? 0),
    'Operaciones',
  );

  // ── Gráfico 3: Distribución de ingresos por región (donut) ────────────────
  const ingPorReg = agruparPor(actual, 'region', 'ingresos');
  const regPresentes = REGIONES.filter(r => ingPorReg[r] !== undefined);
  initGraficoDonut(
    regPresentes,
    regPresentes.map(r => ingPorReg[r] ?? 0),
  );

  // ── Gráfico 4: Ingresos por canal apilados por período ─────────────────────
  // Muestra máx. 12 períodos (más legible)
  const periodosCanal = periodos.slice(-12);
  const canalDatasets = CANALES.map(canal => {
    const porMes = porPeriodo(actual.filter(r => r.canal === canal), ['ingresos']);
    return {
      label: canal,
      data: periodosCanal.map(p => porMes[p]?.ingresos ?? 0),
    };
  });
  initGraficoCanal(periodosCanal.map(p => {
    const [y, m] = p.split('-').map(Number);
    return new Date(y, m - 1, 1).toLocaleDateString('es-UY', { month: 'short', year: '2-digit' });
  }), canalDatasets);

  // ── Tabla ──────────────────────────────────────────────────────────────────
  renderTabla(actual);
}

// ─── Observador de tema ───────────────────────────────────────────────────────

function observarTema() {
  const observer = new MutationObserver(mutations => {
    for (const m of mutations) {
      if (m.attributeName === 'data-theme') {
        // Pequeño delay para que los CSS custom properties se actualicen antes de leer colores
        requestAnimationFrame(() => actualizarTema());
        break;
      }
    }
  });
  observer.observe(document.documentElement, { attributes: true });
}

// ─── Inicialización ───────────────────────────────────────────────────────────

function init() {
  // Verificar que Chart.js esté disponible
  if (typeof window.Chart === 'undefined') {
    console.error('Chart.js no disponible — verificar CDN');
    document.getElementById('kpiGrid')?.insertAdjacentHTML('beforebegin',
      '<p class="dash-error">Error al cargar Chart.js. Revisá tu conexión a internet.</p>');
    return;
  }

  // Configuración global de Chart.js
  window.Chart.defaults.font.family = 'system-ui, -apple-system, sans-serif';

  // Filtros
  initFiltros();

  // Bind de eventos
  document.getElementById('filtroForm')?.addEventListener('submit', e => {
    e.preventDefault();
    actualizar();
  });

  document.getElementById('btnReset')?.addEventListener('click', () => {
    resetFiltros();
    actualizar();
  });

  // Observar cambio de tema
  observarTema();

  // Render inicial
  actualizar();
}

// Esperar a que el DOM y Chart.js estén listos
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
