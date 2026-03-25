import Database from 'better-sqlite3';

export interface IPresupuesto {
  id: string;
  customer_id: string;
  numero: string;
  cliente_nombre: string;
  cliente_email?: string;
  cliente_telefono?: string;
  cliente_direccion?: string;
  fecha: string;
  validez_dias: number;
  estado: 'borrador' | 'enviado' | 'aceptado' | 'rechazado';
  notas?: string;
  incluye?: string;
  no_incluye?: string;
  subtotal: number;
  descuento_pct: number;
  iva_pct: number;
  total: number;
  pdf_path?: string;
  created_at: string;
  updated_at: string;
}

export interface IPresupuestoItem {
  id: string;
  presupuesto_id: string;
  descripcion: string;
  detalle?: string;
  cantidad: number;
  unidad: string;
  precio_unitario: number;
  subtotal: number;
  orden: number;
}

export class Presupuesto {
  constructor(private db: Database.Database) {}

  /**
   * Obtener todos los presupuestos con conteo de items
   */
  getAll(customerId: string): (IPresupuesto & { item_count?: number })[] {
    const stmt = this.db.prepare(`
      SELECT p.*, 
        (SELECT COUNT(*) FROM presupuesto_items pi WHERE pi.presupuesto_id = p.id) as item_count
      FROM presupuestos p 
      WHERE p.customer_id = ?
      ORDER BY p.created_at DESC
    `);
    return stmt.all(customerId) as (IPresupuesto & { item_count?: number })[];
  }

  /**
   * Obtener presupuesto por ID con sus items
   */
  getById(id: string, customerId: string): (IPresupuesto & { items: IPresupuestoItem[] }) | null {
    const pres = this.db.prepare(
      'SELECT * FROM presupuestos WHERE id = ? AND customer_id = ?'
    ).get(id, customerId) as IPresupuesto | undefined;
    if (!pres) return null;

    const items = this.db.prepare(
      'SELECT * FROM presupuesto_items WHERE presupuesto_id = ? ORDER BY orden'
    ).all(id) as IPresupuestoItem[];

    return { ...pres, items };
  }

  /**
   * Crear nuevo presupuesto con items
   */
  create(
    id: string,
    data: Omit<IPresupuesto, 'id' | 'created_at' | 'updated_at'>,
    items: Omit<IPresupuestoItem, 'id' | 'presupuesto_id'>[]
  ): IPresupuesto & { items: IPresupuestoItem[] } {
    const insertPresupuesto = this.db.prepare(`
      INSERT INTO presupuestos (id, customer_id, numero, cliente_nombre, cliente_email, cliente_telefono, 
        cliente_direccion, fecha, validez_dias, estado, notas, incluye, no_incluye, 
        subtotal, descuento_pct, iva_pct, total)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const insertItem = this.db.prepare(`
      INSERT INTO presupuesto_items (id, presupuesto_id, descripcion, detalle, 
        cantidad, unidad, precio_unitario, subtotal, orden)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const tx = this.db.transaction(() => {
      insertPresupuesto.run(
        id,
        data.customer_id,
        data.numero,
        data.cliente_nombre,
        data.cliente_email || null,
        data.cliente_telefono || null,
        data.cliente_direccion || null,
        data.fecha,
        data.validez_dias,
        data.estado,
        data.notas || null,
        data.incluye || null,
        data.no_incluye || null,
        data.subtotal,
        data.descuento_pct,
        data.iva_pct,
        data.total
      );

      items.forEach((item, idx) => {
        const { v4: uuidv4 } = require('uuid');
        insertItem.run(
          uuidv4(),
          id,
          item.descripcion,
          item.detalle || null,
          item.cantidad,
          item.unidad,
          item.precio_unitario,
          item.subtotal,
          idx
        );
      });
    });

    tx();

    const created = this.getById(id, data.customer_id);
    if (!created) throw new Error('Error creating presupuesto');
    return created;
  }

  /**
   * Actualizar presupuesto con sus items
   */
  update(
    id: string,
    customerId: string,
    data: Partial<Omit<IPresupuesto, 'id' | 'created_at' | 'updated_at'>>,
    items: Omit<IPresupuestoItem, 'id' | 'presupuesto_id'>[]
  ): IPresupuesto & { items: IPresupuestoItem[] } {
    const updatePresupuesto = this.db.prepare(`
      UPDATE presupuestos SET
        cliente_nombre=?, cliente_email=?, cliente_telefono=?, cliente_direccion=?,
        fecha=?, validez_dias=?, estado=?, notas=?, incluye=?, no_incluye=?,
        subtotal=?, descuento_pct=?, iva_pct=?, total=?, updated_at=datetime('now')
      WHERE id=? AND customer_id=?
    `);

    const insertItem = this.db.prepare(`
      INSERT INTO presupuesto_items (id, presupuesto_id, descripcion, detalle, 
        cantidad, unidad, precio_unitario, subtotal, orden)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const tx = this.db.transaction(() => {
      updatePresupuesto.run(
        data.cliente_nombre,
        data.cliente_email || null,
        data.cliente_telefono || null,
        data.cliente_direccion || null,
        data.fecha,
        data.validez_dias || 30,
        data.estado || 'borrador',
        data.notas || null,
        data.incluye || null,
        data.no_incluye || null,
        data.subtotal,
        data.descuento_pct || 0,
        data.iva_pct || 21,
        data.total,
        id,
        customerId
      );

      this.db.prepare('DELETE FROM presupuesto_items WHERE presupuesto_id = ?').run(id);

      items.forEach((item, idx) => {
        const { v4: uuidv4 } = require('uuid');
        insertItem.run(
          uuidv4(),
          id,
          item.descripcion,
          item.detalle || null,
          item.cantidad,
          item.unidad,
          item.precio_unitario,
          item.subtotal,
          idx
        );
      });
    });

    tx();

    const updated = this.getById(id, customerId);
    if (!updated) throw new Error('Error updating presupuesto');
    return updated;
  }

  /**
   * Eliminar presupuesto
   */
  delete(id: string, customerId: string): boolean {
    const result = this.db.prepare('DELETE FROM presupuestos WHERE id = ? AND customer_id = ?').run(id, customerId);
    return result.changes > 0;
  }

  /**
   * Generar número de presupuesto
   */
  generateNextNumber(customerId: string): string {
    const lastRow = this.db.prepare(
      'SELECT numero FROM presupuestos WHERE customer_id = ? ORDER BY created_at DESC LIMIT 1'
    ).get(customerId) as { numero: string } | undefined;
    const nextNum = lastRow ? String(Number(lastRow.numero.replace('P-', '')) + 1).padStart(4, '0') : '0001';
    return `P-${nextNum}`;
  }

  /**
   * Actualizar pdf_path
   */
  updatePdfPath(id: string, customerId: string, pdfPath: string): void {
    this.db.prepare('UPDATE presupuestos SET pdf_path = ? WHERE id = ? AND customer_id = ?').run(pdfPath, id, customerId);
  }
}
