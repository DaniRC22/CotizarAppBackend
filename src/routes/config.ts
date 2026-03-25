import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import db from '../db/database';
import { ConfigService } from '../services';
import { ConfigController } from '../controllers';
import { validate } from '../middlewares/validate';
import { SaveConfigSchema } from '../validation/schemas';

const router = Router();
const configService = new ConfigService(db);
const configController = new ConfigController(configService);

const UPLOADS_DIR = process.env.UPLOADS_PATH || path.join(__dirname, '../../uploads');
if (!fs.existsSync(UPLOADS_DIR)) fs.mkdirSync(UPLOADS_DIR, { recursive: true });

const storage = multer.diskStorage({
  destination: UPLOADS_DIR,
  filename: (req, file, cb) => {
    const customerId = (req as any).auth?.customerId as string | undefined;
    // Nombre de archivo único por tenant para evitar que un cliente pise el logo de otro.
    const safeCustomerId = String(customerId || 'unknown').replace(/[^a-zA-Z0-9_-]/g, '_');
    const ext = path.extname(file.originalname);
    cb(null, `logo_${safeCustomerId}_${Date.now()}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml'];
    cb(null, allowed.includes(file.mimetype));
  },
});

// ── Rutas ─────────────────────────────────────────────────────────────────────
router.get('/', configController.getConfig);
router.post('/', validate(SaveConfigSchema), configController.saveConfig);

// ── Subir logo ────────────────────────────────────────────────────────────────
router.post('/logo', upload.single('logo'), (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ ok: false, error: 'No se recibió imagen' });
    const logoPath = `/uploads/${req.file.filename}`;
    const customerId = (req as any).auth.customerId as string;
    configService.setLogoPath(logoPath, customerId);
    res.json({ ok: true, data: { path: logoPath } });
  } catch (e: any) {
    res.status(500).json({ ok: false, error: e.message });
  }
});

export default router;
