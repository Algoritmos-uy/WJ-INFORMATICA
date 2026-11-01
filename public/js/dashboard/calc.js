// Filtrado, agregación y cálculo de KPIs
// Todos los cálculos parten del mismo conjunto de registros → coherencia garantizada

import { REGISTROS } from './data.js';

// ─── Filtrado ─────────────────────────────────────────────────────────────────

/** Devuelve los registros que cumplen todos los filtros activos */
export function filtrar({ desde = '', hasta = '', categoria = '', region = '', canal = '' }) {
  return REGISTROS.filter(r => {
    if (desde     && r.periodo   < desde)     return false;
    if (hasta     && r.periodo   > hasta)     return false;
    if (categoria && r.categoria !== categoria) return false;
    if (region    && r.region    !== region)    return false;
    if (canal     && r.canal     !== canal)     return false;
    return true;
  });
}

// ─── Agregación ───────────────────────────────────────────────────────────────

/** Suma un campo numérico sobre un array de registros */
export function sumar(registros, campo) {
  return registros.reduce((acc, r) => acc + (r[campo] ?? 0), 0);
}

/**
 * Agrupa registros por un campo y suma otro campo.
 * Devuelve { [valor]: suma }
 */
export function agruparPor(registros, campoClave, campoSuma) {
  const mapa = {};
  for (const r of registros) {
    const k = r[campoClave];
    mapa[k] = (mapa[k] ?? 0) + (r[campoSuma] ?? 0);
  }
  return mapa;
}

/**
 * Agrupa registros por período y suma múltiples campos.
 * Devuelve { [periodo]: { campo1: suma, campo2: suma, ... } }
 */
export function porPeriodo(registros, campos) {
  const mapa = {};
  for (const r of registros) {
    if (!mapa[r.periodo]) {
      mapa[r.periodo] = Object.fromEntries(campos.map(c => [c, 0]));
    }
    for (const c of campos) mapa[r.periodo][c] += r[c] ?? 0;
  }
  return mapa;
}

/** Devuelve array de períodos únicos ordenados cronológicamente */
export function periodosPresentes(registros) {
  return [...new Set(registros.map(r => r.periodo))].sort();
}

// ─── Período de comparación ────────────────────────────────────────────────────

/** Desplaza un período YYYY-MM 12 meses hacia atrás */
export function periodoMenos12(yyyymm) {
  const [y, m] = yyyymm.split('-').map(Number);
  const d = new Date(y, m - 1 - 12, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

/** Devuelve registros del período equivalente anterior (mismo rango, -12 meses) */
export function filtrarAnterior(filtros) {
  const prev = {
    ...filtros,
    desde: filtros.desde ? periodoMenos12(filtros.desde) : '',
    hasta: filtros.hasta ? periodoMenos12(filtros.hasta) : '',
  };
  return filtrar(prev);
}

// ─── Variación porcentual segura ──────────────────────────────────────────────

/** Devuelve null si el período anterior tiene cero datos (no hay referencia válida) */
export function variacion(actual, anterior) {
  if (!anterior || anterior === 0) return null;
  return (actual - anterior) / Math.abs(anterior);
}

// ─── KPIs ─────────────────────────────────────────────────────────────────────

/**
 * Calcula los 4 KPIs del dashboard.
 * @param {Array} actual   — registros del período seleccionado
 * @param {Array} anterior — registros del período equivalente anterior
 */
export function calcularKPIs(actual, anterior) {
  const ingresos    = sumar(actual, 'ingresos');
  const costos      = sumar(actual, 'costos');
  const operaciones = sumar(actual, 'operaciones');
  const margen      = ingresos - costos;
  const ticket      = operaciones > 0 ? ingresos / operaciones : 0;
  const margenPct   = ingresos > 0 ? margen / ingresos : 0;

  const ingAnt  = sumar(anterior, 'ingresos');
  const costAnt = sumar(anterior, 'costos');
  const opsAnt  = sumar(anterior, 'operaciones');
  const marAnt  = ingAnt - costAnt;
  const tickAnt = opsAnt > 0 ? ingAnt / opsAnt : 0;

  return {
    ingresos:    { valor: ingresos,    var: variacion(ingresos, ingAnt) },
    operaciones: { valor: operaciones, var: variacion(operaciones, opsAnt) },
    ticket:      { valor: ticket,      var: variacion(ticket, tickAnt) },
    margen:      { valor: margen, pct: margenPct, var: variacion(margen, marAnt) },
  };
}
