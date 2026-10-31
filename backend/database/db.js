import { DatabaseSync } from 'node:sqlite';
import { mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { env } from '../config/env.js';

let db;

export function initDb(overridePath) {
  const dbPath = overridePath ?? resolve(process.cwd(), env.DB_PATH);

  if (dbPath !== ':memory:') {
    mkdirSync(dirname(dbPath), { recursive: true });
  }

  db = new DatabaseSync(dbPath);
  db.exec('PRAGMA journal_mode = WAL;');
  db.exec('PRAGMA foreign_keys = ON;');

  // Esquema base
  db.exec(`
    CREATE TABLE IF NOT EXISTS contacts (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      nombre      TEXT    NOT NULL,
      email       TEXT    NOT NULL,
      telefono    TEXT,
      mensaje     TEXT    NOT NULL,
      ip          TEXT,
      estado      TEXT    NOT NULL DEFAULT 'pendiente',
      updated_at  TEXT,
      created_at  TEXT    NOT NULL DEFAULT (datetime('now'))
    );
  `);

  // Migración incremental para bases de datos existentes
  const cols = new Set(
    db.prepare('PRAGMA table_info(contacts)').all().map(c => c.name)
  );
  if (!cols.has('estado')) {
    db.exec(`ALTER TABLE contacts ADD COLUMN estado TEXT NOT NULL DEFAULT 'pendiente'`);
    // Migra campo legacy 'leido' si existe
    if (cols.has('leido')) {
      db.exec(`UPDATE contacts SET estado = CASE WHEN leido = 1 THEN 'leida' ELSE 'pendiente' END`);
    }
  }
  if (!cols.has('updated_at')) {
    db.exec('ALTER TABLE contacts ADD COLUMN updated_at TEXT');
  }

  if (dbPath !== ':memory:') {
    process.stdout.write(JSON.stringify({ ts: new Date().toISOString(), level: 'INFO', msg: 'db_ready', path: dbPath }) + '\n');
  }
}

export function getDb() {
  if (!db) throw new Error('Base de datos no inicializada. Llamá a initDb() primero.');
  return db;
}

export function closeDb() {
  if (db) { db.close(); db = null; }
}
