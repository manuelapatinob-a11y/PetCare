import { Router } from 'express';
import {
    guardarPreferencias,
    listarNotificaciones,
    marcarLeida,
    marcarTodasLeidas,
} from '../../controllers/notificaciones.controller.js';
import { requiereSesion } from '../../middlewares/auth.middleware.js';

const router = Router();

// La campanita de notificaciones requiere sesión
router.use(requiereSesion);

router.get('/', listarNotificaciones);
router.put('/leidas', marcarTodasLeidas);
router.put('/preferencias', guardarPreferencias);
router.put('/:id/leida', marcarLeida);

export default router;
