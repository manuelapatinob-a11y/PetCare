import { Router } from 'express';
import {
    cambiarContrasena,
    cerrarSesiones,
    correoDePrueba,
    desactivarCuenta,
    editarPerfil,
    guardarConfiguracion,
    restaurarMascota,
    verConfiguracion,
    verPerfil,
} from '../../controllers/usuario.controller.js';
import { requiereSesion } from '../../middlewares/auth.middleware.js';

const router = Router();

// Todo es del usuario que inició sesión
router.use(requiereSesion);

// Perfil
router.get('/perfil', verPerfil);
router.put('/perfil', editarPerfil);
router.put('/contrasena', cambiarContrasena);

// Configuración
router.get('/configuracion', verConfiguracion);
router.put('/configuracion', guardarConfiguracion);
router.post('/correo-prueba', correoDePrueba);

router.delete('/sesiones', cerrarSesiones);
router.delete('/sesiones/:id', cerrarSesiones);

router.put('/mascotas/:id/restaurar', restaurarMascota);
router.post('/desactivar', desactivarCuenta);

export default router;
