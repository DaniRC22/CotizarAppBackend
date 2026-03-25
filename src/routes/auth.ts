import { Router } from 'express';
import { AuthService } from '../services/AuthService';
import { AuthController } from '../controllers/AuthController';
import { validate } from '../middlewares/validate';
import { ActivateSchema } from '../validation/schemas';

const router = Router();
const authService = new AuthService();
const authController = new AuthController(authService);

router.post('/activate', validate(ActivateSchema), authController.activate);
router.post('/refresh',   validate(ActivateSchema), authController.refresh);

export default router;

