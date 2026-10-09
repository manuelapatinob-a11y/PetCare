import { Router } from 'express';
import {
    crearRegistro,
    editarRegistro,
    eliminarRegistro,
    fichaActividad,
    generarIdeasActividad,
} from '../../controllers/actividad.controller.js';
import { requiereSesion } from '../../middlewares/auth.middleware.js';

const router = Router();

// Todo el apartado de actividad física requiere sesión
router.use(requiereSesion);

// Toda la información de actividad física de una mascota
router.get('/:idMascota', fichaActividad);

// Ideas con IA según el peso, la raza y la salud de la mascota
router.post('/:idMascota/ideas/generar', generarIdeasActividad);

// Actividades, paseos, pesos, metas e ideas
router.post('/:idMascota/:recurso', crearRegistro);
router.put('/:idMascota/:recurso/:id', editarRegistro);
router.delete('/:idMascota/:recurso/:id', eliminarRegistro);

export default router;
