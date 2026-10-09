import { buscarMascota, consulta, entero } from '../utils/apartado.js';
import { iaConfigurada } from '../servicios/ideasIA.js';
import { datosParaLaIA } from '../servicios/ideasMascota.js';
import { preguntarAsistente } from '../servicios/asistenteVet.js';


const MAXIMO_MENSAJE = 1500;      // caracteres por pregunta
const MAXIMO_POR_HORA = 40;       // preguntas por usuario cada hora
const MENSAJES_DE_CONTEXTO = 12;  // mensajes anteriores que se le envían a la IA


function leerDatos(fila) {
    try {
        return fila.datos_json ? JSON.parse(fila.datos_json) : null;
    } catch {
        return null;
    }
}


async function conversacionDelUsuario(id, idUsuario) {
    const [filas] = await consulta(
        `SELECT c.id_conversacion, c.id_mascota, c.titulo, m.nombre AS mascota
         FROM conversaciones c LEFT JOIN mascotas m ON m.id_mascota = c.id_mascota
         WHERE c.id_conversacion = ? AND c.id_usuario = ? AND c.tipo = 'ia'`,
        [entero(id), idUsuario]
    );
    return filas[0] || null;
}


/* ==================================
   GET /asistente
   Conversaciones del usuario, sus mascotas y si la IA está lista
================================== */

export async function inicioAsistente(req, res) {
    try {
        const idUsuario = req.usuario.id_usuario;

        const [mascotas] = await consulta(
            `SELECT m.id_mascota, m.nombre, m.foto, e.nombre AS especie
             FROM mascotas m JOIN especies e ON e.id_especie = m.id_especie
             WHERE m.id_usuario = ? AND m.activo = 1 ORDER BY m.nombre`,
            [idUsuario]
        );

        const [conversaciones] = await consulta(
            `SELECT c.id_conversacion, c.titulo, c.id_mascota, m.nombre AS mascota, c.fecha_actualizacion,
                    (SELECT COUNT(*) FROM mensajes x WHERE x.id_conversacion = c.id_conversacion) AS mensajes
             FROM conversaciones c LEFT JOIN mascotas m ON m.id_mascota = c.id_mascota
             WHERE c.id_usuario = ? AND c.tipo = 'ia'
             ORDER BY c.fecha_actualizacion DESC LIMIT 50`,
            [idUsuario]
        );

        res.json({ iaConfigurada: iaConfigurada(), mascotas, conversaciones });
    } catch (error) {
        console.error('Error al cargar el asistente:', error.message);
        res.status(500).json({ message: 'No se pudo cargar el asistente.' });
    }
}


/* ==================================
   GET /asistente/conversaciones/:id
================================== */

export async function verConversacion(req, res) {
    try {
        const conversacion = await conversacionDelUsuario(req.params.id, req.usuario.id_usuario);

        if (!conversacion) {
            return res.status(404).json({ message: 'No se encontró la conversación.' });
        }

        const [mensajes] = await consulta(
            `SELECT id_mensaje, emisor, contenido, datos_json, fecha_envio
             FROM mensajes WHERE id_conversacion = ? ORDER BY id_mensaje`,
            [conversacion.id_conversacion]
        );

        res.json({
            conversacion,
            mensajes: mensajes.map(({ datos_json, ...m }) => ({ ...m, datos: leerDatos({ datos_json }) })),
        });
    } catch (error) {
        console.error('Error al cargar la conversación:', error.message);
        res.status(500).json({ message: 'No se pudo cargar la conversación.' });
    }
}


/* ==================================
   POST /asistente/mensaje
   { mensaje, id_conversacion (opcional), id_mascota (opcional, al empezar) }
================================== */

export async function enviarMensaje(req, res) {
    try {
        const idUsuario = req.usuario.id_usuario;
        const pregunta = String(req.body.mensaje ?? '').trim();

        if (!iaConfigurada()) {
            return res.status(501).json({
                message: 'La IA todavía no está configurada en el servidor (falta GROQ_API_KEY en backend/.env).',
            });
        }

        if (!pregunta) {
            return res.status(400).json({ message: 'Escribe tu pregunta.' });
        }

        if (pregunta.length > MAXIMO_MENSAJE) {
            return res.status(400).json({ message: `La pregunta es muy larga (máximo ${MAXIMO_MENSAJE} caracteres).` });
        }

        // Límite para cuidar las consultas gratuitas
        const [[uso]] = await consulta(
            `SELECT COUNT(*) AS n FROM mensajes x JOIN conversaciones c ON c.id_conversacion = x.id_conversacion
             WHERE c.id_usuario = ? AND x.emisor = 'usuario' AND x.fecha_envio >= NOW() - INTERVAL 1 HOUR`,
            [idUsuario]
        );

        if (uso.n >= MAXIMO_POR_HORA) {
            return res.status(429).json({ message: 'Hiciste muchas preguntas en la última hora. Intenta de nuevo más tarde.' });
        }


        // Conversación: la que viene o una nueva (con o sin mascota)
        let conversacion;

        if (String(req.body.id_conversacion ?? '').trim()) {
            conversacion = await conversacionDelUsuario(req.body.id_conversacion, idUsuario);

            if (!conversacion) {
                return res.status(404).json({ message: 'No se encontró la conversación.' });
            }
        } else {
            let idMascota = null;

            if (String(req.body.id_mascota ?? '').trim()) {
                const mascota = await buscarMascota({ params: { idMascota: req.body.id_mascota }, usuario: req.usuario });

                if (!mascota) {
                    return res.status(400).json({ message: 'La mascota seleccionada no existe.' });
                }

                idMascota = mascota.id_mascota;
            }

            const titulo = pregunta.length > 70 ? `${pregunta.slice(0, 67).trim()}...` : pregunta;

            const [resultado] = await consulta(
                "INSERT INTO conversaciones (id_usuario, id_mascota, tipo, titulo) VALUES (?, ?, 'ia', ?)",
                [idUsuario, idMascota, titulo]
            );

            conversacion = await conversacionDelUsuario(resultado.insertId, idUsuario);
        }


        // Historial y datos de la mascota para la IA
        const [anteriores] = await consulta(
            `SELECT emisor, contenido FROM mensajes WHERE id_conversacion = ?
             ORDER BY id_mensaje DESC LIMIT ${MENSAJES_DE_CONTEXTO}`,
            [conversacion.id_conversacion]
        );

        const mascota = conversacion.id_mascota
            ? await buscarMascota({ params: { idMascota: conversacion.id_mascota }, usuario: req.usuario })
            : null;

        const [preguntaGuardada] = await consulta(
            "INSERT INTO mensajes (id_conversacion, emisor, contenido) VALUES (?, 'usuario', ?)",
            [conversacion.id_conversacion, pregunta]
        );


        let resultado;

        try {
            resultado = await preguntarAsistente({
                pregunta,
                historial: anteriores.reverse(),
                datosMascota: mascota ? await datosParaLaIA(mascota) : null,
                nombreUsuario: req.usuario.nombres,
            });
        } catch (error) {
            // Si la IA falla, la pregunta no queda sola en la conversación
            await consulta('DELETE FROM mensajes WHERE id_mensaje = ?', [preguntaGuardada.insertId]);

            if (!anteriores.length) {
                await consulta('DELETE FROM conversaciones WHERE id_conversacion = ?', [conversacion.id_conversacion]);
            }

            throw error;
        }


        const { respuesta, ...datos } = resultado;

        const [respuestaGuardada] = await consulta(
            "INSERT INTO mensajes (id_conversacion, emisor, contenido, datos_json) VALUES (?, 'ia', ?, ?)",
            [conversacion.id_conversacion, respuesta, JSON.stringify(datos)]
        );

        await consulta('UPDATE conversaciones SET fecha_actualizacion = NOW() WHERE id_conversacion = ?', [conversacion.id_conversacion]);

        res.status(201).json({
            conversacion,
            pregunta: { id_mensaje: preguntaGuardada.insertId, emisor: 'usuario', contenido: pregunta },
            respuesta: { id_mensaje: respuestaGuardada.insertId, emisor: 'ia', contenido: respuesta, datos },
        });
    } catch (error) {
        console.error('Error del asistente:', error.message);
        res.status(502).json({ message: error.message || 'El asistente no pudo responder. Intenta de nuevo.' });
    }
}


/* ==================================
   DELETE /asistente/conversaciones/:id
================================== */

export async function eliminarConversacion(req, res) {
    try {
        const conversacion = await conversacionDelUsuario(req.params.id, req.usuario.id_usuario);

        if (!conversacion) {
            return res.status(404).json({ message: 'No se encontró la conversación.' });
        }

        await consulta('DELETE FROM conversaciones WHERE id_conversacion = ?', [conversacion.id_conversacion]);

        res.json({ message: 'Conversación eliminada.' });
    } catch (error) {
        console.error('Error al eliminar la conversación:', error.message);
        res.status(500).json({ message: 'No se pudo eliminar la conversación.' });
    }
}
