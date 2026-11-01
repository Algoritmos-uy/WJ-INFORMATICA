// Módulo de gráficos — Chart.js 4.4.4 (cargado desde CDN como window.Chart)
// Todos los colores se leen de CSS custom properties para soporte light/dark automático

// ─── Lectura de tokens de CSS ─────────────────────────────────────────────────

function cssVar(name) {
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
}

function colores() {
  return {
    primary:    cssVar('--c-primary')   || '#1d4ed8',
    accent:     cssVar('--c-accent')    || '#0891b2',
    ok:         cssVar('--c-ok')        || '#059669',
    warn:       cssVar('--c-warn')      || '#d97706',
    err:        cssVar('--c-err')       || '#dc2626',
    text:       cssVar('--c-text')      || '#111827',
    text2:      cssVar('--c-text-2')    || '#374151',
    text3:      cssVar('--c-text-3')    || '#6b7280',
    border:     cssVar('--c-border')    || '#d1dae8',
    surface:    cssVar('--c-surface')   || '#ffffff',
    surface2:   cssVar('--c-surface-2') || '#f7f9fc',
  };
}

// Paleta de 4 series (categorías)
function paleta4() {
  const c = colores();
  return [c.primary, c.accent, c.ok, c.warn];
}

// ─── Configuración base de Chart.js ──────────────────────────────────────────

function baseOptions(overrides = {}) {
  const c = colores();
  return {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        labels: { color: c.text2, font: { size: 12 }, boxWidth: 12, padding: 16 },
      },
      tooltip: {
        backgroundColor: c.surface,
        titleColor: c.text,
        bodyColor: c.text2,
        borderColor: c.border,
        borderWidth: 1,
        padding: 10,
        cornerRadius: 8,
      },
    },
    scales: {
      x: {
        ticks:  { color: c.text3, font: { size: 11 }, maxRotation: 45 },
        grid:   { color: c.border + '60' },
      },
      y: {
        ticks:  { color: c.text3, font: { size: 11 } },
        grid:   { color: c.border + '60' },
        beginAtZero: true,
      },
    },
    ...overrides,
  };
}

// ─── Instancias ───────────────────────────────────────────────────────────────

const instancias = {};

function getCanvas(id) {
  return document.getElementById(id);
}

// Destruye una instancia si existe (necesario antes de re-crear con nuevos datos)
function destruir(id) {
  if (instancias[id]) {
    instancias[id].destroy();
    delete instancias[id];
  }
}

// ─── Gráfico 1: Ingresos por período (línea) ─────────────────────────────────

export function initGraficoLinea(labels, datasets) {
  destruir('chartLinea');
  const ctx = getCanvas('chartLinea');
  if (!ctx) return;
  const pal = paleta4();
  const c   = colores();

  instancias.chartLinea = new window.Chart(ctx, {
    type: 'line',
    data: {
      labels,
      datasets: datasets.map((d, i) => ({
        label: d.label,
        data: d.data,
        borderColor: pal[i % pal.length],
        backgroundColor: pal[i % pal.length] + '18',
        borderWidth: 2,
        pointRadius: labels.length <= 6 ? 4 : 2,
        pointHoverRadius: 6,
        tension: 0.35,
        fill: false,
      })),
    },
    options: {
      ...baseOptions(),
      plugins: {
        ...baseOptions().plugins,
        legend: { ...baseOptions().plugins.legend, position: 'top' },
        tooltip: {
          ...baseOptions().plugins.tooltip,
          callbacks: {
            label: ctx => ` ${ctx.dataset.label}: ${new Intl.NumberFormat('es-UY', { style: 'currency', currency: 'UYU', maximumFractionDigits: 0 }).format(ctx.parsed.y)}`,
          },
        },
      },
    },
  });
}

// ─── Gráfico 2: Operaciones por categoría (barras) ────────────────────────────

export function initGraficoBarras(labels, values, campo = 'Operaciones') {
  destruir('chartBarras');
  const ctx = getCanvas('chartBarras');
  if (!ctx) return;
  const pal = paleta4();

  instancias.chartBarras = new window.Chart(ctx, {
    type: 'bar',
    data: {
      labels,
      datasets: [{
        label: campo,
        data: values,
        backgroundColor: pal,
        borderRadius: 6,
        borderSkipped: false,
      }],
    },
    options: {
      ...baseOptions({ plugins: { legend: { display: false } } }),
      indexAxis: 'x',
    },
  });
}

// ─── Gráfico 3: Distribución por región (donut) ───────────────────────────────

export function initGraficoDonut(labels, values) {
  destruir('chartDonut');
  const ctx = getCanvas('chartDonut');
  if (!ctx) return;
  const pal = paleta4();
  const c   = colores();

  instancias.chartDonut = new window.Chart(ctx, {
    type: 'doughnut',
    data: {
      labels,
      datasets: [{
        data: values,
        backgroundColor: pal,
        borderColor: c.surface,
        borderWidth: 3,
        hoverOffset: 8,
      }],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'right',
          labels: { color: c.text2, font: { size: 12 }, boxWidth: 12, padding: 12 },
        },
        tooltip: {
          ...baseOptions().plugins.tooltip,
          callbacks: {
            label: ctx => {
              const total = ctx.dataset.data.reduce((a, b) => a + b, 0);
              const pct   = total > 0 ? ((ctx.parsed / total) * 100).toFixed(1) : '0.0';
              return ` ${ctx.label}: ${pct} %`;
            },
          },
        },
      },
      cutout: '60%',
    },
  });
}

// ─── Gráfico 4: Canal de venta — barras apiladas ──────────────────────────────

export function initGraficoCanal(labels, datasets) {
  destruir('chartCanal');
  const ctx = getCanvas('chartCanal');
  if (!ctx) return;
  const pal = paleta4();
  const c   = colores();

  instancias.chartCanal = new window.Chart(ctx, {
    type: 'bar',
    data: {
      labels,
      datasets: datasets.map((d, i) => ({
        label: d.label,
        data: d.data,
        backgroundColor: pal[i % pal.length] + 'cc',
        borderRadius: i === datasets.length - 1 ? 6 : 0,
        borderSkipped: false,
        stack: 'canal',
      })),
    },
    options: {
      ...baseOptions({
        scales: {
          x: {
            stacked: true,
            ticks:  { color: c.text3, font: { size: 11 } },
            grid:   { color: c.border + '60' },
          },
          y: {
            stacked: true,
            ticks:  { color: c.text3, font: { size: 11 } },
            grid:   { color: c.border + '60' },
            beginAtZero: true,
          },
        },
      }),
      plugins: {
        ...baseOptions().plugins,
        legend: { ...baseOptions().plugins.legend, position: 'top' },
      },
    },
  });
}

// ─── Actualización de todos los gráficos (al cambiar tema) ───────────────────

export function actualizarTema() {
  const c  = colores();
  const pal = paleta4();

  for (const chart of Object.values(instancias)) {
    // Tooltips y escalas
    if (chart.options.plugins?.tooltip) {
      chart.options.plugins.tooltip.backgroundColor = c.surface;
      chart.options.plugins.tooltip.titleColor      = c.text;
      chart.options.plugins.tooltip.bodyColor       = c.text2;
      chart.options.plugins.tooltip.borderColor     = c.border;
    }
    if (chart.options.plugins?.legend?.labels) {
      chart.options.plugins.legend.labels.color = c.text2;
    }
    if (chart.options.scales?.x) {
      chart.options.scales.x.ticks.color = c.text3;
      chart.options.scales.x.grid.color  = c.border + '60';
    }
    if (chart.options.scales?.y) {
      chart.options.scales.y.ticks.color = c.text3;
      chart.options.scales.y.grid.color  = c.border + '60';
    }
    // Colores de datasets
    chart.data.datasets.forEach((ds, i) => {
      if (ds.borderColor && !ds.backgroundColor?.includes('cc') && !Array.isArray(ds.backgroundColor)) {
        ds.borderColor = pal[i % pal.length];
        if (ds.fill !== false) ds.backgroundColor = pal[i % pal.length] + '18';
      } else if (Array.isArray(ds.backgroundColor)) {
        ds.backgroundColor = pal;
      } else if (ds.stack) {
        ds.backgroundColor = pal[i % pal.length] + 'cc';
      }
    });
    // Donut: borde interior
    if (chart.config.type === 'doughnut') {
      chart.data.datasets.forEach(ds => { ds.borderColor = c.surface; });
    }
    chart.update('none');
  }
}
