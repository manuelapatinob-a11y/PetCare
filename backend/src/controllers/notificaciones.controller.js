import { consulta, entero } from '../utils/apartado.js';
import { correoConfigurado } from '../utils/correo.js';


// GET /notificaciones: las más recientes, cuántas faltan por leer y la preferencia de correo
export async function listarNotificaciones(req, res) {
    try {
        const idUsuario = req.usuario.id_usuario;

        const [notificaciones] = await consulta(
            `SELECT id_notificacion, tipo, categoria, titulo, mensaje, enlace, leida, fecha_envio, correo_enviado
             FROM notificaciones
             WHERE id_usuario = ?
             ORDER BY fecha_envio DESC, id_notificacion DESC
             LIMIT 30`,
            [idUsuario]
        );

        const [[conteo]] = await consulta(
            'SELECT COUNT(*) AS n FROM notificaciones WHERE id_usuario = ? AND leida = 0',
            [idUsuario]
        );

        const [[configuracion]] = await consulta(
            'SELECT notif_correo, notif_recordatorios, notif_comidas FROM configuracion_usuario WHERE id_usuario = ?',
            [idUsuario]
        );

        res.json({
            noLeidas: conteo.n,
            notificaciones: notificaciones.map((n) => ({ ...n, leida: Boolean(n.leida) })),
            preferencias: {
                // Si nunca se configuró, todo está activado
                correo: configuracion ? Boolean(configuracion.notif_correo) : true,
                recordatorios: configuracion ? Boolean(configuracion.notif_recordatorios) : true,
                comidas: configuracion ? Boolean(configuracion.notif_comidas) : true,
                correoConfigurado: correoConfigurado(),
            },
        });
    } catch (error) {
        console.error('Error al listar notificaciones:', error.message);
        res.status(500).json({ message: 'No se pudieron cargar las notificaciones.' });
    }
}


// PUT /notificaciones/:id/leida
export async function marcarLeida(req, res) {
    try {
        await consulta(
            'UPDATE notificaciones SET leida = 1 WHERE id_notificacion = ? AND id_usuario = ?',
            [entero(req.params.id), req.usuario.id_usuario]
        );
        res.json({ message: 'Listo.' });
    } catch (error) {
        console.error('Error al marcar notificación:', error.message);
        res.status(500).json({ message: 'No se pudo actualizar la notificación.' });
    }
}


// PUT /notificaciones/leidas: marca todas como leídas
export async function marcarTodasLeidas(req, res) {
    try {
        await consulta('UPDATE notificaciones SET leida = 1 WHERE id_usuario = ? AND leida = 0', [req.usuario.id_usuario]);
        res.json({ message: 'Listo.' });
    } catch (error) {
        console.error('Error al marcar notificaciones:', error.message);
        res.status(500).json({ message: 'No se pudieron actualizar las notificaciones.' });
    }
}


// PUT /notificaciones/preferencias   { correo: 1|0, recordatorios: 1|0, comidas: 1|0 }
export async function guardarPreferencias(req, res) {
    try {
        const valor = (campo) => (['1', 'true', 'on'].includes(String(req.body[campo] ?? '').toLowerCase()) ? 1 : 0);

        await consulta(
            `INSERT INTO configuracion_usuario (id_usuario, notif_correo, notif_recordatorios, notif_comidas)
             VALUES (?, ?, ?, ?)
             ON DUPLICATE KEY UPDATE notif_correo = VALUES(notif_correo),
                 notif_recordatorios = VALUES(notif_recordatorios), notif_comidas = VALUES(notif_comidas)`,
            [req.usuario.id_usuario, valor('correo'), valor('recordatorios'), valor('comidas')]
        );

        res.json({ message: 'Preferencias guardadas.' });
    } catch (error) {
        console.error('Error al guardar preferencias:', error.message);
        res.status(500).json({ message: 'No se pudieron guardar las preferencias.' });
    }
}
