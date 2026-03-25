import Database from 'better-sqlite3';

export interface IConfig {
  key: string;
  value: string;
}

export class Config {
  constructor(private db: Database.Database) {}

  /**
   * Obtener toda la configuración como objeto
   */
  getAll(customerId: string): Record<string, string> {
    const rows = this.db.prepare('SELECT key, value FROM config WHERE customer_id = ?').all(customerId) as IConfig[];
    const config: Record<string, string> = {};
    rows.forEach(r => { config[r.key] = r.value; });
    return config;
  }

  /**
   * Obtener un valor de configuración
   */
  get(key: string, customerId: string): string | null {
    const row = this.db.prepare('SELECT value FROM config WHERE key = ? AND customer_id = ?').get(key, customerId) as { value: string } | undefined;
    return row ? row.value : null;
  }

  /**
   * Guardar múltiples valores de configuración
   */
  saveMultiple(data: Record<string, string>, customerId: string): void {
    const upsert = this.db.prepare('INSERT OR REPLACE INTO config (key, value, customer_id) VALUES (?, ?, ?)');
    const tx = this.db.transaction(() => {
      Object.entries(data).forEach(([k, v]) => upsert.run(k, String(v), customerId));
    });
    tx();
  }

  /**
   * Guardar un valor de configuración
   */
  set(key: string, value: string, customerId: string): void {
    this.db.prepare('INSERT OR REPLACE INTO config (key, value, customer_id) VALUES (?, ?, ?)').run(key, value, customerId);
  }
}
