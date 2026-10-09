import { consulta, entero } from '../utils/apartado.js';
import { avanzarRepetidos, siguienteFecha } from '../utils/repeticion.js';
import { actualizarAvisosDe } from '../servicios/notificaciones.js';


const TIPOS = ['vacuna', 'desparasitacion', 'cita', 'comida', 'medicamento', 'paseo', 'entrenamiento', 'otro'];

const REPETICIONES = ['ninguna', 'diaria', 'semanal', 'mensual', 'anual'];


/* ==================================
   LEER EL FORMULARIO
================================== */

async function leerRecordatorio(req) {

    const tipo = String(req.body.tipo ?? '').trim();
    const titulo = String(req.body.titulo ?? '').trim().slice(0, 150);
    const descripcion = String(req.body.descripcion ?? '').trim().slice(0, 255) || null;
    const repeticion = String(req.body.repeticion ?? 'ninguna').trim() || 'ninguna';
    const partes = String(req.body.fecha_hora ?? '').trim().replace(' ', 'T')
        .match(/^(\d{4}-\d{2}-\d{2})T(\d{2}:\d{2})(:\d{2})?$/);

    if (!TIPOS.includes(tipo)) {
        return { error: 'Elige el tipo de recordatorio.' };
    }

    if (!titulo) {
        return { error: 'Escribe qué hay que recordar.' };
    }

    if (!partes || Number.isNaN(new Date(`${partes[1]}T${partes[2]}`).getTime())) {
        return { error: 'La fecha y hora no son válidas.' };
    }

    if (!REPETICIONES.includes(repeticion)) {
        return { error: 'La repetición no es válida.' };
    }

    // La mascota es opcional, pero si viene tiene que ser del usuario
    let idMascota = null;

    if (String(req.body.id_mascota ?? '').trim()) {
        const [filas] = await consulta(
            'SELECT id_mascota FROM mascotas WHERE id_mascota = ? AND id_usuario = ? AND activo = 1',
            [entero(req.body.id_mascota), req.usuario.id_usuario]
        );

        if (!filas[0]) {
            return { error: 'La mascota seleccionada no existe.' };
        }

        idMascota = filas[0].id_mascota;
    }

    return {
        datos: {
            id_mascota: idMascota,
            tipo,
            titulo,
            descripcion,
            fecha_hora: `${partes[1]} ${partes[2]}:00`,
            repeticion,
        },
    };
}


async function buscarRecordatorio(req) {

    const [filas] = await consulta(
        `SELECT id_recordatorio, repeticion, completado, DATE_FORMAT(fecha_hora, '%Y-%m-%d %H:%i:%s') AS fecha_hora
         FROM recordatorios WHERE id_recordatorio = ? AND id_usuario = ?`,
        [entero(req.params.id), req.usuario.id_usuario]
    );

    return filas[0] || null;
}


/* ==================================
   GET /recordatorios
   Los recordatorios del usuario y lo que viene de Salud
   (vacunas, desparasitaciones, citas y medicamentos)
================================== */

export async function listarRecordatorios(req, res) {
    try {
        const idUsuario = req.usuario.id_usuario;

        await avanzarRepetidos(idUsuario);

        const [mascotas] = await consulta(
            `SELECT m.id_mascota, m.nombre, m.foto, e.nombre AS especie
             FROM mascotas m JOIN especies e ON e.id_especie = m.id_especie
             WHERE m.id_usuario = ? AND m.activo = 1 ORDER BY m.nombre`,
            [idUsuario]
        );

        // Pendientes y los completados de los últimos 60 días
        const [recordatorios] = await consulta(
            `SELECT r.id_recordatorio, r.id_mascota, m.nombre AS mascota, r.tipo, r.titulo, r.descripcion,
                    r.fecha_hora, r.repeticion, r.completado, r.generado_ia,
                    (r.id_cita IS NOT NULL OR r.id_paseo IS NOT NULL OR r.id_vacuna IS NOT NULL
                     OR r.id_medicamento IS NOT NULL OR r.id_horario IS NOT NULL) AS automatico
             FROM recordatorios r
             LEFT JOIN mascotas m ON m.id_mascota = r.id_mascota
             WHERE r.id_usuario = ? AND (m.id_mascota IS NULL OR m.activo = 1)
               AND (r.completado = 0 OR r.fecha_hora >= NOW() - INTERVAL 60 DAY)
             ORDER BY r.completado, r.fecha_hora
             LIMIT 500`,
            [idUsuario]
        );

        // Lo que viene de Salud (se edita en Salud)
        const [salud] = await consulta(
            `SELECT 'vacuna' AS tipo, v.id_vacuna AS id, m.id_mascota, m.nombre AS mascota,
                    CONCAT('Vacuna: ', COALESCE(tv.nombre, v.nombre_vacuna, 'Vacuna')) AS titulo,
                    CONCAT(v.proxima_dosis, 'T09:00:00') AS fecha_hora, 'Próxima dosis' AS descripcion
             FROM vacunas v
             JOIN mascotas m ON m.id_mascota = v.id_mascota
             LEFT JOIN tipos_vacuna tv ON tv.id_tipo_vacuna = v.id_tipo_vacuna
             WHERE m.id_usuario = ? AND m.activo = 1
               AND v.proxima_dosis BETWEEN CURDATE() - INTERVAL 30 DAY AND CURDATE() + INTERVAL 120 DAY

             UNION ALL
             SELECT 'desparasitacion', d.id_desparasitacion, m.id_mascota, m.nombre,
                    CONCAT('Desparasitación ', d.tipo, ': ', d.producto),
                    CONCAT(d.proxima_aplicacion, 'T09:00:00'), 'Próxima aplicación'
             FROM desparasitaciones d
             JOIN mascotas m ON m.id_mascota = d.id_mascota
             WHERE m.id_usuario = ? AND m.activo = 1
               AND d.proxima_aplicacion BETWEEN CURDATE() - INTERVAL 30 DAY AND CURDATE() + INTERVAL 120 DAY

             UNION ALL
             SELECT 'cita', c.id_cita, m.id_mascota, m.nombre,
                    CONCAT('Cita: ', c.motivo),
                    DATE_FORMAT(c.fecha_hora, '%Y-%m-%dT%H:%i:%s'), c.clinica
             FROM citas_veterinarias c
             JOIN mascotas m ON m.id_mascota = c.id_mascota
             WHERE m.id_usuario = ? AND m.activo = 1 AND c.estado = 'programada'
               AND c.fecha_hora >= CURDATE() - INTERVAL 7 DAY

             UNION ALL
             SELECT 'medicamento', md.id_medicamento, m.id_mascota, m.nombre,
                    CONCAT('Medicamento: ', md.nombre),
                    CONCAT(GREATEST(md.fecha_inicio, CURDATE()), 'T07:00:00'),
                    CONCAT_WS(' · ', md.dosis, md.frecuencia,
                              IF(md.fecha_fin IS NULL, 'Sin fecha de fin', CONCAT('Hasta el ', DATE_FORMAT(md.fecha_fin, '%d/%m/%Y'))))
             FROM medicamentos md
             JOIN mascotas m ON m.id_mascota = md.id_mascota
             WHERE m.id_usuario = ? AND m.activo = 1
               AND (md.fecha_fin IS NULL OR md.fecha_fin >= CURDATE()) AND md.fecha_inicio <= CURDATE() + INTERVAL 30 DAY

             ORDER BY fecha_hora`,
            [idUsuario, idUsuario, idUsuario, idUsuario]
        );

        res.json({
            mascotas,
            recordatorios: recordatorios.map((r) => ({
                ...r,
                completado: Boolean(r.completado),
                automatico: Boolean(r.automatico),
                generado_ia: Boolean(r.generado_ia),
            })),
            salud,
        });
    } catch (error) {
        console.error('Error al listar recordatorios:', error.message);
        res.status(500).json({ message: 'No se pudieron cargar los recordatorios.' });
    }
}


/* ==================================
   CREAR, EDITAR Y ELIMINAR
================================== */

// POST /recordatorios
export async function crearRecordatorio(req, res) {
    try {
        const { datos, error } = await leerRecordatorio(req);

        if (error) {
            return res.status(400).json({ message: error });
        }

        const [resultado] = await consulta('INSERT INTO recordatorios SET ?', [
            { ...datos, id_usuario: req.usuario.id_usuario },
        ]);

        // Si es para las próximas horas, el aviso sale de una vez
        actualizarAvisosDe(req.usuario.id_usuario);

        res.status(201).json({ id: resultado.insertId, message: 'Recordatorio guardado.' });
    } catch (error) {
        console.error('Error al crear recordatorio:', error.message);
        res.status(500).json({ message: 'No se pudo guardar el recordatorio.' });
    }
}


// PUT /recordatorios/:id
export async function editarRecordatorio(req, res) {
    try {
        if (!(await buscarRecordatorio(req))) {
            return res.status(404).json({ message: 'No se encontró el recordatorio.' });
        }

        const { datos, error } = await leerRecordatorio(req);

        if (error) {
            return res.status(400).json({ message: error });
        }

        await consulta('UPDATE recordatorios SET ? WHERE id_recordatorio = ?', [datos, entero(req.params.id)]);

        actualizarAvisosDe(req.usuario.id_usuario);

        res.json({ message: 'Recordatorio actualizado.' });
    } catch (error) {
        console.error('Error al editar recordatorio:', error.message);
        res.status(500).json({ message: 'No se pudo actualizar el recordatorio.' });
    }
}


// PUT /recordatorios/:id/completar
// Los que se repiten pasan a la siguiente fecha; los demás quedan completados
export async function completarRecordatorio(req, res) {
    try {
        const recordatorio = await buscarRecordatorio(req);

        if (!recordatorio) {
            return res.status(404).json({ message: 'No se encontró el recordatorio.' });
        }

        if (recordatorio.repeticion !== 'ninguna') {
            // La siguiente vez después de la que se acaba de cumplir (o de ahora, si ya pasó)
            const cumplida = new Date(recordatorio.fecha_hora.replace(' ', 'T'));
            const siguiente = siguienteFecha(recordatorio.fecha_hora, recordatorio.repeticion, cumplida > new Date() ? cumplida : new Date());

            await consulta('UPDATE recordatorios SET fecha_hora = ? WHERE id_recordatorio = ?', [siguiente, recordatorio.id_recordatorio]);

            return res.json({ message: 'Hecho. Quedó programado para la próxima vez.', siguiente: siguiente.replace(' ', 'T') });
        }

        await consulta('UPDATE recordatorios SET completado = 1 WHERE id_recordatorio = ?', [recordatorio.id_recordatorio]);

        res.json({ message: 'Recordatorio completado.' });
    } catch (error) {
        console.error('Error al completar recordatorio:', error.message);
        res.status(500).json({ message: 'No se pudo completar el recordatorio.' });
    }
}


// PUT /recordatorios/:id/reabrir
export async function reabrirRecordatorio(req, res) {
    try {
        const recordatorio = await buscarRecordatorio(req);

        if (!recordatorio) {
            return res.status(404).json({ message: 'No se encontró el recordatorio.' });
        }

        await consulta('UPDATE recordatorios SET completado = 0 WHERE id_recordatorio = ?', [recordatorio.id_recordatorio]);

        res.json({ message: 'El recordatorio volvió a quedar pendiente.' });
    } catch (error) {
        console.error('Error al reabrir recordatorio:', error.message);
        res.status(500).json({ message: 'No se pudo actualizar el recordatorio.' });
    }
}


// DELETE /recordatorios/:id
export async function eliminarRecordatorio(req, res) {
    try {
        const [resultado] = await consulta(
            'DELETE FROM recordatorios WHERE id_recordatorio = ? AND id_usuario = ?',
            [entero(req.params.id), req.usuario.id_usuario]
        );

        if (!resultado.affectedRows) {
            return res.status(404).json({ message: 'No se encontró el recordatorio.' });
        }

        res.json({ message: 'Recordatorio eliminado.' });
    } catch (error) {
        console.error('Error al eliminar recordatorio:', error.message);
        res.status(500).json({ message: 'No se pudo eliminar el recordatorio.' });
    }
}
