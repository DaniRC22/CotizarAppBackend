import { Request, Response, NextFunction } from 'express';

export function requestLogger(req: Request, res: Response, next: NextFunction) {
  const start = Date.now();

  res.on('finish', () => {
    const ms = Date.now() - start;
    const status = res.statusCode;
    const color = status >= 500 ? '\x1b[31m' // red
                : status >= 400 ? '\x1b[33m' // yellow
                : status >= 200 ? '\x1b[32m' // green
                : '\x1b[0m';
    const reset = '\x1b[0m';
    const time = new Date().toISOString().slice(11, 19); // HH:MM:SS

    console.log(`[${time}] ${color}${status}${reset} ${req.method} ${req.originalUrl} — ${ms}ms`);
  });

  next();
}
