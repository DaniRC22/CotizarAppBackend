import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

const DB_PATH = process.env.LICENSE_DB_PATH || path.join(__dirname, '../../data/licenses.db');
const DATA_DIR = path.dirname(DB_PATH);

if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });

const db = new Database(DB_PATH);
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

// Tablas de billing (multi-dispositivo + customer)
db.exec(`
  CREATE TABLE IF NOT EXISTS customers (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    company TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS licenses (
    id TEXT PRIMARY KEY,
    license_key TEXT NOT NULL UNIQUE,
    customer_id TEXT NOT NULL,
    machine_id TEXT,
    max_devices INTEGER NOT NULL DEFAULT 1,
    expires_at TEXT NOT NULL,
    is_active INTEGER DEFAULT 1,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (customer_id) REFERENCES customers (id)
  );

  -- Relación licencia <-> máquinas (multi-dispositivo)
  CREATE TABLE IF NOT EXISTS license_machines (
    id TEXT PRIMARY KEY,
    license_id TEXT NOT NULL,
    machine_id TEXT NOT NULL,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (license_id, machine_id),
    FOREIGN KEY (license_id) REFERENCES licenses (id) ON DELETE CASCADE
  );
`);

// Migration (compatibilidad)
try {
  db.exec('ALTER TABLE licenses ADD COLUMN max_devices INTEGER NOT NULL DEFAULT 1');
} catch (_e) {
  // Si ya existe, SQLite lanza error y lo ignoramos.
}

export default db;

