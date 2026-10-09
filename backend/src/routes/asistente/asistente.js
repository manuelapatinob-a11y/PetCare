import { Router } from 'express';
import {
    eliminarConversacion,
    enviarMensaje,
    inicioAsistente,
    verConversacion,
} from '../../controllers/asistente.controller.js';
import { requiereSesion } from '../../middlewares/auth.middleware.js';

const router = Router();

// Las conversaciones son de cada usuario
router.use(requiereSesion);

router.get('/', inicioAsistente);
router.get('/conversaciones/:id', verConversacion);
router.delete('/conversaciones/:id', eliminarConversacion);

// Pregunta a PetBot (crea la conversación si es nueva)
router.post('/mensaje', enviarMensaje);

export default router;
