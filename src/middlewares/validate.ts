import { Request, Response, NextFunction } from 'express';
import { ZodSchema, ZodError } from 'zod';

/**
 * Middleware de validación con Zod.
 * Valida req.body contra el schema dado.
 * Si es válido, reemplaza req.body con los datos parseados/coercionados.
 * Si no, responde 400 con los errores detallados.
 */
export function validate(schema: ZodSchema) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      const details = (result.error as ZodError).errors.map(e => ({
        field: e.path.join('.') || 'body',
        message: e.message,
      }));
      res.status(400).json({ ok: false, error: 'Datos inválidos', details });
      return;
    }
    req.body = result.data;
    next();
  };
}
