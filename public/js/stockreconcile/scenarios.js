// Escenarios de demostración — StockReconcile
// Datos ficticios exclusivamente para propósitos de demostración.
// Cada escenario es inmutable; se clonan antes de cada uso.

// ─── Escenario A — Cambios habituales ────────────────────────────────────────

const SCENARIO_A = {
  id: 'a',
  prev: [
    { sku: 'SKU-001', description: 'Laptop HP ProBook 450 G10',    qty: 10 },
    { sku: 'SKU-002', description: 'Monitor Dell UltraSharp 24"',   qty:  5 },
    { sku: 'SKU-003', description: 'Teclado Logitech MX Keys',      qty: 25 },
    { sku: 'SKU-004', description: 'Mouse inalámbrico MX Master 3', qty: 30 },
    { sku: 'SKU-005', description: 'Auriculares Sony WH-1000XM5',   qty:  8 },
    { sku: 'SKU-006', description: 'Cámara web Logitech C920 HD',   qty: 12 },
    { sku: 'SKU-007', description: 'Hub USB-C 7 puertos Anker',     qty: 15 },
    { sku: 'SKU-008', description: 'Disco SSD Samsung 1TB',         qty: 20 },
    { sku: 'SKU-009', description: 'Memoria RAM Corsair 16GB DDR5',  qty: 18 },
    { sku: 'SKU-010', description: 'Router Wi-Fi 6 TP-Link AX3000', qty:  6 },
    { sku: 'SKU-011', description: 'Impresora HP LaserJet Pro',      qty:  3 },
    { sku: 'SKU-012', description: 'Tablet Samsung Galaxy Tab S9',   qty:  7 },
    { sku: 'SKU-013', description: 'Cable HDMI 2.1 2m',             qty: 40 },
    { sku: 'SKU-014', description: 'Soporte monitor ajustable',      qty:  9 },
    { sku: 'SKU-015', description: 'Proyector portátil Epson EF-21', qty:  2 },
  ],
  curr: [
    { sku: 'SKU-001', description: 'Laptop HP ProBook 450 G10',     qty:  8 },  // disminución
    { sku: 'SKU-002', description: 'Monitor Dell UltraSharp 24"',    qty:  7 },  // aumento
    { sku: 'SKU-003', description: 'Teclado Logitech MX Keys',       qty: 25 },  // sin cambio
    { sku: 'SKU-004', description: 'Mouse inalámbrico MX Master 3',  qty: 22 },  // disminución
    { sku: 'SKU-005', description: 'Auriculares Sony WH-1000XM5',    qty: 11 },  // aumento
    { sku: 'SKU-006', description: 'Cámara web Logitech C920 HD',    qty:  0 },  // disminución a cero
    { sku: 'SKU-007', description: 'Hub USB-C 7 puertos Anker',      qty: 15 },  // sin cambio
    // SKU-008 ausente
    { sku: 'SKU-009', description: 'Memoria RAM Corsair 16GB DDR5',  qty: 24 },  // aumento
    { sku: 'SKU-010', description: 'Router Wi-Fi 6 TP-Link AX3000',  qty:  4 },  // disminución
    // SKU-011 ausente
    { sku: 'SKU-012', description: 'Tablet Samsung Galaxy Tab S9',    qty:  7 },  // sin cambio
    { sku: 'SKU-013', description: 'Cable HDMI 2.1 2m',              qty: 38 },  // disminución
    { sku: 'SKU-014', description: 'Soporte monitor ajustable',       qty: 12 },  // aumento
    // SKU-015 ausente
    { sku: 'SKU-016', description: 'Teclado mecánico Keychron K2',   qty:  5 },  // nuevo
    { sku: 'SKU-017', description: 'Silla ergonómica Herman Miller',  qty:  3 },  // nuevo
    { sku: 'SKU-018', description: 'Escritorio elevable Flexispot',   qty:  1 },  // nuevo
  ],
};

// ─── Escenario B — Sin diferencias ───────────────────────────────────────────

const SCENARIO_B = {
  id: 'b',
  prev: [
    { sku: 'PRD-100', description: 'Servidor rack Dell PowerEdge',  qty: 2  },
    { sku: 'PRD-101', description: 'Switch Cisco Catalyst 24p',     qty: 4  },
    { sku: 'PRD-102', description: 'UPS APC 1500VA',                qty: 6  },
    { sku: 'PRD-103', description: 'Patch panel Cat6 24p',          qty: 8  },
    { sku: 'PRD-104', description: 'Cable de red Cat6 50m',         qty: 15 },
    { sku: 'PRD-105', description: 'Rack de piso 12U cerrado',      qty: 3  },
    { sku: 'PRD-106', description: 'Bandeja fija 1U para rack',     qty: 10 },
    { sku: 'PRD-107', description: 'Organizador de cables horizontal', qty: 12 },
  ],
  curr: [
    { sku: 'PRD-100', description: 'Servidor rack Dell PowerEdge',  qty: 2  },
    { sku: 'PRD-101', description: 'Switch Cisco Catalyst 24p',     qty: 4  },
    { sku: 'PRD-102', description: 'UPS APC 1500VA',                qty: 6  },
    { sku: 'PRD-103', description: 'Patch panel Cat6 24p',          qty: 8  },
    { sku: 'PRD-104', description: 'Cable de red Cat6 50m',         qty: 15 },
    { sku: 'PRD-105', description: 'Rack de piso 12U cerrado',      qty: 3  },
    { sku: 'PRD-106', description: 'Bandeja fija 1U para rack',     qty: 10 },
    { sku: 'PRD-107', description: 'Organizador de cables horizontal', qty: 12 },
  ],
};

// ─── Escenario C — Casos especiales ──────────────────────────────────────────

const SCENARIO_C = {
  id: 'c',
  prev: [
    { sku: 'ESP-001',  description: 'Producto A (normal)',            qty: 10   },
    { sku: 'ESP-002',  description: 'Producto B (duplicado en prev)', qty: 5    },
    { sku: 'ESP-002',  description: 'Producto B — duplicado',        qty: 3    },  // duplicado
    { sku: 'ESP-003',  description: 'Producto C (cantidad vacía)',    qty: null },  // qty null
    { sku: 'ESP-004',  description: 'Producto D (cantidad texto)',    qty: 'N/A'},  // qty inválida
    { sku: 'ESP-005',  description: 'Producto E (cantidad negativa)', qty: -2   },  // negativa
    { sku: '0SKU-006', description: 'Producto con cero inicial',     qty: 8    },  // SKU leading zero
    { sku: 'esp-007',  description: 'Producto minúsculas SKU',       qty: 15   },  // lowercase SKU
    { sku: ' ESP-008 ',description: 'Producto SKU con espacios',     qty: 7    },  // spaces in SKU
    { sku: 'ESP-009',  description: 'Producto solo en anterior',     qty: 4    },  // missing
  ],
  curr: [
    { sku: 'ESP-001',  description: 'Producto A (normal)',            qty: 10   },  // sin cambio
    { sku: 'ESP-002',  description: 'Producto B — duplicado en curr', qty: 6    },  // dup prev afecta
    { sku: 'ESP-002',  description: 'Producto B duplicado en curr',   qty: 4    },  // duplicado en curr también
    { sku: 'ESP-003',  description: 'Producto C (cantidad vacía)',    qty: 12   },  // curr válida, prev vacía
    { sku: 'ESP-004',  description: 'Producto D (cantidad válida)',   qty: 20   },  // curr válida, prev inválida
    { sku: 'ESP-005',  description: 'Producto E (cantidad negativa)', qty: 3    },  // prev negativa
    { sku: '0SKU-006', description: 'Producto con cero inicial',     qty: 10   },  // leading zero — se mantiene
    { sku: 'ESP-007',  description: 'Producto mayúsculas SKU',       qty: 18   },  // diferente case → mismo SKU normalizado
    { sku: 'ESP-008',  description: 'Producto SKU sin espacios',     qty: 9    },  // trim → mismo SKU
    { sku: 'ESP-010',  description: 'Producto solo en actual',       qty: 5    },  // nuevo
  ],
};

// ─── Exportación ─────────────────────────────────────────────────────────────

export function getScenario(id) {
  const MAP = { a: SCENARIO_A, b: SCENARIO_B, c: SCENARIO_C };
  const src = MAP[id];
  if (!src) return null;
  // Clonar profundamente para que cada ejecución parta de datos limpios
  return {
    id: src.id,
    prev: src.prev.map(r => ({ ...r })),
    curr: src.curr.map(r => ({ ...r })),
  };
}

export const SCENARIO_IDS = ['a', 'b', 'c'];
