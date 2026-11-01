// Motor de reconciliación — StockReconcile
// Puro: sin efectos secundarios, sin dependencias de UI.
// Determinista: mismos datos + mismas reglas = mismos resultados.

// ─── Reglas de normalización ──────────────────────────────────────────────────
// • SKU: trim + uppercase. Los ceros iniciales se PRESERVAN (ej. "0SKU-006").
//   La normalización no elimina caracteres significativos del identificador.
// • Cantidad: se acepta number o string.
//   - null / undefined / '' → qty=null, inválida (vacía).
//   - String no numérica → qty=null, inválida (texto).
//   - Número negativo → qty=valor negativo, marcado con nota (se admite contabilidad).
//   - Número ≥ 0 → válido.
//   No se convierten silenciosamente cantidades inválidas a cero.

function normalizeSKU(raw) {
  if (raw === null || raw === undefined) return '';
  return String(raw).trim().toUpperCase();
}

function parseQty(raw) {
  if (raw === null || raw === undefined || raw === '') return { value: null, status: 'empty' };
  if (typeof raw === 'number') {
    if (!isFinite(raw)) return { value: null, status: 'invalid' };
    return { value: raw, status: raw < 0 ? 'negative' : 'ok' };
  }
  const s = String(raw).trim();
  if (s === '') return { value: null, status: 'empty' };
  const n = Number(s);
  if (isNaN(n)) return { value: null, status: 'invalid' };
  return { value: n, status: n < 0 ? 'negative' : 'ok' };
}

// ─── Detección de duplicados ──────────────────────────────────────────────────

function findDuplicates(items) {
  const seen = new Map(); // normSKU → count
  for (const item of items) {
    const k = normalizeSKU(item.sku);
    if (!k) continue;
    seen.set(k, (seen.get(k) ?? 0) + 1);
  }
  const dups = new Set();
  for (const [k, cnt] of seen) {
    if (cnt > 1) dups.add(k);
  }
  return dups;
}

// ─── Motor principal ──────────────────────────────────────────────────────────

/**
 * @param {Array<{sku, description, qty}>} prevItems
 * @param {Array<{sku, description, qty}>} currItems
 * @returns {{ records: Array, summary: object }}
 */
export function reconcile(prevItems, currItems) {
  const dupsPrev = findDuplicates(prevItems);
  const dupsCurr = findDuplicates(currItems);

  // Indexar inventario anterior por SKU normalizado
  const prevMap = new Map();
  for (const item of prevItems) {
    const nk = normalizeSKU(item.sku);
    if (!nk) continue;
    if (!prevMap.has(nk)) prevMap.set(nk, []);
    prevMap.get(nk).push(item);
  }

  // Indexar inventario actual por SKU normalizado
  const currMap = new Map();
  for (const item of currItems) {
    const nk = normalizeSKU(item.sku);
    if (!nk) continue;
    if (!currMap.has(nk)) currMap.set(nk, []);
    currMap.get(nk).push(item);
  }

  // Unión de SKUs
  const allKeys = new Set([...prevMap.keys(), ...currMap.keys()]);

  const records = [];

  for (const nk of allKeys) {
    const pList = prevMap.get(nk) ?? [];
    const cList = currMap.get(nk) ?? [];

    const isDupPrev = dupsPrev.has(nk);
    const isDupCurr = dupsCurr.has(nk);

    // Si es duplicado en algún inventario → no se puede comparar de forma inequívoca
    if (isDupPrev || isDupCurr) {
      const notes = [];
      if (isDupPrev) notes.push('note_dup_prev');
      if (isDupCurr) notes.push('note_dup_curr');

      // Emitir una fila por cada aparición, marcada como duplicado
      const combined = [
        ...pList.map(i => ({ src: 'prev', item: i })),
        ...cList.map(i => ({ src: 'curr', item: i })),
      ];
      for (const { src, item } of combined) {
        const qPrev = src === 'prev' ? parseQty(item.qty) : { value: null, status: 'na' };
        const qCurr = src === 'curr' ? parseQty(item.qty) : { value: null, status: 'na' };
        records.push({
          sku:         item.sku,   // SKU original (preserva ceros, mayúsculas originales)
          skuNorm:     nk,
          description: item.description ?? '',
          qtyPrev:     src === 'prev' ? (qPrev.value) : null,
          qtyCurr:     src === 'curr' ? (qCurr.value) : null,
          diff:        null,
          status:      'duplicate',
          notes,
        });
      }
      continue;
    }

    // Exactamente uno en cada lado (o solo en uno)
    const pItem = pList[0] ?? null;
    const cItem = cList[0] ?? null;

    const description = cItem?.description ?? pItem?.description ?? '';
    const skuOrig     = cItem?.sku ?? pItem?.sku ?? nk;

    const qPrev = pItem ? parseQty(pItem.qty) : null;
    const qCurr = cItem ? parseQty(cItem.qty) : null;

    const notes = [];

    // Validaciones de cantidad
    if (qPrev?.status === 'empty')    notes.push('note_empty_prev');
    if (qPrev?.status === 'invalid')  notes.push('note_inv_qty_prev');
    if (qCurr?.status === 'empty')    notes.push('note_empty_curr');
    if (qCurr?.status === 'invalid')  notes.push('note_inv_qty_curr');
    if (qPrev?.status === 'negative' || qCurr?.status === 'negative') notes.push('note_neg_qty');

    const hasInvalidData =
      (qPrev !== null && (qPrev.status === 'empty' || qPrev.status === 'invalid')) ||
      (qCurr !== null && (qCurr.status === 'empty' || qCurr.status === 'invalid'));

    let status;
    let diff = null;

    if (!pItem) {
      status = 'new';
    } else if (!cItem) {
      status = 'missing';
    } else if (hasInvalidData) {
      status = 'invalid';
    } else {
      // Ambos tienen cantidades numéricas (pueden ser negativas — se admiten)
      diff = (qCurr.value ?? 0) - (qPrev.value ?? 0);
      if (diff === 0) {
        status = 'unchanged';
        // Nota especial: qty actual = 0 pero no es "ausente"
        if (qCurr.value === 0) notes.push('note_zero_curr');
      } else if (diff > 0) {
        status = 'increase';
      } else {
        status = 'decrease';
        if (qCurr.value === 0) notes.push('note_zero_curr');
      }
    }

    records.push({
      sku:         skuOrig,
      skuNorm:     nk,
      description,
      qtyPrev:     qPrev?.value ?? null,
      qtyCurr:     qCurr?.value ?? null,
      diff,
      status,
      notes,
    });
  }

  // Ordenar: primero por estado (nuevo/ausente/inválido primero para revisión), luego por SKU
  const ORDER = { duplicate: 0, invalid: 1, new: 2, missing: 3, decrease: 4, increase: 5, unchanged: 6 };
  records.sort((a, b) => {
    const od = (ORDER[a.status] ?? 9) - (ORDER[b.status] ?? 9);
    if (od !== 0) return od;
    return a.skuNorm.localeCompare(b.skuNorm, undefined, { numeric: true });
  });

  // Calcular resumen (sin doble conteo)
  const summary = {
    total:     records.length,
    unchanged: records.filter(r => r.status === 'unchanged').length,
    increase:  records.filter(r => r.status === 'increase').length,
    decrease:  records.filter(r => r.status === 'decrease').length,
    new:       records.filter(r => r.status === 'new').length,
    missing:   records.filter(r => r.status === 'missing').length,
    review:    records.filter(r => r.status === 'invalid' || r.status === 'duplicate').length,
  };

  return { records, summary };
}

// ─── Validación de inventario de entrada ─────────────────────────────────────

/**
 * Valida que el inventario tenga al menos una fila con SKU.
 * @returns {{ ok: boolean, errorKey?: string }}
 */
export function validateInventory(items) {
  if (!Array.isArray(items) || items.length === 0) {
    return { ok: false, errorKey: 'err_empty_file' };
  }
  const withSku = items.filter(i => normalizeSKU(i.sku).length > 0);
  if (withSku.length === 0) {
    return { ok: false, errorKey: 'err_no_sku_col' };
  }
  return { ok: true };
}
