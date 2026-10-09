import { Router } from 'express';
import { configuracion, google, login, logout, registro } from '../../controllers/auth.controller.js';
import { requiereSesion } from '../../middlewares/auth.middleware.js';

const router = Router();

router.get('/config', configuracion);
router.post('/registro', registro);
router.post('/login', login);
router.post('/google', google);
router.post('/logout', requiereSesion, logout);

export default router;
