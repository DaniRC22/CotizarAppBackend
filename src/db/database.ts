import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

const DB_PATH = process.env.DB_PATH || path.join(__dirname, '../../data/presupuestos.db');
const DATA_DIR = process.env.DATA_DIR || path.join(__dirname, '../../data');

if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });

const db = new Database(DB_PATH);
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

db.exec(`
  CREATE TABLE IF NOT EXISTS config (
    key         TEXT NOT NULL,
    value       TEXT NOT NULL,
    customer_id TEXT NOT NULL,
    PRIMARY KEY (key, customer_id)
  );

  CREATE TABLE IF NOT EXISTS presupuestos (
    id            TEXT PRIMARY KEY,
    customer_id   TEXT NOT NULL,
    numero        TEXT NOT NULL,
    cliente_nombre TEXT NOT NULL,
    cliente_email  TEXT,
    cliente_telefono TEXT,
    cliente_direccion TEXT,
    fecha         TEXT NOT NULL,
    validez_dias  INTEGER NOT NULL DEFAULT 30,
    estado        TEXT NOT NULL DEFAULT 'borrador',
    notas         TEXT,
    incluye       TEXT,
    no_incluye    TEXT,
    subtotal      REAL NOT NULL DEFAULT 0,
    descuento_pct REAL NOT NULL DEFAULT 0,
    iva_pct       REAL NOT NULL DEFAULT 21,
    total         REAL NOT NULL DEFAULT 0,
    pdf_path      TEXT,
    created_at    TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at    TEXT NOT NULL DEFAULT (datetime('now')),
    UNIQUE (customer_id, numero)
  );

  CREATE TABLE IF NOT EXISTS presupuesto_items (
    id              TEXT PRIMARY KEY,
    presupuesto_id  TEXT NOT NULL REFERENCES presupuestos(id) ON DELETE CASCADE,
    descripcion     TEXT NOT NULL,
    detalle         TEXT,
    cantidad        REAL NOT NULL DEFAULT 1,
    unidad          TEXT DEFAULT 'u',
    precio_unitario REAL NOT NULL DEFAULT 0,
    subtotal        REAL NOT NULL DEFAULT 0,
    orden           INTEGER NOT NULL DEFAULT 0
  );

  CREATE TABLE IF NOT EXISTS licenses (
    id          TEXT PRIMARY KEY,
    license_key TEXT NOT NULL UNIQUE,
    user_email  TEXT NOT NULL,
    expires_at  TEXT NOT NULL,  -- Fecha de expiración en ISO string
    is_active   INTEGER NOT NULL DEFAULT 1,
    created_at  TEXT NOT NULL DEFAULT (datetime('now'))
  );
`);

// Multi-tenant: migración para agregar customer_id si no existe.
function ensurePresupuestosHasCustomerId() {
  const tableInfo = db.prepare("PRAGMA table_info('presupuestos')").all() as Array<{
    name: string;
  }>;

  const hasCustomerId = tableInfo.some(col => col.name === 'customer_id');

  if (hasCustomerId) return; // Ya tiene la columna

  console.log('Migrando tabla presupuestos para agregar customer_id...');

  db.exec("PRAGMA foreign_keys = OFF;");
  db.exec(`
    CREATE TABLE presupuestos_new (
      id            TEXT PRIMARY KEY,
      customer_id   TEXT NOT NULL,
      numero        TEXT NOT NULL,
      cliente_nombre TEXT NOT NULL,
      cliente_email  TEXT,
      cliente_telefono TEXT,
      cliente_direccion TEXT,
      fecha         TEXT NOT NULL,
      validez_dias  INTEGER NOT NULL DEFAULT 30,
      estado        TEXT NOT NULL DEFAULT 'borrador',
      notas         TEXT,
      incluye       TEXT,
      no_incluye    TEXT,
      subtotal      REAL NOT NULL DEFAULT 0,
      descuento_pct REAL NOT NULL DEFAULT 0,
      iva_pct       REAL NOT NULL DEFAULT 21,
      total         REAL NOT NULL DEFAULT 0,
      pdf_path      TEXT,
      created_at    TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at    TEXT NOT NULL DEFAULT (datetime('now')),
      UNIQUE (customer_id, numero)
    );

    INSERT INTO presupuestos_new (
      id, customer_id, numero, cliente_nombre, cliente_email, cliente_telefono, cliente_direccion,
      fecha, validez_dias, estado, notas, incluye, no_incluye,
      subtotal, descuento_pct, iva_pct, total, pdf_path, created_at, updated_at
    )
    SELECT
      id, 'default-customer', numero, cliente_nombre, cliente_email, cliente_telefono, cliente_direccion,
      fecha, validez_dias, estado, notas, incluye, no_incluye,
      subtotal, descuento_pct, iva_pct, total, pdf_path, created_at, updated_at
    FROM presupuestos;

    DROP TABLE presupuestos;
    ALTER TABLE presupuestos_new RENAME TO presupuestos;
  `);
  db.exec("PRAGMA foreign_keys = ON;");
}

ensurePresupuestosHasCustomerId();

export default db;
