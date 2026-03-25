import { Request, Response } from 'express';
import { PresupuestoService, type CreatePresupuestoDTO, type UpdatePresupuestoDTO } from '../services';

export class PresupuestoController {
  constructor(private presupuestoService: PresupuestoService) {}

  /**
   * GET /api/presupuestos - Listar todos
   */
  listAll = (req: Request, res: Response): void => {
    try {
      const customerId = (req as any).auth.customerId as string;
      const rows = this.presupuestoService.getAllPresupuestos(customerId);
      res.json({ ok: true, data: rows });
    } catch (e: any) {
      res.status(500).json({ ok: false, error: e.message });
    }
  };

  /**
   * GET /api/presupuestos/:id - Obtener uno
   */
  getById = (req: Request, res: Response): void => {
    try {
      const customerId = (req as any).auth.customerId as string;
      const pres = this.presupuestoService.getPresupuestoById(req.params.id, customerId);
      if (!pres) {
        res.status(404).json({ ok: false, error: 'No encontrado' });
        return;
      }
      res.json({ ok: true, data: pres });
    } catch (e: any) {
      res.status(500).json({ ok: false, error: e.message });
    }
  };

  /**
   * POST /api/presupuestos - Crear nuevo
   */
  create = (req: Request, res: Response): void => {
    try {
      const dto: CreatePresupuestoDTO = req.body;
      const customerId = (req as any).auth.customerId as string;
      const result = this.presupuestoService.createPresupuesto(customerId, dto);
      res.status(201).json({ ok: true, data: result });
    } catch (e: any) {
      res.status(500).json({ ok: false, error: e.message });
    }
  };

  /**
   * PUT /api/presupuestos/:id - Actualizar
   */
  update = (req: Request, res: Response): void => {
    try {
      const dto: UpdatePresupuestoDTO = req.body;
      const customerId = (req as any).auth.customerId as string;
      const result = this.presupuestoService.updatePresupuesto(req.params.id, customerId, dto);
      res.json({ ok: true, data: result });
    } catch (e: any) {
      if (e.message === 'Presupuesto no encontrado') {
        res.status(404).json({ ok: false, error: e.message });
      } else {
        res.status(500).json({ ok: false, error: e.message });
      }
    }
  };

  /**
   * DELETE /api/presupuestos/:id - Eliminar
   */
  delete = (req: Request, res: Response): void => {
    try {
      const customerId = (req as any).auth.customerId as string;
      this.presupuestoService.deletePresupuesto(req.params.id, customerId);
      res.json({ ok: true });
    } catch (e: any) {
      if (e.message === 'Presupuesto no encontrado') {
        res.status(404).json({ ok: false, error: e.message });
      } else {
        res.status(500).json({ ok: false, error: e.message });
      }
    }
  };
}
