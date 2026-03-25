import { Request, Response } from 'express';
import { ConfigService } from '../services';

export class ConfigController {
  constructor(private configService: ConfigService) {}

  /**
   * GET /api/config - Obtener todos los valores
   */
  getConfig = (req: Request, res: Response): void => {
    try {
      const customerId = (req as any).auth.customerId as string;
      const config = this.configService.getConfig(customerId);
      res.json({ ok: true, data: config });
    } catch (e: any) {
      res.status(500).json({ ok: false, error: e.message });
    }
  };

  /**
   * POST /api/config - Guardar configuración
   */
  saveConfig = (req: Request, res: Response): void => {
    try {
      const customerId = (req as any).auth.customerId as string;
      this.configService.saveConfig(req.body, customerId);
      res.json({ ok: true });
    } catch (e: any) {
      res.status(500).json({ ok: false, error: e.message });
    }
  };
}
