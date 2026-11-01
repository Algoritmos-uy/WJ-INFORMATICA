// Módulo de lectura/escritura de Excel — StockReconcile
// Requiere window.XLSX (SheetJS 0.18.x) cargado antes de llamar estas funciones.
// Los archivos del usuario se procesan exclusivamente en el navegador.

const MAX_FILE_BYTES = 5 * 1024 * 1024; // 5 MB
const MAX_ROWS       = 10_000;

// ─── Cabeceras reconocidas por columna ────────────────────────────────────────
// Normalización: toLowerCase + quitar diacríticos + trim

function norm(s) {
  return String(s ?? '').trim().toLowerCase()
    .normalize('NFD').replace(/[̀-ͯ]/g, '');
}

const SKU_HEADERS  = ['sku', 'codigo', 'code', 'id', 'ref', 'referencia', 'item', 'product id', 'ean', 'barcode'];
const DESC_HEADERS = ['descripcion', 'description', 'descricao', 'nombre', 'name', 'nome', 'producto', 'product', 'articulo'];
const QTY_HEADERS  = ['cantidad', 'quantity', 'quantidade', 'qty', 'stock', 'existencia', 'units', 'unidades', 'disponible'];

function detectCol(headers, candidates) {
  for (const h of headers) {
    if (candidates.includes(norm(h))) return h;
  }
  // Segundo paso: búsqueda parcial
  for (const h of headers) {
    const n = norm(h);
    if (candidates.some(c => n.includes(c) || c.includes(n))) return h;
  }
  return null;
}

// ─── Validación del archivo ───────────────────────────────────────────────────

export function validateFile(file) {
  if (!file) return { ok: false, errorKey: 'err_empty_file' };
  if (file.size > MAX_FILE_BYTES) return { ok: false, errorKey: 'err_file_size' };
  if (!file.name.toLowerCase().endsWith('.xlsx')) return { ok: false, errorKey: 'err_not_xlsx' };
  return { ok: true };
}

// ─── Lectura de hojas disponibles ─────────────────────────────────────────────

/**
 * @param {File} file
 * @returns {Promise<{ok, wb?, sheetNames?, errorKey?}>}
 */
export async function readWorkbook(file) {
  const XLSX = window.XLSX;
  if (!XLSX) return { ok: false, errorKey: 'err_read_failed' };

  try {
    const buf = await file.arrayBuffer();
    const wb  = XLSX.read(buf, { type: 'array', cellDates: false });
    if (!wb?.SheetNames?.length) return { ok: false, errorKey: 'err_empty_file' };
    return { ok: true, wb, sheetNames: wb.SheetNames };
  } catch (_) {
    return { ok: false, errorKey: 'err_not_xlsx' };
  }
}

// ─── Lectura de una hoja ──────────────────────────────────────────────────────

/**
 * @param {object} wb              SheetJS workbook
 * @param {string} sheetName
 * @param {{sku?,desc?,qty?}} map  Mapeo manual de columnas (opcional)
 * @returns {{ ok, items?, colMap?, errorKey?, headers? }}
 */
export function readSheet(wb, sheetName, map = {}) {
  const XLSX = window.XLSX;
  const ws   = wb.Sheets[sheetName];
  if (!ws) return { ok: false, errorKey: 'err_empty_file' };

  // Convertir a JSON. header: 1 → array de arrays (incluye fila de cabeceras)
  let rows;
  try {
    rows = XLSX.utils.sheet_to_json(ws, { header: 1, defval: null, raw: true });
  } catch (_) {
    return { ok: false, errorKey: 'err_read_failed' };
  }

  if (!rows.length) return { ok: false, errorKey: 'err_empty_file' };

  // Primera fila: cabeceras (tratadas como texto no confiable)
  const headerRow = rows[0].map(h => (h !== null && h !== undefined ? String(h) : ''));
  const dataRows  = rows.slice(1).filter(r => r.some(c => c !== null && c !== undefined && c !== ''));

  if (!dataRows.length) return { ok: false, errorKey: 'err_empty_file' };
  if (dataRows.length > MAX_ROWS) return { ok: false, errorKey: 'err_too_many_rows' };

  // Detectar columnas (auto o manual)
  const skuCol  = map.sku  ?? detectCol(headerRow, SKU_HEADERS);
  const descCol = map.desc ?? detectCol(headerRow, DESC_HEADERS);
  const qtyCol  = map.qty  ?? detectCol(headerRow, QTY_HEADERS);

  if (!skuCol)  return { ok: false, errorKey: 'err_no_sku_col',  headers: headerRow };
  if (!qtyCol)  return { ok: false, errorKey: 'err_no_qty_col',  headers: headerRow };

  const iSKU  = headerRow.indexOf(skuCol);
  const iDesc = descCol ? headerRow.indexOf(descCol) : -1;
  const iQty  = headerRow.indexOf(qtyCol);

  const items = dataRows.map(row => ({
    sku:         row[iSKU]  ?? null,
    description: iDesc >= 0 ? (row[iDesc] ?? '') : '',
    qty:         row[iQty]  ?? null,
  }));

  return { ok: true, items, colMap: { sku: skuCol, desc: descCol ?? null, qty: qtyCol }, headers: headerRow };
}

// ─── Exportación XLSX ─────────────────────────────────────────────────────────

/**
 * Genera y descarga el informe de reconciliación.
 * @param {{ records, summary }} result   Salida del motor
 * @param {{ prevName, currName, source, lang }} meta
 * @param {function} t   Función de traducción i18n.t
 */
export function exportReport(result, meta, t) {
  const XLSX = window.XLSX;
  if (!XLSX) return;

  const { records, summary } = result;
  const now    = new Date();
  const ts     = now.toISOString().replace('T', ' ').slice(0, 19);
  const tsFile = ts.replace(/[: ]/g, (c) => c === ':' ? '' : c === ' ' ? '_' : '');

  // ── Hoja 1: Resumen ────────────────────────────────────────────────────────
  const summaryData = [
    [t('rpt_title')],
    [],
    [t('rpt_generated'), ts],
    [t('rpt_source'),    meta.source === 'demo' ? t('rpt_src_demo') : t('rpt_src_user')],
    [t('rpt_prev_name'), meta.prevName],
    [t('rpt_curr_name'), meta.currName],
    [],
    [t('rpt_summary')],
    [t('kpi_analyzed'),  summary.total],
    [t('kpi_unchanged'), summary.unchanged],
    [t('kpi_increase'),  summary.increase],
    [t('kpi_decrease'),  summary.decrease],
    [t('kpi_new'),       summary.new],
    [t('kpi_missing'),   summary.missing],
    [t('kpi_review'),    summary.review],
  ];

  // ── Hoja 2: Detalle ────────────────────────────────────────────────────────
  const statusLabel = (s) => t('status_' + s) ?? s;
  const noteLabels  = (notes) => (notes ?? []).map(k => t(k)).filter(Boolean).join(' | ');

  const detailHeader = [
    t('col_sku'), t('col_desc'), t('col_prev'), t('col_curr'),
    t('col_diff'), t('col_status'), t('col_notes'),
  ];

  const detailRows = records.map(r => [
    r.sku,
    r.description,
    r.qtyPrev ?? '',
    r.qtyCurr ?? '',
    r.diff    ?? '',
    statusLabel(r.status),
    noteLabels(r.notes),
  ]);

  const wb  = XLSX.utils.book_new();

  const wsSummary = XLSX.utils.aoa_to_sheet(summaryData);
  // Ajustar ancho de columnas
  wsSummary['!cols'] = [{ wch: 30 }, { wch: 30 }];

  const wsDetail = XLSX.utils.aoa_to_sheet([detailHeader, ...detailRows]);
  wsDetail['!cols'] = [
    { wch: 18 }, { wch: 36 }, { wch: 14 }, { wch: 14 },
    { wch: 12 }, { wch: 14 }, { wch: 50 },
  ];

  XLSX.utils.book_append_sheet(wb, wsSummary, t('rpt_summary'));
  XLSX.utils.book_append_sheet(wb, wsDetail,  t('rpt_detail'));

  // Nombre del archivo con fecha y hora reales
  const filename = `StockReconcile_${tsFile}.xlsx`;
  XLSX.writeFile(wb, filename);
}

export { MAX_FILE_BYTES, MAX_ROWS };
