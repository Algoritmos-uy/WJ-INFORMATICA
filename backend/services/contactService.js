import { getDb } from '../database/db.js';

export function validateContact({ nombre, email, telefono, mensaje }) {
  const errors = {};

  const n = nombre?.trim() ?? '';
  if (!n)            errors.nombre = 'El nombre es obligatorio.';
  else if (n.length > 100) errors.nombre = 'Nombre demasiado largo (máx. 100 caracteres).';

  const e = email?.trim() ?? '';
  if (!e)            errors.email = 'El correo electrónico es obligatorio.';
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e)) errors.email = 'Correo electrónico inválido.';
  else if (e.length > 254) errors.email = 'Correo demasiado largo.';

  const t = telefono?.trim() ?? '';
  if (t && t.length > 30) errors.telefono = 'Teléfono demasiado largo (máx. 30 caracteres).';

  const m = mensaje?.trim() ?? '';
  if (!m)             errors.mensaje = 'El mensaje es obligatorio.';
  else if (m.length < 10)   errors.mensaje = 'El mensaje debe tener al menos 10 caracteres.';
  else if (m.length > 2000) errors.mensaje = 'El mensaje no puede superar los 2000 caracteres.';

  return errors;
}

export function saveContact({ nombre, email, telefono, mensaje, ip }) {
  const stmt = getDb().prepare(
    'INSERT INTO contacts (nombre, email, telefono, mensaje, ip) VALUES (?, ?, ?, ?, ?)'
  );
  const result = stmt.run(
    nombre.trim(),
    email.trim(),
    telefono?.trim() || null,
    mensaje.trim(),
    ip ?? null
  );
  return result.lastInsertRowid;
}

export function getContacts({ limit = 50, offset = 0 } = {}) {
  return getDb()
    .prepare('SELECT * FROM contacts ORDER BY created_at DESC LIMIT ? OFFSET ?')
    .all(limit, offset);
}

export function updateEstado(id, estado) {
  const ESTADOS = ['pendiente', 'leida', 'atendida'];
  if (!ESTADOS.includes(estado)) throw new Error('Estado inválido: ' + estado);
  return getDb()
    .prepare("UPDATE contacts SET estado = ?, updated_at = datetime('now') WHERE id = ?")
    .run(estado, id);
}

export function deleteContact(id) {
  return getDb().prepare('DELETE FROM contacts WHERE id = ?').run(id);
}
