import { test, describe, before, after, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { initDb, closeDb } from '../backend/database/db.js';
import { handleContact } from '../backend/routes/contact.js';
import { resetRateLimitStore } from '../backend/middleware/rateLimit.js';
import { validateContact } from '../backend/services/contactService.js';

// ─── Helpers ────────────────────────────────────────────────────────────────

let server;
let baseUrl;

async function request(method, path, body, headers = {}) {
  const opts = {
    method,
    headers: { 'Content-Type': 'application/json', ...headers },
  };
  const res = await fetch(baseUrl + path, {
    ...opts,
    body: body ? JSON.stringify(body) : undefined,
  });
  const json = await res.json().catch(() => null);
  return { status: res.status, body: json };
}

function post(data, headers) { return request('POST', '/api/contact', data, headers); }

const VALID = {
  nombre:   'Test Usuario',
  email:    'test@ejemplo.com',
  telefono: '099000000',
  mensaje:  'Este es un mensaje de prueba con suficientes caracteres.',
};

// ─── Setup / Teardown ───────────────────────────────────────────────────────

before(async () => {
  initDb(':memory:');

  server = createServer(async (req, res) => {
    if (req.method === 'POST' && req.url === '/api/contact') {
      await handleContact(req, res);
    } else {
      res.writeHead(404); res.end();
    }
  });

  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  baseUrl = `http://127.0.0.1:${server.address().port}`;
});

after(async () => {
  await new Promise(resolve => server.close(resolve));
  closeDb();
});

beforeEach(() => { resetRateLimitStore(); });

// ─── Tests de validación (unitarios) ────────────────────────────────────────

describe('validateContact', () => {
  test('acepta datos válidos', () => {
    const errors = validateContact(VALID);
    assert.deepEqual(errors, {});
  });

  test('rechaza nombre vacío', () => {
    const errors = validateContact({ ...VALID, nombre: '' });
    assert.ok(errors.nombre);
  });

  test('rechaza email inválido', () => {
    const errors = validateContact({ ...VALID, email: 'no-es-email' });
    assert.ok(errors.email);
  });

  test('rechaza email vacío', () => {
    const errors = validateContact({ ...VALID, email: '' });
    assert.ok(errors.email);
  });

  test('rechaza mensaje corto', () => {
    const errors = validateContact({ ...VALID, mensaje: 'corto' });
    assert.ok(errors.mensaje);
  });

  test('rechaza mensaje demasiado largo', () => {
    const errors = validateContact({ ...VALID, mensaje: 'x'.repeat(2001) });
    assert.ok(errors.mensaje);
  });

  test('acepta teléfono vacío (campo opcional)', () => {
    const errors = validateContact({ ...VALID, telefono: '' });
    assert.deepEqual(errors, {});
  });

  test('rechaza teléfono excesivamente largo', () => {
    const errors = validateContact({ ...VALID, telefono: 'x'.repeat(31) });
    assert.ok(errors.telefono);
  });
});

// ─── Tests de integración HTTP ───────────────────────────────────────────────

describe('POST /api/contact', () => {
  test('201 con datos válidos', async () => {
    const { status, body } = await post(VALID);
    assert.equal(status, 201);
    assert.equal(body.ok, true);
    assert.ok(body.message);
  });

  test('201 sin teléfono (campo opcional)', async () => {
    const { status } = await post({ ...VALID, email: 'sin-tel@test.com', telefono: '' });
    assert.equal(status, 201);
  });

  test('422 cuando faltan campos obligatorios', async () => {
    const { status, body } = await post({ nombre: '', email: '', mensaje: '' });
    assert.equal(status, 422);
    assert.ok(body.errors?.nombre);
    assert.ok(body.errors?.email);
    assert.ok(body.errors?.mensaje);
  });

  test('422 con email inválido', async () => {
    const { status, body } = await post({ ...VALID, email: 'invalido' });
    assert.equal(status, 422);
    assert.ok(body.errors?.email);
  });

  test('400 con JSON malformado', async () => {
    const res = await fetch(baseUrl + '/api/contact', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    'no es json{{{',
    });
    assert.equal(res.status, 400);
  });

  test('429 al superar el límite de solicitudes', async () => {
    const ip = '10.0.0.99';
    const headers = { 'x-forwarded-for': ip };
    // Las 3 primeras deben pasar
    await post({ ...VALID, email: 'rl1@test.com' }, headers);
    await post({ ...VALID, email: 'rl2@test.com' }, headers);
    await post({ ...VALID, email: 'rl3@test.com' }, headers);
    // La 4ª debe ser rechazada
    const { status, body } = await post({ ...VALID, email: 'rl4@test.com' }, headers);
    assert.equal(status, 429);
    assert.ok(body.error);
  });

  test('no expone información sensible en errores 500', async () => {
    // Cierra la DB para forzar un error de persistencia
    closeDb();
    const { status, body } = await post(VALID);
    // Restaura la DB para los tests siguientes
    initDb(':memory:');
    assert.equal(status, 500);
    assert.ok(!JSON.stringify(body).includes('database'));
    assert.ok(!JSON.stringify(body).includes('SQLITE'));
  });
});
