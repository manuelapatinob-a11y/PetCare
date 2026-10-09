import { Router } from 'express';
import { resumenInicio } from '../../controllers/inicio.controller.js';
import { requiereSesion } from '../../middlewares/auth.middleware.js';

const router = Router();

// Resumen de la página de inicio del usuario
router.get('/', requiereSesion, resumenInicio);

export default router;
