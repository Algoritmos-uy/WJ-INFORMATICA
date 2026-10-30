import { DatabaseSync } from 'node:sqlite';
import { mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { env } from '../config/env.js';

let db;

export function initDb() {
  const path = resolve(process.cwd(), env.DB_PATH);
  mkdirSync(dirname(path), { recursive: true });

  db = new DatabaseSync(path);
  db.exec('PRAGMA journal_mode = WAL;');
  db.exec('PRAGMA foreign_keys = ON;');

  db.exec(`
    CREATE TABLE IF NOT EXISTS contacts (
      id         INTEGER PRIMARY KEY AUTOINCREMENT,
      nombre     TEXT    NOT NULL,
      email      TEXT    NOT NULL,
      telefono   TEXT,
      mensaje    TEXT    NOT NULL,
      ip         TEXT,
      leido      INTEGER NOT NULL DEFAULT 0,
      created_at TEXT    NOT NULL DEFAULT (datetime('now'))
    );
  `);

  console.log('[db] SQLite listo:', path);
}

export function getDb() {
  if (!db) throw new Error('Base de datos no inicializada. Llamá a initDb() primero.');
  return db;
}
