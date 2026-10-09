import { Router } from 'express';
import {
    crearMascota,
    editarMascota,
    eliminarMascota,
    listarEspecies,
    listarMascotas,
    listarRazas,
} from '../../controllers/mascotas.controller.js';
import { requiereSesion } from '../../middlewares/auth.middleware.js';

const router = Router();

// Catálogos para el formulario
router.get('/especies', listarEspecies);
router.get('/razas', listarRazas);

// Mascotas del usuario que inició sesión
router.get('/', requiereSesion, listarMascotas);
router.post('/', requiereSesion, crearMascota);
router.put('/:id', requiereSesion, editarMascota);
router.delete('/:id', requiereSesion, eliminarMascota);

export default router;
