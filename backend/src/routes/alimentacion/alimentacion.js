import { Router } from 'express';
import {
    crearRegistro,
    editarRegistro,
    eliminarRegistro,
    fichaAlimentacion,
} from '../../controllers/alimentacion.controller.js';
import { requiereSesion } from '../../middlewares/auth.middleware.js';

const router = Router();

// Todo el apartado de alimentación requiere sesión
router.use(requiereSesion);

// Toda la información de alimentación de una mascota
router.get('/:idMascota', fichaAlimentacion);

// Alimentos, restricciones, comidas, horarios, planes, agua,
// pesos, compras y recomendaciones nutricionales
router.post('/:idMascota/:recurso', crearRegistro);
router.put('/:idMascota/:recurso/:id', editarRegistro);
router.delete('/:idMascota/:recurso/:id', eliminarRegistro);

export default router;
