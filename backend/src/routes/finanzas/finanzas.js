import { Router } from 'express';
import {
    crearGasto,
    editarGasto,
    eliminarGasto,
    fichaFinanzas,
    guardarPresupuesto,
} from '../../controllers/finanzas.controller.js';
import { requiereSesion } from '../../middlewares/auth.middleware.js';

const router = Router();

// Las finanzas son de cada usuario
router.use(requiereSesion);

// Gastos de todas las mascotas, presupuestos y registros sin costo
router.get('/', fichaFinanzas);

router.post('/gastos', crearGasto);
router.put('/gastos/:id', editarGasto);
router.delete('/gastos/:id', eliminarGasto);

router.put('/presupuesto', guardarPresupuesto);

export default router;
