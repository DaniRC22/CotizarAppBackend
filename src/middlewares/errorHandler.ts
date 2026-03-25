import { Request, Response, NextFunction } from 'express';

/**
 * Middleware centralizado de manejo de errores.
 * Debe registrarse al final de todas las rutas en index.ts.
 *
 * Los controllers pueden llamar a next(err) o bien lanzar un error
 * con err.status / err.statusCode para controlar el código HTTP.
 */
export function errorHandler(
  err: any,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  const status: number = err.status ?? err.statusCode ?? 500;
  const message: string = err.message ?? 'Error interno del servidor';

  if (status >= 500) {
    console.error('[ERROR]', err);
  }

  res.status(status).json({ ok: false, error: message });
}
