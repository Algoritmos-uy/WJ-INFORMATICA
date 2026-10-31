import { test, describe, before, after, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { scrypt, randomBytes } from 'node:crypto';
import { promisify } from 'node:util';
import { initDb, closeDb } from '../backend/database/db.js';
import { handleAdminApi } from '../backend/routes/admin.js';
import { handleContact } from '../backend/routes/contact.js';
import { resetRateLimitStore } from '../backend/middleware/rateLimit.js';

const scryptAsync = promisify(scrypt);

// ── Setup de credenciales de prueba ─────────────────────────────────────────

const TEST_USER = 'testadmin';
const TEST_PASS = 'contraseñaSegura123!';
let TEST_HASH;

before(async () => {
  const salt = randomBytes(16).toString('hex');
  const hash = (await scryptAsync(TEST_PASS, salt, 64)).toString('hex');
  TEST_HASH = `${salt}:${hash}`;

  process.env.ADMIN_USERNAME    = TEST_USER;
  process.env.ADMIN_PASSWORD_HASH = TEST_HASH;

  initDb(':memory:');
});

after(async () => {
  await new Promise(resolve => server.close(resolve));
  closeDb();
});

beforeEach(() => resetRateLimitStore());

// ── Servidor de prueba ───────────────────────────────────────────────────────

let server;
let baseUrl;

before(async () => {
  server = createServer(async (req, res) => {
    const url = new URL(req.url, 'http://localhost');
    if (req.url.startsWith('/admin/')) {
      await handleAdminApi(req, res, url);
    } else if (req.method === 'POST' && req.url === '/api/contact') {
      await handleContact(req, res);
    } else {
      res.writeHead(404); res.end();
    }
  });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  baseUrl = `http://127.0.0.1:${server.address().port}`;
});

// ── Helpers ──────────────────────────────────────────────────────────────────

async function req(method, path, body, headers = {}) {
  const opts = { method, headers: { 'Content-Type': 'application/json', ...headers } };
  if (body) opts.body = JSON.stringify(body);
  const res  = await fetch(baseUrl + path, opts);
  const json = await res.json().catch(() => null);
  return { status: res.status, ok: res.ok, data: json, headers: res.headers };
}

async function login(user = TEST_USER, pass = TEST_PASS) {
  return req('POST', '/admin/api/login', { username: user, password: pass });
}

async function loginGetCookie() {
  const res = await fetch(baseUrl + '/admin/api/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: TEST_USER, password: TEST_PASS }),
  });
  const setCookie = res.headers.get('set-cookie') ?? '';
  const match = setCookie.match(/wj-admin-session=([^;]+)/);
  return match ? match[1] : null;
}

function authHeader(token) {
  return { Cookie: `wj-admin-session=${token}` };
}

// ── Tests ────────────────────────────────────────────────────────────────────

describe('Autenticación', () => {
  test('200 con credenciales correctas', async () => {
    const { status, data } = await login();
    assert.equal(status, 200);
    assert.equal(data.ok, true);
  });

  test('401 con contraseña incorrecta', async () => {
    const { status } = await login(TEST_USER, 'wrongpassword');
    assert.equal(status, 401);
  });

  test('401 con usuario incorrecto', async () => {
    const { status } = await login('otrousuario', TEST_PASS);
    assert.equal(status, 401);
  });

  test('Set-Cookie con HttpOnly y SameSite=Strict en respuesta de login', async () => {
    const res = await fetch(baseUrl + '/admin/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: TEST_USER, password: TEST_PASS }),
    });
    const cookie = res.headers.get('set-cookie') ?? '';
    assert.ok(cookie.includes('HttpOnly'), 'falta HttpOnly');
    assert.ok(cookie.includes('SameSite=Strict'), 'falta SameSite=Strict');
    assert.ok(cookie.includes('wj-admin-session='), 'falta token');
  });

  test('429 al superar intentos de login', async () => {
    for (let i = 0; i < 5; i++) await login(TEST_USER, 'mal');
    const { status } = await login(TEST_USER, 'mal');
    assert.equal(status, 429);
  });
});

describe('Rutas protegidas — sin sesión', () => {
  test('401 al listar consultas sin autenticación', async () => {
    const { status } = await req('GET', '/admin/api/contacts');
    assert.equal(status, 401);
  });

  test('401 al actualizar estado sin autenticación', async () => {
    const { status } = await req('PATCH', '/admin/api/contacts/1', { estado: 'leida' });
    assert.equal(status, 401);
  });

  test('401 al eliminar sin autenticación', async () => {
    const { status } = await req('DELETE', '/admin/api/contacts/1');
    assert.equal(status, 401);
  });

  test('401 al cerrar sesión sin autenticación', async () => {
    const { status } = await req('POST', '/admin/api/logout');
    assert.equal(status, 401);
  });
});

describe('Operaciones administrativas autenticadas', () => {
  let token;
  before(async () => { token = await loginGetCookie(); });

  test('200 al listar consultas con sesión válida', async () => {
    const { status, data } = await req('GET', '/admin/api/contacts', null, authHeader(token));
    assert.equal(status, 200);
    assert.ok(Array.isArray(data.contacts));
  });

  test('puede cambiar estado de una consulta existente', async () => {
    // Crear una consulta primero
    await req('POST', '/api/contact', {
      nombre: 'Admin Test', email: 'adm@test.com',
      mensaje: 'Mensaje de prueba para el panel de administración.',
    });
    const { data: listData } = await req('GET', '/admin/api/contacts', null, authHeader(token));
    const id = listData.contacts[0]?.id;
    assert.ok(id, 'debería haber al menos una consulta');

    const { status } = await req('PATCH', `/admin/api/contacts/${id}`, { estado: 'leida' }, authHeader(token));
    assert.equal(status, 200);

    const { data: updated } = await req('GET', '/admin/api/contacts', null, authHeader(token));
    const contact = updated.contacts.find(c => c.id === id);
    assert.equal(contact.estado, 'leida');
  });

  test('422 con estado inválido', async () => {
    const { status } = await req('PATCH', '/admin/api/contacts/1', { estado: 'invalido' }, authHeader(token));
    assert.equal(status, 422);
  });

  test('puede eliminar una consulta existente', async () => {
    const { data: listBefore } = await req('GET', '/admin/api/contacts', null, authHeader(token));
    const id = listBefore.contacts[0]?.id;
    if (!id) return; // no hay consultas

    const { status } = await req('DELETE', `/admin/api/contacts/${id}`, null, authHeader(token));
    assert.equal(status, 200);

    const { data: listAfter } = await req('GET', '/admin/api/contacts', null, authHeader(token));
    assert.ok(!listAfter.contacts.find(c => c.id === id), 'consulta debería haberse eliminado');
  });

  test('404 al eliminar consulta inexistente', async () => {
    const { status } = await req('DELETE', '/admin/api/contacts/99999', null, authHeader(token));
    assert.equal(status, 404);
  });

  test('logout invalida la sesión', async () => {
    const sessionToken = await loginGetCookie();
    const { status: logoutStatus } = await req('POST', '/admin/api/logout', null, authHeader(sessionToken));
    assert.equal(logoutStatus, 200);

    // El mismo token ya no debe funcionar
    const { status: afterStatus } = await req('GET', '/admin/api/contacts', null, authHeader(sessionToken));
    assert.equal(afterStatus, 401);
  });
});
