import { Router } from 'express';
import db from '../db/database';
import { PresupuestoService, ConfigService, PdfService } from '../services';
import { PdfController } from '../controllers';

const router = Router();
const presupuestoService = new PresupuestoService(db);
const configService = new ConfigService(db);
const pdfService = new PdfService(db);
const pdfController = new PdfController(presupuestoService, configService, pdfService);

// -- Rutas ---------------------------------------------------------------------
router.post('/:id', pdfController.generatePDF);

export default router;
