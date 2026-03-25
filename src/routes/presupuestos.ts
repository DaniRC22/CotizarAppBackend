import { Router } from 'express';
import db from '../db/database';
import { PresupuestoService } from '../services';
import { PresupuestoController } from '../controllers';
import { validate } from '../middlewares/validate';
import { CreatePresupuestoSchema, UpdatePresupuestoSchema } from '../validation/schemas';

const router = Router();
const presupuestoService = new PresupuestoService(db);
const presupuestoController = new PresupuestoController(presupuestoService);

// ── Rutas ─────────────────────────────────────────────────────────────────────
router.get('/',     presupuestoController.listAll);
router.get('/:id',  presupuestoController.getById);
router.post('/',    validate(CreatePresupuestoSchema), presupuestoController.create);
router.put('/:id',  validate(UpdatePresupuestoSchema), presupuestoController.update);
router.delete('/:id', presupuestoController.delete);

export default router;
