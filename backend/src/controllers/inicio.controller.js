import { connection } from '../config/mysql/dbmysql.js';


// GET /inicio: resumen para la página de inicio del usuario
export async function resumenInicio(req, res) {
    try {
        const idUsuario = req.usuario.id_usuario;

        // Mascotas activas (solo lo necesario para mostrarlas en pequeño)
        const [mascotas] = await connection.query(
            `SELECT m.id_mascota, m.nombre, m.sexo, m.foto, e.nombre AS especie,
                    DATE_FORMAT(m.fecha_nacimiento, '%Y-%m-%d') AS fecha_nacimiento
             FROM mascotas m
             JOIN especies e ON e.id_especie = m.id_especie
             WHERE m.id_usuario = ? AND m.activo = 1
             ORDER BY m.nombre`,
            [idUsuario]
        );

        // Citas veterinarias programadas desde hoy
        const [citas] = await connection.query(
            `SELECT c.id_cita, c.fecha_hora, c.motivo, c.tipo, c.veterinario, m.nombre AS mascota
             FROM citas_veterinarias c
             JOIN mascotas m ON m.id_mascota = c.id_mascota
             WHERE m.id_usuario = ? AND m.activo = 1
               AND c.estado = 'programada' AND c.fecha_hora >= CURDATE()
             ORDER BY c.fecha_hora
             LIMIT 10`,
            [idUsuario]
        );

        // Recordatorios sin completar desde hoy
        const [recordatorios] = await connection.query(
            `SELECT r.id_recordatorio, r.tipo, r.titulo, r.descripcion, r.fecha_hora, m.nombre AS mascota
             FROM recordatorios r
             LEFT JOIN mascotas m ON m.id_mascota = r.id_mascota
             WHERE r.id_usuario = ? AND r.completado = 0 AND r.fecha_hora >= CURDATE()
               AND (m.id_mascota IS NULL OR m.activo = 1)
             ORDER BY r.fecha_hora
             LIMIT 10`,
            [idUsuario]
        );

        // Vacunas con próxima dosis en los siguientes 60 días
        const [vacunas] = await connection.query(
            `SELECT v.id_vacuna, tv.nombre AS vacuna, m.nombre AS mascota,
                    DATE_FORMAT(v.proxima_dosis, '%Y-%m-%d') AS proxima_dosis
             FROM vacunas v
             JOIN mascotas m ON m.id_mascota = v.id_mascota
             JOIN tipos_vacuna tv ON tv.id_tipo_vacuna = v.id_tipo_vacuna
             WHERE m.id_usuario = ? AND m.activo = 1
               AND v.proxima_dosis BETWEEN CURDATE() AND CURDATE() + INTERVAL 60 DAY
             ORDER BY v.proxima_dosis
             LIMIT 10`,
            [idUsuario]
        );

        // Consejos generales o de las especies que tiene el usuario
        const [consejos] = await connection.query(
            `SELECT c.id_consejo, c.categoria, c.titulo, c.contenido, e.nombre AS especie
             FROM consejos_guias c
             LEFT JOIN especies e ON e.id_especie = c.id_especie
             WHERE c.id_especie IS NULL
                OR c.id_especie IN (
                    SELECT id_especie FROM mascotas WHERE id_usuario = ? AND activo = 1
                )
             ORDER BY c.id_consejo`,
            [idUsuario]
        );

        // Un consejo distinto cada día
        const hoy = new Date();
        const diaDelAnio = Math.floor((hoy - new Date(hoy.getFullYear(), 0, 0)) / 86400000);
        const consejo = consejos.length ? consejos[diaDelAnio % consejos.length] : null;

        // Desparasitaciones con próxima aplicación en los siguientes 60 días
        const [desparasitaciones] = await connection.query(
            `SELECT d.id_desparasitacion, d.tipo, d.producto, m.nombre AS mascota,
                    DATE_FORMAT(d.proxima_aplicacion, '%Y-%m-%d') AS proxima_aplicacion
             FROM desparasitaciones d
             JOIN mascotas m ON m.id_mascota = d.id_mascota
             WHERE m.id_usuario = ? AND m.activo = 1
               AND d.proxima_aplicacion BETWEEN CURDATE() AND CURDATE() + INTERVAL 60 DAY
             ORDER BY d.proxima_aplicacion
             LIMIT 10`,
            [idUsuario]
        );

        res.json({ mascotas, citas, recordatorios, vacunas, desparasitaciones, consejo });
    } catch (error) {
        console.error('Error al cargar el inicio:', error.message);
        res.status(500).json({ message: 'No se pudo cargar tu inicio.' });
    }
}
