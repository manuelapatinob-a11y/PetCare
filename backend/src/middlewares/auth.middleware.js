import { connection } from '../config/mysql/dbmysql.js';

// Verifica el token "Authorization: Bearer <token>" contra la tabla sesiones
// y deja el usuario en req.usuario para los controladores
export async function requiereSesion(req, res, next) {
    try {
        const [tipo, token] = (req.get('authorization') || '').split(' ');

        if (tipo !== 'Bearer' || !token) {
            return res.status(401).json({ message: 'Debes iniciar sesión.' });
        }

        const [filas] = await connection.query(
            `SELECT u.id_usuario, u.nombres, u.apellidos, u.correo
             FROM sesiones s
             JOIN usuarios u ON u.id_usuario = s.id_usuario
             WHERE s.token_sesion = ? AND s.fecha_cierre IS NULL AND u.activo = 1
             LIMIT 1`,
            [token]
        );

        if (!filas[0]) {
            return res.status(401).json({ message: 'Tu sesión expiró. Inicia sesión de nuevo.' });
        }

        req.usuario = filas[0];
        req.token = token;
        next();
    } catch (error) {
        console.error('Error al verificar la sesión:', error.message);
        res.status(500).json({ message: 'No se pudo verificar la sesión.' });
    }
}
