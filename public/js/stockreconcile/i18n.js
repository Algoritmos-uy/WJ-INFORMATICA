// Internacionalización de StockReconcile — ES / EN / PT-BR
// Todas las cadenas de la interfaz centralizadas aquí.

const STORAGE_KEY = 'sr-lang';

// ─── Traducciones ─────────────────────────────────────────────────────────────

const T = {
  es: {
    app_title:   'StockReconcile',
    app_sub:     'Reconciliación y comparación de inventarios',
    demo_badge:  'Demo interactiva',
    back_portfolio: '← Volver al portfolio',

    privacy: 'Los archivos se procesan localmente en tu navegador. Ningún dato se envía a servidores externos.',

    lang_label: 'Idioma',

    // Escenarios
    scenario_label:   'Escenario de demostración',
    scenario_a_name:  'A — Cambios habituales',
    scenario_a_desc:  'Inventario con nuevos productos, ausencias y variaciones de stock.',
    scenario_b_name:  'B — Sin diferencias',
    scenario_b_desc:  'Dos inventarios idénticos: validación de coincidencia exacta.',
    scenario_c_name:  'C — Casos especiales',
    scenario_c_desc:  'SKU duplicados, cantidades inválidas y valores vacíos.',
    btn_load_scenario:'Cargar escenario',
    btn_reset:        'Restablecer demo',

    // Carga de archivos
    upload_title:     'Cargar archivos Excel',
    upload_prev_lbl:  'Inventario anterior (.xlsx)',
    upload_curr_lbl:  'Inventario actual (.xlsx)',
    btn_choose:       'Elegir archivo',
    no_file:          'Ningún archivo seleccionado',
    btn_change:       'Cambiar',
    sheet_label:      'Hoja:',
    mapeo_title:      'Mapeo de columnas',
    mapeo_sku:        'Columna SKU',
    mapeo_desc:       'Columna descripción',
    mapeo_qty:        'Columna cantidad',
    mapeo_select:     '— Seleccionar —',
    btn_confirm_map:  'Confirmar mapeo',

    // Límites y formatos admitidos
    limit_size:       'Tamaño máximo: 5 MB',
    limit_rows:       'Máximo de filas: 10 000',
    format_supported: 'Formato compatible: .xlsx (Excel 2007 o posterior)',

    // Botón principal
    btn_run:          'Ejecutar reconciliación',
    btn_running:      'Procesando…',
    mode_demo:        'Datos de demostración',
    mode_user:        'Archivos del usuario',
    label_prev:       'Inventario anterior',
    label_curr:       'Inventario actual',

    // KPIs / Resumen
    summary_title:    'Resumen de resultados',
    kpi_analyzed:     'Analizados',
    kpi_unchanged:    'Sin cambios',
    kpi_increase:     'Aumentos',
    kpi_decrease:     'Disminuciones',
    kpi_new:          'Nuevos',
    kpi_missing:      'Ausentes',
    kpi_review:       'Requieren revisión',

    // Tabla
    table_title:      'Detalle por producto',
    col_sku:          'SKU',
    col_desc:         'Descripción',
    col_prev:         'Cant. anterior',
    col_curr:         'Cant. actual',
    col_diff:         'Diferencia',
    col_status:       'Estado',
    col_notes:        'Observaciones',
    table_empty:      'No hay resultados para los filtros aplicados.',
    table_no_run:     'Ejecutá la reconciliación para ver los resultados.',
    filter_all:       'Todos los estados',
    search_ph:        'Buscar SKU o descripción…',
    rows_shown:       (n, total) => `Mostrando ${n} de ${total} registros`,

    // Estados
    status_unchanged: 'Sin cambios',
    status_increase:  'Aumento',
    status_decrease:  'Disminución',
    status_new:       'Nuevo',
    status_missing:   'Ausente',
    status_invalid:   'Inválido',
    status_duplicate: 'Duplicado',

    // Notas automáticas
    note_dup_prev:    'SKU duplicado en inventario anterior',
    note_dup_curr:    'SKU duplicado en inventario actual',
    note_inv_qty_prev:'Cantidad inválida en inventario anterior',
    note_inv_qty_curr:'Cantidad inválida en inventario actual',
    note_empty_prev:  'Cantidad vacía en inventario anterior',
    note_empty_curr:  'Cantidad vacía en inventario actual',
    note_neg_qty:     'Cantidad negativa registrada',
    note_zero_curr:   'Stock actual igual a cero (distinto de producto ausente)',

    // Exportación
    btn_export:       'Exportar informe (.xlsx)',
    export_tooltip:   'Genera un archivo Excel con todos los resultados de la reconciliación.',
    export_filename:  'StockReconcile',

    // Errores de carga
    err_file_size:    'El archivo supera el límite de 5 MB.',
    err_not_xlsx:     'El archivo no es un .xlsx válido.',
    err_empty_file:   'El archivo no contiene datos legibles.',
    err_too_many_rows:'El archivo supera el límite de 10 000 filas.',
    err_no_sku_col:   'No se encontró la columna SKU. Revisá los encabezados o usá el mapeo manual.',
    err_no_qty_col:   'No se encontró la columna de cantidad. Revisá los encabezados o usá el mapeo manual.',
    err_read_failed:  'Error al leer el archivo. Verificá que sea un .xlsx válido.',
    err_both_needed:  'Cargá ambos inventarios antes de ejecutar la reconciliación.',
    err_generic:      'Error inesperado. Intentá nuevamente.',

    // Informe exportado
    rpt_title:        'Informe de reconciliación — StockReconcile',
    rpt_generated:    'Generado el',
    rpt_source:       'Fuente',
    rpt_src_demo:     'Datos de demostración',
    rpt_src_user:     'Archivos del usuario',
    rpt_prev_name:    'Inventario anterior',
    rpt_curr_name:    'Inventario actual',
    rpt_summary:      'Resumen',
    rpt_detail:       'Detalle por producto',

    // Estado del proceso
    state_ready:      'Listo para ejecutar',
    state_done:       'Reconciliación completada',
    state_error:      'Error al procesar',
  },

  en: {
    app_title:   'StockReconcile',
    app_sub:     'Inventory reconciliation and comparison',
    demo_badge:  'Interactive demo',
    back_portfolio: '← Back to portfolio',

    privacy: 'Files are processed locally in your browser. No data is sent to external servers.',

    lang_label: 'Language',

    scenario_label:   'Demo scenario',
    scenario_a_name:  'A — Typical changes',
    scenario_a_desc:  'Inventory with new products, absences and stock variations.',
    scenario_b_name:  'B — No differences',
    scenario_b_desc:  'Two identical inventories: exact match validation.',
    scenario_c_name:  'C — Special cases',
    scenario_c_desc:  'Duplicate SKUs, invalid quantities and empty values.',
    btn_load_scenario:'Load scenario',
    btn_reset:        'Reset demo',

    upload_title:     'Upload Excel files',
    upload_prev_lbl:  'Previous inventory (.xlsx)',
    upload_curr_lbl:  'Current inventory (.xlsx)',
    btn_choose:       'Choose file',
    no_file:          'No file selected',
    btn_change:       'Change',
    sheet_label:      'Sheet:',
    mapeo_title:      'Column mapping',
    mapeo_sku:        'SKU column',
    mapeo_desc:       'Description column',
    mapeo_qty:        'Quantity column',
    mapeo_select:     '— Select —',
    btn_confirm_map:  'Confirm mapping',

    limit_size:       'Maximum size: 5 MB',
    limit_rows:       'Maximum rows: 10,000',
    format_supported: 'Supported format: .xlsx (Excel 2007 or later)',

    btn_run:          'Run reconciliation',
    btn_running:      'Processing…',
    mode_demo:        'Demo data',
    mode_user:        'User files',
    label_prev:       'Previous inventory',
    label_curr:       'Current inventory',

    summary_title:    'Results summary',
    kpi_analyzed:     'Analyzed',
    kpi_unchanged:    'Unchanged',
    kpi_increase:     'Increases',
    kpi_decrease:     'Decreases',
    kpi_new:          'New',
    kpi_missing:      'Missing',
    kpi_review:       'Need review',

    table_title:      'Product detail',
    col_sku:          'SKU',
    col_desc:         'Description',
    col_prev:         'Prev. qty',
    col_curr:         'Curr. qty',
    col_diff:         'Difference',
    col_status:       'Status',
    col_notes:        'Notes',
    table_empty:      'No results for the current filters.',
    table_no_run:     'Run reconciliation to see results.',
    filter_all:       'All statuses',
    search_ph:        'Search SKU or description…',
    rows_shown:       (n, total) => `Showing ${n} of ${total} records`,

    status_unchanged: 'Unchanged',
    status_increase:  'Increase',
    status_decrease:  'Decrease',
    status_new:       'New',
    status_missing:   'Missing',
    status_invalid:   'Invalid',
    status_duplicate: 'Duplicate',

    note_dup_prev:    'Duplicate SKU in previous inventory',
    note_dup_curr:    'Duplicate SKU in current inventory',
    note_inv_qty_prev:'Invalid quantity in previous inventory',
    note_inv_qty_curr:'Invalid quantity in current inventory',
    note_empty_prev:  'Empty quantity in previous inventory',
    note_empty_curr:  'Empty quantity in current inventory',
    note_neg_qty:     'Negative quantity recorded',
    note_zero_curr:   'Current stock is zero (different from missing product)',

    btn_export:       'Export report (.xlsx)',
    export_tooltip:   'Generates an Excel file with all reconciliation results.',
    export_filename:  'StockReconcile',

    err_file_size:    'File exceeds the 5 MB limit.',
    err_not_xlsx:     'The file is not a valid .xlsx.',
    err_empty_file:   'The file contains no readable data.',
    err_too_many_rows:'File exceeds the 10,000 row limit.',
    err_no_sku_col:   'SKU column not found. Check headers or use manual mapping.',
    err_no_qty_col:   'Quantity column not found. Check headers or use manual mapping.',
    err_read_failed:  'Error reading file. Verify it is a valid .xlsx.',
    err_both_needed:  'Load both inventories before running reconciliation.',
    err_generic:      'Unexpected error. Please try again.',

    rpt_title:        'Reconciliation report — StockReconcile',
    rpt_generated:    'Generated on',
    rpt_source:       'Source',
    rpt_src_demo:     'Demo data',
    rpt_src_user:     'User files',
    rpt_prev_name:    'Previous inventory',
    rpt_curr_name:    'Current inventory',
    rpt_summary:      'Summary',
    rpt_detail:       'Product detail',

    state_ready:      'Ready to run',
    state_done:       'Reconciliation completed',
    state_error:      'Processing error',
  },

  pt: {
    app_title:   'StockReconcile',
    app_sub:     'Reconciliação e comparação de inventários',
    demo_badge:  'Demo interativa',
    back_portfolio: '← Voltar ao portfólio',

    privacy: 'Os arquivos são processados localmente no seu navegador. Nenhum dado é enviado a servidores externos.',

    lang_label: 'Idioma',

    scenario_label:   'Cenário de demonstração',
    scenario_a_name:  'A — Mudanças habituais',
    scenario_a_desc:  'Inventário com novos produtos, ausências e variações de estoque.',
    scenario_b_name:  'B — Sem diferenças',
    scenario_b_desc:  'Dois inventários idênticos: validação de correspondência exata.',
    scenario_c_name:  'C — Casos especiais',
    scenario_c_desc:  'SKUs duplicados, quantidades inválidas e valores vazios.',
    btn_load_scenario:'Carregar cenário',
    btn_reset:        'Redefinir demo',

    upload_title:     'Carregar arquivos Excel',
    upload_prev_lbl:  'Inventário anterior (.xlsx)',
    upload_curr_lbl:  'Inventário atual (.xlsx)',
    btn_choose:       'Escolher arquivo',
    no_file:          'Nenhum arquivo selecionado',
    btn_change:       'Alterar',
    sheet_label:      'Planilha:',
    mapeo_title:      'Mapeamento de colunas',
    mapeo_sku:        'Coluna SKU',
    mapeo_desc:       'Coluna descrição',
    mapeo_qty:        'Coluna quantidade',
    mapeo_select:     '— Selecionar —',
    btn_confirm_map:  'Confirmar mapeamento',

    limit_size:       'Tamanho máximo: 5 MB',
    limit_rows:       'Máximo de linhas: 10.000',
    format_supported: 'Formato compatível: .xlsx (Excel 2007 ou posterior)',

    btn_run:          'Executar reconciliação',
    btn_running:      'Processando…',
    mode_demo:        'Dados de demonstração',
    mode_user:        'Arquivos do usuário',
    label_prev:       'Inventário anterior',
    label_curr:       'Inventário atual',

    summary_title:    'Resumo dos resultados',
    kpi_analyzed:     'Analisados',
    kpi_unchanged:    'Sem mudanças',
    kpi_increase:     'Aumentos',
    kpi_decrease:     'Diminuições',
    kpi_new:          'Novos',
    kpi_missing:      'Ausentes',
    kpi_review:       'Requerem revisão',

    table_title:      'Detalhe por produto',
    col_sku:          'SKU',
    col_desc:         'Descrição',
    col_prev:         'Qt. anterior',
    col_curr:         'Qt. atual',
    col_diff:         'Diferença',
    col_status:       'Status',
    col_notes:        'Observações',
    table_empty:      'Sem resultados para os filtros aplicados.',
    table_no_run:     'Execute a reconciliação para ver os resultados.',
    filter_all:       'Todos os status',
    search_ph:        'Buscar SKU ou descrição…',
    rows_shown:       (n, total) => `Exibindo ${n} de ${total} registros`,

    status_unchanged: 'Sem mudanças',
    status_increase:  'Aumento',
    status_decrease:  'Diminuição',
    status_new:       'Novo',
    status_missing:   'Ausente',
    status_invalid:   'Inválido',
    status_duplicate: 'Duplicado',

    note_dup_prev:    'SKU duplicado no inventário anterior',
    note_dup_curr:    'SKU duplicado no inventário atual',
    note_inv_qty_prev:'Quantidade inválida no inventário anterior',
    note_inv_qty_curr:'Quantidade inválida no inventário atual',
    note_empty_prev:  'Quantidade vazia no inventário anterior',
    note_empty_curr:  'Quantidade vazia no inventário atual',
    note_neg_qty:     'Quantidade negativa registrada',
    note_zero_curr:   'Estoque atual igual a zero (diferente de produto ausente)',

    btn_export:       'Exportar relatório (.xlsx)',
    export_tooltip:   'Gera um arquivo Excel com todos os resultados da reconciliação.',
    export_filename:  'StockReconcile',

    err_file_size:    'O arquivo ultrapassa o limite de 5 MB.',
    err_not_xlsx:     'O arquivo não é um .xlsx válido.',
    err_empty_file:   'O arquivo não contém dados legíveis.',
    err_too_many_rows:'O arquivo ultrapassa o limite de 10.000 linhas.',
    err_no_sku_col:   'Coluna SKU não encontrada. Verifique os cabeçalhos ou use o mapeamento manual.',
    err_no_qty_col:   'Coluna de quantidade não encontrada. Verifique os cabeçalhos ou use o mapeamento manual.',
    err_read_failed:  'Erro ao ler o arquivo. Verifique se é um .xlsx válido.',
    err_both_needed:  'Carregue os dois inventários antes de executar a reconciliação.',
    err_generic:      'Erro inesperado. Por favor, tente novamente.',

    rpt_title:        'Relatório de reconciliação — StockReconcile',
    rpt_generated:    'Gerado em',
    rpt_source:       'Fonte',
    rpt_src_demo:     'Dados de demonstração',
    rpt_src_user:     'Arquivos do usuário',
    rpt_prev_name:    'Inventário anterior',
    rpt_curr_name:    'Inventário atual',
    rpt_summary:      'Resumo',
    rpt_detail:       'Detalhe por produto',

    state_ready:      'Pronto para executar',
    state_done:       'Reconciliação concluída',
    state_error:      'Erro no processamento',
  },
};

// ─── Detección y selección de idioma ─────────────────────────────────────────

const SUPPORTED = ['es', 'en', 'pt'];

function detectLang() {
  // 1. Preferencia guardada
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved && SUPPORTED.includes(saved)) return saved;
  } catch (_) {}

  // 2. Idioma del navegador
  const langs = navigator.languages?.length ? navigator.languages : [navigator.language ?? 'es'];
  for (const l of langs) {
    const base = l.toLowerCase().split('-')[0];
    if (base === 'pt') return 'pt';
    if (base === 'en') return 'en';
    if (base === 'es') return 'es';
  }

  // 3. Por defecto: español
  return 'es';
}

let _current = detectLang();
const _listeners = new Set();

export const i18n = {
  get lang()   { return _current; },
  t(key, ...args) {
    const val = T[_current]?.[key] ?? T.es?.[key] ?? key;
    return typeof val === 'function' ? val(...args) : val;
  },
  setLang(lang) {
    if (!SUPPORTED.includes(lang)) return;
    _current = lang;
    try { localStorage.setItem(STORAGE_KEY, lang); } catch (_) {}
    _listeners.forEach(fn => fn(lang));
  },
  onChange(fn) { _listeners.add(fn); },
  offChange(fn) { _listeners.delete(fn); },
  supported: SUPPORTED,
};
