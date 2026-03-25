import { z } from 'zod';

// ── Auth ────────────────────────────────────────────────────────────────────
export const ActivateSchema = z.object({
  licenseKey: z.string().min(1, 'licenseKey es requerida'),
  machineId:  z.string().min(1, 'machineId es requerida'),
});

// ── Presupuestos ─────────────────────────────────────────────────────────────
const ItemSchema = z.object({
  descripcion:     z.string().min(1, 'La descripción del item es requerida'),
  detalle:         z.string().optional(),
  cantidad:        z.number({ invalid_type_error: 'cantidad debe ser un número' }).positive('cantidad debe ser mayor a 0'),
  unidad:          z.string().optional().default('u'),
  precio_unitario: z.number({ invalid_type_error: 'precio_unitario debe ser un número' }).min(0),
  subtotal:        z.number().optional(),
  orden:           z.number().int().optional(),
});

export const CreatePresupuestoSchema = z.object({
  cliente_nombre:    z.string().min(1, 'El nombre del cliente es requerido'),
  cliente_email:     z.string().email('Email inválido').optional().or(z.literal('')),
  cliente_telefono:  z.string().optional(),
  cliente_direccion: z.string().optional(),
  numero:            z.string().optional(),
  fecha:             z.string().optional(),
  validez_dias:      z.number().int().positive().optional(),
  estado:            z.enum(['borrador', 'enviado', 'aceptado', 'rechazado']).optional(),
  notas:             z.string().optional(),
  incluye:           z.string().optional(),
  no_incluye:        z.string().optional(),
  descuento_pct:     z.number().min(0).max(100).optional(),
  iva_pct:           z.number().min(0).max(100).optional(),
  items:             z.array(ItemSchema).optional(),
});

export const UpdatePresupuestoSchema = CreatePresupuestoSchema.partial();

// ── Config ───────────────────────────────────────────────────────────────────
export const SaveConfigSchema = z.record(z.string(), z.string());

// ── Billing / Licencias ──────────────────────────────────────────────────────
export const ValidateLicenseSchema = z.object({
  licenseKey: z.string().min(1, 'licenseKey es requerida'),
  machineId:  z.string().optional().default(''),
});

export const CreateLicenseSchema = z.object({
  customerId:  z.string().min(1, 'customerId es requerido'),
  days:        z.number().int().positive().optional().default(30),
  max_devices: z.number().int().positive().optional().default(1),
});

export const RenewLicenseSchema = z.object({
  licenseKey: z.string().min(1, 'licenseKey es requerida'),
  days:       z.number().int().positive().optional().default(30),
});

export const RevokeLicenseSchema = z.object({
  licenseKey: z.string().min(1, 'licenseKey es requerida'),
});

export const CreateCustomerSchema = z.object({
  name:    z.string().min(1, 'name es requerido'),
  email:   z.string().email('Email inválido'),
  company: z.string().optional(),
});

export const RemoveMachineSchema = z.object({
  licenseKey: z.string().min(1, 'licenseKey es requerida'),
  machineId:  z.string().min(1, 'machineId es requerida'),
});
