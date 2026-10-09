import { Router } from 'express';
import {
    crearRegistro,
    editarRegistro,
    eliminarRegistro,
    fichaSalud,
} from '../../controllers/salud.controller.js';
import { requiereSesion } from '../../middlewares/auth.middleware.js';

const router = Router();

// Todo el apartado de salud requiere sesión
router.use(requiereSesion);

// Toda la información de salud de una mascota
router.get('/:idMascota', fichaSalud);

// Vacunas, desparasitaciones, enfermedades, síntomas, antecedentes,
// medicamentos, citas y documentos
router.post('/:idMascota/:recurso', crearRegistro);
router.put('/:idMascota/:recurso/:id', editarRegistro);
router.delete('/:idMascota/:recurso/:id', eliminarRegistro);

export default router;
