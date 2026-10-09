// =====================================================
// Lo que comparten Actividad física y Entrenamiento y comportamiento
// para pedirle ideas a la IA: los datos de la mascota en texto
// y el controlador que genera y guarda las ideas.
// =====================================================

import { buscarMascota, consulta } from '../utils/apartado.js';
import { SECCIONES, generarIdeas, iaConfigurada } from './ideasIA.js';


// Todo lo que la IA necesita saber de la mascota, en texto
export async function datosParaLaIA(mascota) {

    const [[raza]] = await consulta(
        `SELECT r.tamano FROM mascotas m LEFT JOIN razas r ON r.id_raza = m.id_raza WHERE m.id_mascota = ?`,
        [mascota.id_mascota]
    );
    const [[peso]] = await consulta(
        `SELECT fecha, peso_kg, condicion_corporal, energia FROM control_peso
         WHERE id_mascota = ? ORDER BY fecha DESC, id_peso DESC LIMIT 1`,
        [mascota.id_mascota]
    );
    const [enfermedades] = await consulta(
        "SELECT nombre, estado, cronica FROM enfermedades WHERE id_mascota = ? AND estado <> 'curada'",
        [mascota.id_mascota]
    );
    const [antecedentes] = await consulta(
        `SELECT tipo, descripcion, fecha FROM antecedentes
         WHERE id_mascota = ? AND tipo IN ('alergia', 'reaccion', 'lesion', 'accidente', 'cirugia')
         ORDER BY fecha DESC LIMIT 15`,
        [mascota.id_mascota]
    );
    const [medicamentos] = await consulta(
        `SELECT nombre, dosis, frecuencia FROM medicamentos
         WHERE id_mascota = ? AND (fecha_fin IS NULL OR fecha_fin >= CURDATE())`,
        [mascota.id_mascota]
    );
    const [sintomas] = await consulta(
        `SELECT descripcion, fecha_inicio, evolucion FROM sintomas
         WHERE id_mascota = ? AND fecha_inicio >= CURDATE() - INTERVAL 30 DAY`,
        [mascota.id_mascota]
    );
    const [[meta]] = await consulta(
        'SELECT minutos_dia, paseos_semana FROM metas_actividad WHERE id_mascota = ? ORDER BY fecha_inicio DESC, id_meta DESC LIMIT 1',
        [mascota.id_mascota]
    );
    const [[actividad]] = await consulta(
        `SELECT COALESCE(SUM(duracion_min), 0) / 14 AS minutos_dia, COUNT(*) AS cantidad,
                GROUP_CONCAT(DISTINCT tipo ORDER BY tipo SEPARATOR ', ') AS tipos
         FROM actividades_fisicas WHERE id_mascota = ? AND fecha_hora >= NOW() - INTERVAL 14 DAY`,
        [mascota.id_mascota]
    );
    const [entrenamientos] = await consulta(
        'SELECT comando, nivel_progreso FROM entrenamientos WHERE id_mascota = ? ORDER BY fecha DESC LIMIT 20',
        [mascota.id_mascota]
    );
    const [diario] = await consulta(
        `SELECT fecha_hora, tipo, estado_animo, comportamiento, intensidad, detonante, respuesta FROM diario_comportamiento
         WHERE id_mascota = ? AND fecha_hora >= NOW() - INTERVAL 30 DAY ORDER BY fecha_hora DESC LIMIT 20`,
        [mascota.id_mascota]
    );

    const edad = mascota.fecha_nacimiento
        ? `${Math.floor((Date.now() - new Date(`${mascota.fecha_nacimiento}T00:00:00`)) / (365.25 * 86400000) * 10) / 10} años`
        : 'sin dato';

    const lista = (filas, texto) => (filas.length ? filas.map(texto).join('; ') : 'ninguno registrado');

    return [
        `Nombre: ${mascota.nombre}`,
        `Especie: ${mascota.especie}`,
        `Raza: ${mascota.raza || 'sin raza definida'}${raza?.tamano ? ` (tamaño ${raza.tamano})` : ''}`,
        `Sexo: ${mascota.sexo}${mascota.esterilizado ? ', esterilizado' : ''}`,
        `Edad: ${edad}`,
        `Peso actual: ${mascota.peso_actual ? `${mascota.peso_actual} kg` : 'sin dato'}`,
        `Última medición: ${peso ? `${peso.peso_kg} kg el ${peso.fecha}; condición corporal ${peso.condicion_corporal ?? 'sin dato'} de 9 (5 es ideal); energía ${peso.energia ?? 'sin dato'}` : 'sin mediciones'}`,
        `Enfermedades activas o controladas: ${lista(enfermedades, (e) => `${e.nombre} (${e.estado}${e.cronica ? ', crónica' : ''})`)}`,
        `Alergias, lesiones, accidentes y cirugías: ${lista(antecedentes, (a) => `${a.tipo}: ${a.descripcion}${a.fecha ? ` (${a.fecha})` : ''}`)}`,
        `Medicamentos en curso: ${lista(medicamentos, (m) => `${m.nombre} ${m.dosis}, ${m.frecuencia}`)}`,
        `Síntomas del último mes: ${lista(sintomas, (s) => `${s.descripcion} desde ${s.fecha_inicio} (${s.evolucion})`)}`,
        `Meta de actividad: ${meta ? `${meta.minutos_dia} min al día${meta.paseos_semana ? `, ${meta.paseos_semana} paseos a la semana` : ''}` : 'no definida'}`,
        `Actividad de las últimas 2 semanas: ${actividad.cantidad} actividades, unos ${Math.round(actividad.minutos_dia)} min al día${actividad.tipos ? ` (${actividad.tipos})` : ''}`,
        `Entrenamiento: ${lista(entrenamientos, (e) => `${e.comando} (${e.nivel_progreso.replace('_', ' ')})`)}`,
        `Diario de comportamiento del último mes: ${lista(diario, (d) => [
            `${d.fecha_hora.slice(0, 10)}: ${d.comportamiento}`,
            d.tipo === 'positivo' ? 'conducta buena' : d.tipo === 'a_mejorar' ? 'conducta a mejorar' : null,
            `ánimo ${d.estado_animo}`,
            d.intensidad && `intensidad ${d.intensidad}`,
            d.detonante && `lo provocó: ${d.detonante}`,
            d.respuesta && `el dueño hizo: ${d.respuesta}`,
        ].filter(Boolean).join(', '))}`,
    ].join('\n');
}


// POST /<apartado>/:idMascota/ideas/generar   { seccion }
// Solo acepta las secciones de ese apartado
export function crearGeneradorIdeas(apartado) {

    return async function generarIdeasMascota(req, res) {
        try {
            const seccion = String(req.body.seccion ?? '');

            if (SECCIONES[seccion]?.apartado !== apartado) {
                return res.status(400).json({ message: 'Sección desconocida.' });
            }

            if (!iaConfigurada()) {
                return res.status(501).json({
                    message: 'La IA todavía no está configurada en el servidor (falta GROQ_API_KEY en backend/.env).',
                });
            }

            const mascota = await buscarMascota(req);

            if (!mascota) {
                return res.status(404).json({ message: 'No se encontró la mascota.' });
            }

            // Evita pedir ideas dos veces seguidas por un doble clic
            const [recientes] = await consulta(
                `SELECT 1 FROM recomendaciones
                 WHERE id_mascota = ? AND origen = 'ia' AND seccion = ? AND fecha >= NOW() - INTERVAL 20 SECOND LIMIT 1`,
                [mascota.id_mascota, seccion]
            );

            if (recientes.length) {
                return res.status(429).json({ message: 'Acabas de pedir sugerencias para esta sección. Espera unos segundos.' });
            }

            const ideas = await generarIdeas(seccion, await datosParaLaIA(mascota));

            const categoria = { entrenamiento: 'entrenamiento', comportamiento: 'comportamiento' }[seccion] || 'actividad';

            // Cada idea se guarda en la tabla recomendaciones
            for (const idea of ideas) {
                await consulta(
                    `INSERT INTO recomendaciones (id_mascota, categoria, seccion, titulo, contenido, origen, datos_json)
                     VALUES (?, ?, ?, ?, ?, 'ia', ?)`,
                    [
                        mascota.id_mascota,
                        categoria,
                        seccion,
                        String(idea.titulo).slice(0, 150),
                        String(idea.descripcion),
                        JSON.stringify({
                            duracion: idea.duracion,
                            frecuencia: idea.frecuencia,
                            intensidad: idea.intensidad,
                            precauciones: idea.precauciones,
                            fundamento: idea.fundamento,
                        }),
                    ]
                );
            }

            const palabra = seccion === 'comportamiento' ? 'consejos' : 'ideas';

            res.status(201).json({ message: `Se generaron ${ideas.length} ${palabra}.`, cantidad: ideas.length });
        } catch (error) {
            console.error('Error al generar ideas con IA:', error.message);
            res.status(502).json({ message: error.message || 'No se pudieron generar las sugerencias.' });
        }
    };
}
