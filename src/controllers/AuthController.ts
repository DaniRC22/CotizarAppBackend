import { Request, Response } from 'express';
import { AuthService } from '../services/AuthService';

export class AuthController {
  constructor(private authService: AuthService) {}

  activate = async (req: Request, res: Response): Promise<void> => {
    try {
      const { licenseKey, machineId } = req.body;
      const result = await this.authService.activate(licenseKey, machineId);
      if (!result.ok || !result.token) {
        res.status(401).json({ ok: false, error: result.error || 'No autorizado' });
        return;
      }

      res.json({
        ok: true,
        token: result.token,
        expiresAt: result.expiresAt,
        needsRenewal: result.needsRenewal,
        customer: result.customer,
      });
    } catch (e: any) {
      res.status(500).json({ ok: false, error: e.message || 'Error activando licencia' });
    }
  };

  refresh = async (req: Request, res: Response): Promise<void> => {
    try {
      const { licenseKey, machineId } = req.body;
      const result = await this.authService.refresh(licenseKey, machineId);
      if (!result.ok || !result.token) {
        res.status(401).json({ ok: false, error: result.error || 'Sesión inválida' });
        return;
      }

      res.json({
        ok: true,
        token: result.token,
        expiresAt: result.expiresAt,
        needsRenewal: result.needsRenewal,
        customer: result.customer,
      });
    } catch (e: any) {
      res.status(500).json({ ok: false, error: e.message || 'Error refrescando token' });
    }
  };
}

