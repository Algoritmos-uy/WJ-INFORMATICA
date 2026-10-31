import { requireAuth } from '../middleware/auth.js';
import { handleLogin, handleLogout } from '../controllers/authController.js';
import { getContacts, updateEstado, deleteContact } from '../services/contactService.js';
import { json, parseBody } from '../utils/http.js';

const ID_PATTERN = /^\/admin\/api\/contacts\/(\d+)$/;

export async function handleAdminApi(req, res, url) {
  const { pathname } = url;

  // Login — sin autenticación previa
  if (req.method === 'POST' && pathname === '/admin/api/login') {
    return handleLogin(req, res);
  }

  // Todas las rutas restantes requieren sesión válida
  const session = requireAuth(req, res);
  if (!session) return;

  // Logout
  if (req.method === 'POST' && pathname === '/admin/api/logout') {
    return handleLogout(req, res, session);
  }

  // GET /admin/api/contacts — listado
  if (req.method === 'GET' && pathname === '/admin/api/contacts') {
    const contacts = getContacts();
    return json(res, 200, { contacts });
  }

  // Rutas con ID: /admin/api/contacts/:id
  const match = pathname.match(ID_PATTERN);
  if (match) {
    const id = parseInt(match[1], 10);

    // PATCH — cambiar estado
    if (req.method === 'PATCH') {
      let body;
      try { body = await parseBody(req); }
      catch { return json(res, 400, { error: 'Solicitud inválida.' }); }

      const { estado } = body ?? {};
      const ESTADOS = ['pendiente', 'leida', 'atendida'];
      if (!ESTADOS.includes(estado)) {
        return json(res, 422, { error: 'Estado inválido.' });
      }
      updateEstado(id, estado);
      return json(res, 200, { ok: true });
    }

    // DELETE — eliminar con verificación de existencia
    if (req.method === 'DELETE') {
      const result = deleteContact(id);
      if (result.changes === 0) return json(res, 404, { error: 'Consulta no encontrada.' });
      return json(res, 200, { ok: true });
    }
  }

  return json(res, 404, { error: 'Ruta no encontrada.' });
}
