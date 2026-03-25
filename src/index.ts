import express from 'express';
import cors from 'cors';
import path from 'path';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../.env') });

// ── Routes ─────────────────────────────────────────────────────────────────────
import presupuestosRouter from './routes/presupuestos';
import configRouter from './routes/config';
import pdfRouter from './routes/pdf';
import authRouter from './routes/auth';
import { requireAuth } from './middlewares/authMiddleware';
import billingRouter from './routes/billing';
import adminRouter from './routes/admin';
import { errorHandler } from './middlewares/errorHandler';
import { requestLogger } from './middlewares/requestLogger';

const app = express();
console.log('Backend process env PORT=', process.env.PORT);
const PORT = process.env.PORT || 3002;

// ── Middleware ────────────────────────────────────────────────────────────────
const corsOrigin = process.env.CORS_ORIGIN;
app.use(
  cors({
    // Para producción: setea `CORS_ORIGIN=https://tudominio.com` (o una lista separada por comas).
    // Por defecto permitimos el origen que haga la request.
    origin: corsOrigin ? corsOrigin.split(',').map(s => s.trim()) : true,
    credentials: false, // Usamos Authorization header (Bearer), no cookies.
  })
);
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(requestLogger);

// ── Static files ───────────────────────────────────────────────────────────────
// Sirve archivos estáticos (logos)
app.use('/uploads', express.static(process.env.UPLOADS_PATH || path.join(__dirname, '../uploads')));

// ── API Routes ─────────────────────────────────────────────────────────────────
app.use('/api/auth', authRouter);
app.use('/api/presupuestos', requireAuth, presupuestosRouter);
app.use('/api/config', requireAuth, configRouter);
app.use('/api/pdf', requireAuth, pdfRouter);
app.use('/api', billingRouter);
app.use('/admin', adminRouter);

// ── Health check ───────────────────────────────────────────────────────────────
app.get('/api/health', (_req, res) => res.json({ ok: true, time: new Date().toISOString() }));

// ── Error handler (debe ir al final) ──────────────────────────────────────────
app.use(errorHandler);

// ── Server ────────────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`\n🚀 Servidor corriendo en http://localhost:${PORT}`);
  console.log(`   API: http://localhost:${PORT}/api`);
});

export default app;
