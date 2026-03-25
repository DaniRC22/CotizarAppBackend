import path from 'path';
import fs from 'fs';
import crypto from 'crypto';

/**
 * Obtiene el JWT secret.
 * - En producción/SaaS: usa la variable de entorno JWT_SECRET (obligatorio).
 * - En desarrollo local: genera y persiste un secret en data/jwt_secret.txt.
 */
export function getJwtSecret(): string {
  if (process.env.JWT_SECRET) return process.env.JWT_SECRET;

  // Fallback de desarrollo: secret persistido en disco
  const dataDir = process.env.DATA_DIR || path.join(__dirname, '../../data');
  if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });

  const secretPath = path.join(dataDir, 'jwt_secret.txt');
  if (fs.existsSync(secretPath)) return fs.readFileSync(secretPath, 'utf8').trim();

  const secret = crypto.randomBytes(32).toString('hex');
  fs.writeFileSync(secretPath, secret, 'utf8');
  console.warn('[WARN] JWT_SECRET no definida en env. Se generó un secreto local en:', secretPath);
  console.warn('[WARN] Para producción, define JWT_SECRET como variable de entorno.');
  return secret;
}
