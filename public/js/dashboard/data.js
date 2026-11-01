// Dataset simulado — Nexo Comercial · 24 meses (Nov 2024 – Oct 2026)
// Fuente única de verdad para todo el dashboard

// ─── Dimensiones ──────────────────────────────────────────────────────────────
export const CATEGORIAS = ['Tecnología', 'Software', 'Servicios', 'Hardware'];
export const REGIONES   = ['Montevideo', 'Interior Norte', 'Interior Sur'];
export const CANALES    = ['Directo', 'Online', 'Referido'];

// ─── Pesos de distribución (suman 1.0 dentro de cada dimensión) ──────────────
const CAT_PESO   = { Tecnología: 0.35, Software: 0.32, Servicios: 0.23, Hardware: 0.10 };
const REG_PESO   = { Montevideo: 0.58, 'Interior Norte': 0.27, 'Interior Sur': 0.15 };
const CANAL_PESO = { Directo: 0.50, Online: 0.30, Referido: 0.20 };

// Ticket promedio por categoría (UYU)
const TICKET = { Tecnología: 15_000, Software: 20_000, Servicios: 7_000, Hardware: 28_000 };

// Ratio de costo sobre ingreso por categoría (dentro del rango para no generar pérdidas)
const COSTO_RATIO = { Tecnología: 0.46, Software: 0.34, Servicios: 0.44, Hardware: 0.67 };

// Estacionalidad por mes del año
const ESTACION = {
  1: 0.84, 2: 0.88, 3: 1.06, 4: 1.12,
  5: 0.96, 6: 0.89, 7: 0.94, 8: 1.01,
  9: 1.06, 10: 1.00, 11: 1.10, 12: 1.16,
};

const BASE_MENSUAL  = 1_480_000; // UYU — ingresos totales de la empresa, mes base
const CRECIMIENTO   = 0.0095;    // tasa mensual compuesta ≈ 12 % anual
const START_YEAR    = 2024;
const START_MONTH   = 11;
export const TOTAL_MESES = 24;

// ─── Ruido determinista (sin Math.random — resultados siempre iguales) ────────
function noise(seed) {
  const s = Math.sin(seed * 127.1 + 311.7) * 43758.5453;
  return s - Math.floor(s); // [0, 1)
}

// ─── Generación del dataset ───────────────────────────────────────────────────
function generarDatos() {
  const registros = [];
  let idx = 0;

  for (let m = 0; m < TOTAL_MESES; m++) {
    const year  = START_YEAR + Math.floor((START_MONTH - 1 + m) / 12);
    const month = ((START_MONTH - 1 + m) % 12) + 1;
    const periodo = `${year}-${String(month).padStart(2, '0')}`;

    // Base mensual con crecimiento y estacionalidad
    const baseM = BASE_MENSUAL * Math.pow(1 + CRECIMIENTO, m) * ESTACION[month];

    for (const cat of CATEGORIAS) {
      for (const reg of REGIONES) {
        for (const canal of CANALES) {
          idx++;

          const peso = CAT_PESO[cat] * REG_PESO[reg] * CANAL_PESO[canal];

          // Variación de ingresos ±13 %
          const varIng  = (noise(idx * 7  + m * 13 + 1) - 0.5) * 0.26;
          // Variación de ratio de costo ±4 %
          const varCost = (noise(idx * 11 + m * 17 + 2) - 0.5) * 0.08;

          const ingresos    = Math.max(0, Math.round(baseM * peso * (1 + varIng)));
          const costos      = Math.max(0, Math.round(ingresos * Math.min(0.90, COSTO_RATIO[cat] + varCost)));
          const operaciones = Math.max(1, Math.round(ingresos / TICKET[cat]));
          const unidades    = Math.max(operaciones, Math.round(operaciones * (1.2 + noise(idx * 3 + m * 5 + 3) * 0.8)));
          const cn          = Math.max(0, Math.round(operaciones * (0.50 + noise(idx * 2 + m * 4 + 4) * 0.25)));
          const cr          = Math.max(0, operaciones - cn);

          registros.push({
            periodo,
            categoria: cat,
            region: reg,
            canal,
            operaciones,
            unidades,
            ingresos,
            costos,
            clientes_nuevos: cn,
            clientes_recurrentes: cr,
          });
        }
      }
    }
  }

  return registros;
}

export const REGISTROS = generarDatos();

// Períodos disponibles en orden cronológico
export const PERIODOS = [...new Set(REGISTROS.map(r => r.periodo))].sort();
