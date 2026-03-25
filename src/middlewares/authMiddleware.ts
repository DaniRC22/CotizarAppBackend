import { Request, Response, NextFunction } from 'express';
import { decodeJwtPayload, verifyJwtHS256, type JwtClaims } from '../utils/jwt';
import { getJwtSecret } from '../utils/jwtSecret';

type AuthContext = {
  token: string;
  licenseKey?: string;
  machineId?: string;
  customerId?: string;
};

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  try {
    const auth = req.headers['authorization'];
    if (!auth || typeof auth !== 'string' || !auth.startsWith('Bearer ')) {
      res.status(401).json({ ok: false, error: 'Missing Bearer token' });
      return;
    }

    const token = auth.slice('Bearer '.length).trim();
    const payload = decodeJwtPayload(token);
    const secret = getJwtSecret();

    const verified = verifyJwtHS256({
      secret,
      token,
      expectedIssuer: 'presupuestospro',
      expectedAudience: 'presupuestospro',
    });

    const ctx: AuthContext = {
      token,
      licenseKey: verified.licenseKey ?? payload.licenseKey ?? payload.sub,
      machineId: verified.machineId ?? payload.machineId,
      customerId: verified.customerId ?? payload.customerId,
    };

    if (!ctx.customerId) {
      res.status(401).json({ ok: false, error: 'JWT sin customerId' });
      return;
    }

    (req as any).auth = ctx;
    next();
  } catch (e: any) {
    res.status(401).json({ ok: false, error: e.message || 'Unauthorized' });
  }
}

export function getAuthClaimsFromRequest(req: Request): JwtClaims {
  return (req as any).auth as JwtClaims;
}

