import { Router } from 'express';
import {
    completarRecordatorio,
    crearRecordatorio,
    editarRecordatorio,
    eliminarRecordatorio,
    listarRecordatorios,
    reabrirRecordatorio,
} from '../../controllers/recordatorios.controller.js';
import { requiereSesion } from '../../middlewares/auth.middleware.js';

const router = Router();

// Los recordatorios son de cada usuario
router.use(requiereSesion);

// Recordatorios del usuario y los próximos de Salud
router.get('/', listarRecordatorios);

router.post('/', crearRecordatorio);
router.put('/:id/completar', completarRecordatorio);
router.put('/:id/reabrir', reabrirRecordatorio);
router.put('/:id', editarRecordatorio);
router.delete('/:id', eliminarRecordatorio);

export default router;
