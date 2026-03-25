import { v4 as uuidv4 } from 'uuid';
import { Presupuesto, type IPresupuesto, type IPresupuestoItem } from '../models';
import Database from 'better-sqlite3';

export interface CreatePresupuestoDTO {
  numero?: string;
  cliente_nombre: string;
  cliente_email?: string;
  cliente_telefono?: string;
  cliente_direccion?: string;
  fecha?: string;
  validez_dias?: number;
  estado?: string;
  notas?: string;
  incluye?: string;
  no_incluye?: string;
  items?: Omit<IPresupuestoItem, 'id' | 'presupuesto_id'>[];
}

export interface UpdatePresupuestoDTO extends Partial<CreatePresupuestoDTO> {}

export class PresupuestoService {
  private presupuestoModel: Presupuesto;

  constructor(private db: Database.Database) {
    this.presupuestoModel = new Presupuesto(db);
  }

  /**
   * Obtener todos los presupuestos
   */
  getAllPresupuestos(customerId: string): (IPresupuesto & { item_count?: number })[] {
    return this.presupuestoModel.getAll(customerId);
  }

  /**
   * Obtener presupuesto por ID
   */
  getPresupuestoById(id: string, customerId: string): (IPresupuesto & { items: IPresupuestoItem[] }) | null {
    return this.presupuestoModel.getById(id, customerId);
  }

  /**
   * Crear presupuesto
   */
  createPresupuesto(customerId: string, data: CreatePresupuestoDTO) {
    const id = uuidv4();
    const numero = data.numero || this.presupuestoModel.generateNextNumber(customerId);
    const fecha = data.fecha || new Date().toISOString().slice(0, 10);
    const validez_dias = data.validez_dias || 30;
    const estado = data.estado || 'borrador';
    const items = data.items || [];

    // Calcular totales
    const calcTotals = this.calculateTotals(items, data);

    const presupuestoData: Omit<IPresupuesto, 'id' | 'created_at' | 'updated_at'> = {
      customer_id: customerId,
      numero,
      cliente_nombre: data.cliente_nombre,
      cliente_email: data.cliente_email,
      cliente_telefono: data.cliente_telefono,
      cliente_direccion: data.cliente_direccion,
      fecha,
      validez_dias,
      estado: estado as any,
      notas: data.notas,
      incluye: data.incluye,
      no_incluye: data.no_incluye,
      ...calcTotals,
    };

    return this.presupuestoModel.create(id, presupuestoData, items);
  }

  /**
   * Actualizar presupuesto
   */
  updatePresupuesto(id: string, customerId: string, data: UpdatePresupuestoDTO) {
    const existing = this.presupuestoModel.getById(id, customerId);
    if (!existing) throw new Error('Presupuesto no encontrado');

    const items = data.items || existing.items;
    const calcTotals = this.calculateTotals(items, data);

    const updateData: Partial<Omit<IPresupuesto, 'id' | 'created_at' | 'updated_at'>> = {
      cliente_nombre: data.cliente_nombre || existing.cliente_nombre,
      cliente_email: data.cliente_email !== undefined ? data.cliente_email : existing.cliente_email,
      cliente_telefono: data.cliente_telefono !== undefined ? data.cliente_telefono : existing.cliente_telefono,
      cliente_direccion: data.cliente_direccion !== undefined ? data.cliente_direccion : existing.cliente_direccion,
      fecha: data.fecha || existing.fecha,
      validez_dias: data.validez_dias || existing.validez_dias,
      estado: (data.estado || existing.estado) as any,
      notas: data.notas !== undefined ? data.notas : existing.notas,
      incluye: data.incluye !== undefined ? data.incluye : existing.incluye,
      no_incluye: data.no_incluye !== undefined ? data.no_incluye : existing.no_incluye,
      ...calcTotals,
    };

    return this.presupuestoModel.update(id, customerId, updateData, items as any);
  }

  /**
   * Eliminar presupuesto
   */
  deletePresupuesto(id: string, customerId: string) {
    const exists = this.presupuestoModel.getById(id, customerId);
    if (!exists) throw new Error('Presupuesto no encontrado');
    return this.presupuestoModel.delete(id, customerId);
  }

  /**
   * Calcular totales (subtotal, descuento, iva, total)
   */
  private calculateTotals(
    items: Omit<IPresupuestoItem, 'id' | 'presupuesto_id'>[],
    data: any
  ) {
    const subtotal = items.reduce((s, i) => s + (Number(i.cantidad) * Number(i.precio_unitario)), 0);
    const descuento_pct = data.descuento_pct || 0;
    const iva_pct = data.iva_pct ?? 21;

    const descuento = subtotal * (descuento_pct / 100);
    const base = subtotal - descuento;
    const iva = base * (iva_pct / 100);
    const total = base + iva;

    return { subtotal, descuento_pct, iva_pct, total };
  }

  /**
   * Actualizar pdf_path
   */
  updatePdfPath(id: string, customerId: string, pdfPath: string) {
    this.presupuestoModel.updatePdfPath(id, customerId, pdfPath);
  }
}
