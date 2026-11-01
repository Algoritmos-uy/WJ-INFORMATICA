// Orquestador de StockReconcile
// Conecta UI ↔ motor ↔ Excel. Sin estado global innecesario.

import { i18n }                         from './i18n.js';
import { getScenario, SCENARIO_IDS }    from './scenarios.js';
import { reconcile, validateInventory } from './engine.js';
import { validateFile, readWorkbook, readSheet, exportReport } from './excel.js';
import {
  renderKPIs, setRecords, renderTable, buildFilterOptions,
  onFilterChange, setStatusBar, clearStatusBar,
  setRunning, setExportEnabled, setModeLabel, applyTranslations,
} from './ui.js';

// ─── Estado de la aplicación ──────────────────────────────────────────────────

const state = {
  mode:     'demo',       // 'demo' | 'user'
  scenario: 'a',
  prevItems: null,        // null → usar escenario
  currItems: null,
  prevName:  '',
  currName:  '',
  prevWb:    null,        // workbook SheetJS (user file)
  currWb:    null,
  prevMap:   null,        // mapeo de columnas confirmado
  currMap:   null,
  result:    null,        // último resultado del motor
};

// ─── Inicialización ────────────────────────────────────────────────────────────

export function init() {
  if (!window.XLSX) {
    console.error('StockReconcile: SheetJS no disponible.');
    setStatusBar('err', 'SheetJS no cargado. Recargá la página.');
    return;
  }

  initLangSelector();
  initScenarioSelector();
  initFileUploads();
  initRunButton();
  initExportButton();
  initFilterSearch();
  initResetButton();

  // Aplicar traducciones iniciales
  applyTranslations();

  // Cargar escenario A por defecto y ejecutar
  loadScenario('a');
  runReconcile();
}

// ─── Selector de idioma ────────────────────────────────────────────────────────

function initLangSelector() {
  document.querySelectorAll('.sr-lang__btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const lang = btn.dataset.lang;
      if (!lang) return;
      i18n.setLang(lang);
    });
  });

  i18n.onChange(lang => {
    // Actualizar botones activos
    document.querySelectorAll('.sr-lang__btn').forEach(b => {
      b.classList.toggle('sr-lang__btn--active', b.dataset.lang === lang);
      b.setAttribute('aria-pressed', String(b.dataset.lang === lang));
    });
    // Re-aplicar todas las traducciones
    applyTranslations();
  });

  // Estado inicial de botones
  document.querySelectorAll('.sr-lang__btn').forEach(b => {
    b.classList.toggle('sr-lang__btn--active', b.dataset.lang === i18n.lang);
    b.setAttribute('aria-pressed', String(b.dataset.lang === i18n.lang));
  });
}

// ─── Selector de escenario ─────────────────────────────────────────────────────

function initScenarioSelector() {
  const sel = document.getElementById('srScenarioSelect');
  if (!sel) return;

  // Poblar opciones con el idioma actual
  function populateScenarios() {
    const t = k => i18n.t(k);
    sel.innerHTML = SCENARIO_IDS.map(id => `
      <option value="${id}">${t('scenario_' + id + '_name')}</option>
    `).join('');
    sel.value = state.scenario;
    updateScenarioDesc(state.scenario);
  }

  populateScenarios();
  i18n.onChange(() => populateScenarios());

  sel.addEventListener('change', () => {
    updateScenarioDesc(sel.value);
  });

  const loadBtn = document.getElementById('srLoadScenarioBtn');
  loadBtn?.addEventListener('click', () => {
    const id = sel.value;
    loadScenario(id);
    runReconcile();
  });
}

function updateScenarioDesc(id) {
  const el = document.getElementById('srScenarioDesc');
  if (el) el.textContent = i18n.t('scenario_' + id + '_desc');
}

function loadScenario(id) {
  const s = getScenario(id);
  if (!s) return;
  state.scenario  = id;
  state.mode      = 'demo';
  state.prevItems = s.prev;
  state.currItems = s.curr;
  state.prevName  = i18n.t('label_prev') + ' (' + i18n.t('scenario_' + id + '_name') + ')';
  state.currName  = i18n.t('label_curr') + ' (' + i18n.t('scenario_' + id + '_name') + ')';
  clearStatusBar();
  setModeLabel('demo', state.prevName, state.currName);
  const sel = document.getElementById('srScenarioSelect');
  if (sel) sel.value = id;
  updateScenarioDesc(id);
}

// ─── Carga de archivos ─────────────────────────────────────────────────────────

function initFileUploads() {
  setupFileInput('prev');
  setupFileInput('curr');
}

function setupFileInput(side) {
  const inputId  = `srFile${cap(side)}`;
  const btnId    = `srChoose${cap(side)}`;
  const nameId   = `srFileName${cap(side)}`;
  const sheetId  = `srSheet${cap(side)}`;
  const sheetRow = `srSheetRow${cap(side)}`;
  const mapeoId  = `srMapeo${cap(side)}`;

  const input = document.getElementById(inputId);
  const btn   = document.getElementById(btnId);
  const nameEl = document.getElementById(nameId);

  btn?.addEventListener('click', () => input?.click());

  input?.addEventListener('change', async () => {
    const file = input.files?.[0];
    if (!file) return;

    // Validación básica
    const valid = validateFile(file);
    if (!valid.ok) {
      setNameEl(nameEl, 'err', i18n.t(valid.errorKey));
      hideEl(sheetRow); hideEl(mapeoId);
      setMode_user_if_possible();
      return;
    }

    setNameEl(nameEl, '', i18n.t('btn_running') + ' ' + file.name);

    const wbResult = await readWorkbook(file);
    if (!wbResult.ok) {
      setNameEl(nameEl, 'err', i18n.t(wbResult.errorKey));
      hideEl(sheetRow); hideEl(mapeoId);
      return;
    }

    const wb = wbResult.wb;
    if (side === 'prev') state.prevWb = wb;
    else                 state.currWb = wb;

    // Mostrar selector de hojas
    const sheetRowEl = document.getElementById(sheetRow);
    const sheetSel   = document.getElementById(sheetId);
    if (sheetRowEl && sheetSel) {
      sheetSel.innerHTML = wbResult.sheetNames.map(n => `<option value="${n}">${n}</option>`).join('');
      showEl(sheetRow);
    }

    setNameEl(nameEl, 'ok', `${file.name} (${wbResult.sheetNames.length} hoja${wbResult.sheetNames.length !== 1 ? 's' : ''})`);
    hideEl(mapeoId);

    // Leer primera hoja automáticamente
    processSheet(side, wb, wbResult.sheetNames[0]);

    // Re-leer si cambia la hoja
    sheetSel?.addEventListener('change', () => {
      processSheet(side, wb, sheetSel.value);
    });
  });
}

function processSheet(side, wb, sheetName, manualMap = null) {
  const mapeoId = `srMapeo${cap(side)}`;
  const result  = readSheet(wb, sheetName, manualMap ?? {});

  if (!result.ok) {
    // Si necesita mapeo manual, mostrar panel
    if ((result.errorKey === 'err_no_sku_col' || result.errorKey === 'err_no_qty_col') && result.headers) {
      showMapeoPanel(side, wb, sheetName, result.headers, result.errorKey);
      return;
    }
    setStatusBar('err', i18n.t(result.errorKey ?? 'err_generic'));
    return;
  }

  if (side === 'prev') {
    state.prevItems = result.items;
    state.prevMap   = result.colMap;
  } else {
    state.currItems = result.items;
    state.currMap   = result.colMap;
  }

  hideEl(mapeoId);
  setMode_user_if_possible();
  clearStatusBar();
}

function showMapeoPanel(side, wb, sheetName, headers, _errorKey) {
  const mapeoId = `srMapeo${cap(side)}`;
  const panel   = document.getElementById(mapeoId);
  if (!panel) return;

  const t = k => i18n.t(k);
  const opts = headers.map(h => `<option value="${h}">${h}</option>`).join('');
  const none = `<option value="">${t('mapeo_select')}</option>`;

  panel.innerHTML = `
    <div class="sr-mapeo">
      <p class="sr-mapeo__title">${t('mapeo_title')}</p>
      <div class="sr-mapeo-row">
        <label for="srMapSku${cap(side)}">${t('mapeo_sku')}</label>
        <select id="srMapSku${cap(side)}">${none}${opts}</select>
      </div>
      <div class="sr-mapeo-row">
        <label for="srMapDesc${cap(side)}">${t('mapeo_desc')}</label>
        <select id="srMapDesc${cap(side)}">${none}${opts}</select>
      </div>
      <div class="sr-mapeo-row">
        <label for="srMapQty${cap(side)}">${t('mapeo_qty')}</label>
        <select id="srMapQty${cap(side)}">${none}${opts}</select>
      </div>
      <button type="button" class="btn btn--primary btn--sm" id="srConfirmMap${cap(side)}" style="margin-top:.5rem">
        ${t('btn_confirm_map')}
      </button>
    </div>`;

  showEl(mapeoId);

  document.getElementById(`srConfirmMap${cap(side)}`)?.addEventListener('click', () => {
    const sku  = document.getElementById(`srMapSku${cap(side)}`)?.value  || null;
    const desc = document.getElementById(`srMapDesc${cap(side)}`)?.value || null;
    const qty  = document.getElementById(`srMapQty${cap(side)}`)?.value  || null;
    if (!sku || !qty) {
      setStatusBar('err', i18n.t('err_no_sku_col'));
      return;
    }
    processSheet(side, wb, sheetName, { sku, desc, qty });
  });
}

function setMode_user_if_possible() {
  // Switch to user mode as soon as at least one user file is loaded + both inventories ready
  if ((state.prevWb || state.currWb) && state.prevItems && state.currItems) {
    state.mode = 'user';
    setModeLabel('user',
      document.getElementById('srFileNamePrev')?.textContent ?? i18n.t('label_prev'),
      document.getElementById('srFileNameCurr')?.textContent ?? i18n.t('label_curr'),
    );
  }
}

// ─── Botón restablecer ─────────────────────────────────────────────────────────

function initResetButton() {
  document.getElementById('srResetBtn')?.addEventListener('click', () => {
    // Limpiar archivos del usuario
    ['Prev','Curr'].forEach(s => {
      const input = document.getElementById(`srFile${s}`);
      if (input) input.value = '';
      setNameEl(document.getElementById(`srFileName${s}`), '', i18n.t('no_file'));
      hideEl(`srSheetRow${s}`);
      hideEl(`srMapeo${s}`);
    });
    state.prevWb = null; state.currWb = null;
    state.prevMap = null; state.currMap = null;

    loadScenario(state.scenario);
    runReconcile();
  });
}

// ─── Botón ejecutar ────────────────────────────────────────────────────────────

function initRunButton() {
  document.getElementById('srRunBtn')?.addEventListener('click', runReconcile);
}

function runReconcile() {
  const prev = state.prevItems;
  const curr = state.currItems;

  if (!prev || !curr) {
    setStatusBar('err', i18n.t('err_both_needed'));
    return;
  }

  const vPrev = validateInventory(prev);
  if (!vPrev.ok) { setStatusBar('err', i18n.t(vPrev.errorKey)); return; }

  const vCurr = validateInventory(curr);
  if (!vCurr.ok) { setStatusBar('err', i18n.t(vCurr.errorKey)); return; }

  setRunning(true);
  clearStatusBar();

  // Micro-defer para que el UI actualice el estado de "procesando"
  setTimeout(() => {
    try {
      const result = reconcile(prev, curr);
      state.result = result;

      renderKPIs(result.summary);
      setRecords(result.records);
      setExportEnabled(true);
      setStatusBar('ok', i18n.t('state_done') + ` — ${result.records.length} ${i18n.t('kpi_analyzed').toLowerCase()}`);
    } catch (err) {
      console.error('StockReconcile engine error:', err);
      setStatusBar('err', i18n.t('err_generic'));
    } finally {
      setRunning(false);
    }
  }, 0);
}

// ─── Exportación ──────────────────────────────────────────────────────────────

function initExportButton() {
  document.getElementById('srExportBtn')?.addEventListener('click', () => {
    if (!state.result) return;
    exportReport(state.result, {
      prevName: state.prevName,
      currName: state.currName,
      source:   state.mode,
    }, (k) => i18n.t(k));
  });
}

// ─── Filtros y búsqueda ────────────────────────────────────────────────────────

function initFilterSearch() {
  document.getElementById('srFilterStatus')?.addEventListener('change', onFilterChange);
  document.getElementById('srSearch')?.addEventListener('input', onFilterChange);
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function cap(s)          { return s.charAt(0).toUpperCase() + s.slice(1); }
function showEl(id)      { const el = typeof id === 'string' ? document.getElementById(id) : id; if (el) el.hidden = false; }
function hideEl(id)      { const el = typeof id === 'string' ? document.getElementById(id) : id; if (el) el.hidden = true; }
function setNameEl(el, type, text) {
  if (!el) return;
  el.className = type ? `sr-file-name sr-file-name--${type}` : 'sr-file-name';
  el.textContent = text;
}

// ─── Entrada del módulo ───────────────────────────────────────────────────────

// Esperar a que XLSX y DOM estén listos
function waitAndInit() {
  if (typeof window.XLSX !== 'undefined') {
    init();
  } else {
    // XLSX aún no cargó (script defer) — reintentar
    setTimeout(waitAndInit, 50);
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', waitAndInit);
} else {
  waitAndInit();
}
