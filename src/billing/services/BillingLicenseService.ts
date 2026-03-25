import { v4 as uuidv4 } from 'uuid';
import crypto from 'crypto';
import Database from 'better-sqlite3';
import type { LicenseValidationResponse } from '../types';

export class BillingLicenseService {
  constructor(private db: Database.Database) {}

  private generateLicenseKey(): string {
    const raw = crypto.randomBytes(16).toString('hex').toUpperCase();
    const parts = raw.match(/.{4}/g);
    return (parts || []).join('-');
  }

  createCustomer(name: string, email: string, company?: string): {
    ok: true;
    customer: { id: string; name: string; email: string; company: string | undefined };
  } {
    const id = uuidv4();
    const stmt = this.db.prepare(`
      INSERT INTO customers (id, name, email, company)
      VALUES (?, ?, ?, ?)
    `);
    stmt.run(id, name, email, company || null);
    return { ok: true, customer: { id, name, email, company } };
  }

  createLicense(customerId: string, days = 30, maxDevices = 1): {
    ok: true;
    license: { id: string; licenseKey: string; expiresAt: string; maxDevices: number };
  } {
    const licenseKey = this.generateLicenseKey();
    const expiresAt = new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString();
    const id = uuidv4();

    const stmt = this.db.prepare(`
      INSERT INTO licenses (id, license_key, customer_id, max_devices, expires_at)
      VALUES (?, ?, ?, ?, ?)
    `);
    stmt.run(id, licenseKey, customerId, maxDevices, expiresAt);

    return { ok: true, license: { id, licenseKey, expiresAt, maxDevices } };
  }

  validateLicense(licenseKey: string, machineId: string): LicenseValidationResponse {
    const stmt = this.db.prepare(`
      SELECT l.*, c.id as customer_id, c.name as customer_name
      FROM licenses l
      JOIN customers c ON l.customer_id = c.id
      WHERE l.license_key = ? AND l.is_active = 1
    `);
    const license = stmt.get(licenseKey) as any;

    if (!license) {
      return { ok: true, valid: false, needsRenewal: false };
    }

    const now = new Date();
    const expiresAt = new Date(license.expires_at);
    const needsRenewal = expiresAt < new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000); // 7 días gracia

    if (expiresAt < now) {
      return { ok: true, valid: false, needsRenewal: true };
    }

    if (!machineId || typeof machineId !== 'string' || machineId.trim().length === 0) {
      return { ok: true, valid: false, needsRenewal: false, error: 'machineId requerida' };
    }

    const maxDevices = Number(license.max_devices || 1) || 1;
    const licenseId = license.id;

    // 1) Si la máquina ya está registrada, permitir.
    const isRegisteredStmt = this.db.prepare(`
      SELECT 1 as ok
      FROM license_machines
      WHERE license_id = ? AND machine_id = ?
      LIMIT 1
    `);
    const registered = isRegisteredStmt.get(licenseId, machineId);
    if (registered) {
      const devicesCountRow = this.db
        .prepare('SELECT COUNT(*) as cnt FROM license_machines WHERE license_id = ?')
        .get(licenseId) as { cnt: number };
      const devicesCount = devicesCountRow?.cnt ?? 0;

      return {
        ok: true,
        valid: true,
        needsRenewal,
        expiresAt: license.expires_at,
        devicesCount,
        customer: { id: license.customer_id, name: license.customer_name },
      };
    }

    // 2) Compatibilidad: si no hay registros en license_machines pero existe machine_id antiguo en licenses,
    //    la tratamos como 1 máquina usada.
    const machinesCountRow = this.db
      .prepare(`
        SELECT COUNT(*) as cnt
        FROM license_machines
        WHERE license_id = ?
      `)
      .get(licenseId) as { cnt: number };
    const machinesCount = machinesCountRow?.cnt ?? 0;

    const hasLegacyMachine = !!license.machine_id;
    const legacyUsesThisMachine = hasLegacyMachine && license.machine_id === machineId;

    // Si la licencia antigua estaba ligada a esta máquina, registrarla en license_machines y permitir.
    if (legacyUsesThisMachine) {
      this.db
        .prepare('INSERT OR IGNORE INTO license_machines (id, license_id, machine_id) VALUES (?, ?, ?)')
        .run(uuidv4(), licenseId, machineId);

      const devicesCount = (machinesCount || 0) + 1; // aproximación
      return {
        ok: true,
        valid: true,
        needsRenewal,
        expiresAt: license.expires_at,
        devicesCount,
        customer: { id: license.customer_id, name: license.customer_name },
      };
    }

    const legacyAlreadyCounts = hasLegacyMachine ? 1 : 0;
    const effectiveCount = Number(machinesCount || 0) + legacyAlreadyCounts;

    if (effectiveCount >= maxDevices) {
      return {
        ok: true,
        valid: false,
        needsRenewal: false,
        error: 'Max devices alcanzado para esta licencia',
      };
    }

    // 3) Permitir y registrar nueva máquina.
    this.db
      .prepare(`
        INSERT OR IGNORE INTO license_machines (id, license_id, machine_id)
        VALUES (?, ?, ?)
      `)
      .run(uuidv4(), licenseId, machineId);

    return {
      ok: true,
      valid: true,
      needsRenewal,
      expiresAt: license.expires_at,
      devicesCount: effectiveCount + 1,
      customer: { id: license.customer_id, name: license.customer_name },
    };
  }

  renewLicense(licenseKey: string, days = 30): { ok: true; renewed: true; expiresAt: string } {
    const stmt = this.db.prepare(`
      UPDATE licenses
      SET expires_at = ?
      WHERE license_key = ? AND is_active = 1
    `);

    const newExpiresAt = new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString();
    const result = stmt.run(newExpiresAt, licenseKey);

    if (result.changes === 0) {
      throw new Error('License not found or inactive');
    }

    return { ok: true, renewed: true, expiresAt: newExpiresAt };
  }

  revokeLicense(licenseKey: string): { ok: true; revoked: true } {
    const stmt = this.db.prepare(`
      UPDATE licenses
      SET is_active = 0
      WHERE license_key = ?
    `);

    const result = stmt.run(licenseKey);
    if (result.changes === 0) {
      throw new Error('License not found');
    }

    return { ok: true, revoked: true };
  }

  removeMachine(licenseKey: string, machineId: string): { ok: true; removed: true } {
    const license = this.db.prepare(
      `SELECT id FROM licenses WHERE license_key = ? AND is_active = 1`
    ).get(licenseKey) as { id: string } | undefined;

    if (!license) throw new Error('License not found or inactive');

    const result = this.db.prepare(
      `DELETE FROM license_machines WHERE license_id = ? AND machine_id = ?`
    ).run(license.id, machineId);

    if (result.changes === 0) throw new Error('Machine not registered on this license');

    return { ok: true, removed: true };
  }

  getCustomers(): { id: string; name: string; email: string; company: string | null; created_at: string }[] {
    return this.db.prepare(
      `SELECT id, name, email, company, created_at FROM customers ORDER BY created_at DESC`
    ).all() as any[];
  }

  getLicenses(customerId?: string): {
    id: string; license_key: string; customer_id: string; customer_name: string;
    max_devices: number; expires_at: string; is_active: number; created_at: string;
    devices_count: number;
  }[] {
    const query = `
      SELECT
        l.id, l.license_key, l.customer_id, c.name as customer_name,
        l.max_devices, l.expires_at, l.is_active, l.created_at,
        COUNT(lm.id) as devices_count
      FROM licenses l
      JOIN customers c ON l.customer_id = c.id
      LEFT JOIN license_machines lm ON lm.license_id = l.id
      ${customerId ? 'WHERE l.customer_id = ?' : ''}
      GROUP BY l.id
      ORDER BY l.created_at DESC
    `;
    return this.db.prepare(query).all(...(customerId ? [customerId] : [])) as any[];
  }

  getMachines(licenseKey: string): { machine_id: string; created_at: string }[] {
    const license = this.db.prepare(
      `SELECT id FROM licenses WHERE license_key = ?`
    ).get(licenseKey) as { id: string } | undefined;

    if (!license) throw new Error('License not found');

    return this.db.prepare(
      `SELECT machine_id, created_at FROM license_machines WHERE license_id = ? ORDER BY created_at`
    ).all(license.id) as any[];
  }
}

