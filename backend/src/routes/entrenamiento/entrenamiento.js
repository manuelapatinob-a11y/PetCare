import { Router } from 'express';
import {
    crearRegistro,
    editarRegistro,
    eliminarRegistro,
    fichaEntrenamiento,
    generarIdeasEntrenamiento,
    generarRutinaIA,
} from '../../controllers/entrenamiento.controller.js';
import { requiereSesion } from '../../middlewares/auth.middleware.js';

const router = Router();

// Todo el apartado de entrenamiento y comportamiento requiere sesión
router.use(requiereSesion);

// Toda la información de entrenamiento y comportamiento de una mascota
router.get('/:idMascota', fichaEntrenamiento);

// IA: ideas de entrenamiento, consejos de comportamiento y rutinas
router.post('/:idMascota/ideas/generar', generarIdeasEntrenamiento);
router.post('/:idMascota/rutinas/generar', generarRutinaIA);

// Entrenamientos, diario, rutinas, actividades de las rutinas e ideas
router.post('/:idMascota/:recurso', crearRegistro);
router.put('/:idMascota/:recurso/:id', editarRegistro);
router.delete('/:idMascota/:recurso/:id', eliminarRegistro);

export default router;
