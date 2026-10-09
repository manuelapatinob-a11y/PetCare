import { buscarMascota, consulta, crearApartado } from '../utils/apartado.js';
import { CATEGORIAS_RUTINA, DIAS, generarRutina, iaConfigurada } from '../servicios/ideasIA.js';
import { crearGeneradorIdeas, datosParaLaIA } from '../servicios/ideasMascota.js';
import { recursos } from './entrenamiento.recursos.js';


/* ==================================
   RUTINAS: solo una activa por mascota
================================== */

async function dejarUnaActiva(idRutina, activa, idMascota) {

    if (activa) {
        await consulta(
            'UPDATE rutinas SET activa = 0 WHERE id_mascota = ? AND id_rutina <> ?',
            [idMascota, idRutina]
        );
        return;
    }

    // Si ninguna quedó activa, esta pasa a ser la activa
    const [activas] = await consulta('SELECT 1 FROM rutinas WHERE id_mascota = ? AND activa = 1 LIMIT 1', [idMascota]);

    if (!activas.length) {
        await consulta('UPDATE rutinas SET activa = 1 WHERE id_rutina = ?', [idRutina]);
    }
}


async function despuesDeGuardar(clave, id, datos, extras, mascota) {

    if (clave === 'rutinas') {
        await dejarUnaActiva(id, datos.activa, mascota.id_mascota);
    }
}


async function despuesDeEliminar(clave, registro, mascota) {

    // Si se borra la rutina activa, la más reciente pasa a ser la activa
    if (clave === 'rutinas' && registro.activa) {
        await consulta(
            'UPDATE rutinas SET activa = 1 WHERE id_mascota = ? ORDER BY fecha_creacion DESC LIMIT 1',
            [mascota.id_mascota]
        );
    }
}


/* ==================================
   IDEAS Y CONSEJOS CON IA
================================== */

// POST /entrenamiento/:idMascota/ideas/generar   { seccion: entrenamiento | comportamiento }
export const generarIdeasEntrenamiento = crearGeneradorIdeas('entrenamiento');


/* ==================================
   GENERADOR DE RUTINAS CON IA
   POST /entrenamiento/:idMascota/rutinas/generar
   { objetivo, minutos, desde, hasta, dias_ocupados, notas }
================================== */

const OBJETIVOS = {
    equilibrio: 'Rutina equilibrada para el día a día',
    obediencia: 'Mejorar la obediencia y aprender comandos',
    energia: 'Gastar energía y reducir la hiperactividad',
    ansiedad: 'Reducir la ansiedad o el miedo',
    separacion: 'Manejar la ansiedad por separación',
    socializacion: 'Socialización con personas y otros animales',
    cachorro: 'Rutina de cachorro: hábitos, mordidas y necesidades',
    senior: 'Rutina suave para una mascota mayor',
    peso: 'Más actividad para controlar el peso',
};

const hora = (texto, defecto) => (/^([01]\d|2[0-3]):[0-5]\d$/.test(String(texto ?? '')) ? texto : defecto);


export async function generarRutinaIA(req, res) {
    try {
        if (!iaConfigurada()) {
            return res.status(501).json({
                message: 'La IA todavía no está configurada en el servidor (falta GROQ_API_KEY en backend/.env).',
            });
        }

        const mascota = await buscarMascota(req);

        if (!mascota) {
            return res.status(404).json({ message: 'No se encontró la mascota.' });
        }

        const objetivo = OBJETIVOS[req.body.objetivo] ? req.body.objetivo : null;

        if (!objetivo) {
            return res.status(400).json({ message: 'Elige el objetivo de la rutina.' });
        }

        const minutos = Number(req.body.minutos);

        if (!Number.isInteger(minutos) || minutos < 5 || minutos > 300) {
            return res.status(400).json({ message: 'Los minutos al día deben estar entre 5 y 300.' });
        }

        const desde = hora(req.body.desde, '06:00');
        const hasta = hora(req.body.hasta, '22:00');

        if (desde >= hasta) {
            return res.status(400).json({ message: 'La hora de inicio del día debe ser antes de la hora de fin.' });
        }

        // Evita generar dos rutinas seguidas por un doble clic
        const [recientes] = await consulta(
            'SELECT 1 FROM rutinas WHERE id_mascota = ? AND generada_ia = 1 AND fecha_creacion >= NOW() - INTERVAL 20 SECOND LIMIT 1',
            [mascota.id_mascota]
        );

        if (recientes.length) {
            return res.status(429).json({ message: 'Acabas de generar una rutina. Espera unos segundos.' });
        }

        const rutina = await generarRutina(await datosParaLaIA(mascota), {
            objetivo: OBJETIVOS[objetivo],
            minutos,
            desde,
            hasta,
            diasOcupados: String(req.body.dias_ocupados ?? '').slice(0, 100),
            notas: String(req.body.notas ?? '').slice(0, 300),
        });

        // Solo se guardan las actividades con datos válidos
        const actividades = rutina.actividades
            .map((a) => ({
                dia_semana: DIAS.includes(a.dia_semana) ? a.dia_semana : 'todos',
                hora: /^([01]\d|2[0-3]):[0-5]\d/.test(a.hora) ? `${a.hora.slice(0, 5)}:00` : null,
                actividad: String(a.actividad ?? '').trim().slice(0, 150),
                categoria: CATEGORIAS_RUTINA.includes(a.categoria) ? a.categoria : 'juego',
                duracion_min: Number.isInteger(a.duracion_min) && a.duracion_min > 0 ? Math.min(a.duracion_min, 600) : null,
                detalle: String(a.detalle ?? '').trim().slice(0, 255) || null,
            }))
            .filter((a) => a.hora && a.actividad);

        if (!actividades.length) {
            return res.status(502).json({ message: 'La IA no devolvió actividades válidas. Intenta de nuevo.' });
        }

        const [resultado] = await consulta(
            `INSERT INTO rutinas (id_mascota, nombre, objetivo, descripcion, fundamento, generada_ia, activa)
             VALUES (?, ?, ?, ?, ?, 1, 0)`,
            [
                mascota.id_mascota,
                String(rutina.nombre).slice(0, 100),
                OBJETIVOS[objetivo].slice(0, 100),
                String(rutina.descripcion ?? ''),
                String(rutina.fundamento ?? ''),
            ]
        );

        const idRutina = resultado.insertId;

        for (const a of actividades) {
            await consulta('INSERT INTO rutina_actividades SET ?', [{ ...a, id_rutina: idRutina, id_mascota: mascota.id_mascota }]);
        }

        // Queda activa si la mascota no tenía otra rutina activa
        await dejarUnaActiva(idRutina, false, mascota.id_mascota);

        res.status(201).json({
            id: idRutina,
            message: `Se creó la rutina "${rutina.nombre}" con ${actividades.length} actividades.`,
        });
    } catch (error) {
        console.error('Error al generar la rutina con IA:', error.message);
        res.status(502).json({ message: error.message || 'No se pudo generar la rutina.' });
    }
}


/* ==================================
   CONTROLADORES
   GET    /entrenamiento/:idMascota
   POST   /entrenamiento/:idMascota/:recurso
   PUT    /entrenamiento/:idMascota/:recurso/:id
   DELETE /entrenamiento/:idMascota/:recurso/:id
================================== */

const entrenamiento = crearApartado({
    nombre: 'entrenamiento y comportamiento',
    recursos,
    alCargar: async (mascota, respuesta) => {
        respuesta.iaConfigurada = iaConfigurada();

        respuesta.objetivos = OBJETIVOS;

        // Guías básicas de su especie y las generales
        const [guias] = await consulta(
            `SELECT id_consejo, id_especie, categoria, titulo, contenido, nivel FROM consejos_guias
             WHERE categoria IN ('entrenamiento', 'comportamiento') AND (id_especie = ? OR id_especie IS NULL)
             ORDER BY categoria, FIELD(nivel, 'basico', 'intermedio', 'avanzado'), titulo`,
            [mascota.id_especie]
        );
        respuesta.guias = guias;
    },
    despuesDeGuardar,
    despuesDeEliminar,
});

export const fichaEntrenamiento = entrenamiento.ficha;
export const crearRegistro = entrenamiento.crear;
export const editarRegistro = entrenamiento.editar;
export const eliminarRegistro = entrenamiento.eliminar;
