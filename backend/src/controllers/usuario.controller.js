import { consulta, entero } from '../utils/apartado.js';
import { errorFoto, guardarFoto } from '../utils/fotos.js';
import { correoConfigurado, enviarCorreo } from '../utils/correo.js';
import { contrasenaSegura, crearHash, usuarioPublico, verificarHash } from './auth.controller.js';


const TEMAS = ['claro', 'oscuro', 'sistema'];


/* ==================================
   AYUDAS
================================== */

function texto(valor, maximo) {
    return String(valor ?? '').trim().slice(0, maximo);
}

function booleano(valor) {
    return ['1', 'true', 'on', 'si', 'sí'].includes(String(valor ?? '').toLowerCase());
}

async function usuarioCompleto(idUsuario) {
    const [[usuario]] = await consulta('SELECT * FROM usuarios WHERE id_usuario = ?', [idUsuario]);
    return usuario;
}

// Las cuentas creadas con Google no tienen contraseña ("google$sin-contrasena")
function tieneContrasena(usuario) {
    return usuario.contrasena_hash.startsWith('scrypt$');
}

async function configuracionDe(idUsuario) {
    const [[config]] = await consulta(
        `SELECT tema, notif_correo, notif_recordatorios, notif_comidas
         FROM configuracion_usuario WHERE id_usuario = ?`,
        [idUsuario]
    );

    // Si nunca se configuró: todo activado y tema claro
    return {
        tema: config?.tema === 'sistema' || !config ? 'claro' : config.tema,
        notif_correo: config ? Boolean(config.notif_correo) : true,
        notif_recordatorios: config ? Boolean(config.notif_recordatorios) : true,
        notif_comidas: config ? Boolean(config.notif_comidas) : true,
    };
}


/* ==================================
   PERFIL
================================== */

// GET /usuario/perfil
export async function verPerfil(req, res) {
    try {
        const idUsuario = req.usuario.id_usuario;
        const usuario = await usuarioCompleto(idUsuario);

        const [mascotas] = await consulta(
            `SELECT m.id_mascota, m.nombre, m.foto, e.nombre AS especie, r.nombre AS raza
             FROM mascotas m JOIN especies e ON e.id_especie = m.id_especie
             LEFT JOIN razas r ON r.id_raza = m.id_raza
             WHERE m.id_usuario = ? AND m.activo = 1 ORDER BY m.nombre`,
            [idUsuario]
        );

        const [[resumen]] = await consulta(
            `SELECT
                (SELECT COUNT(*) FROM recordatorios WHERE id_usuario = ? AND completado = 0) AS recordatorios,
                (SELECT COALESCE(SUM(g.monto), 0) FROM gastos g JOIN mascotas m ON m.id_mascota = g.id_mascota
                 WHERE m.id_usuario = ? AND m.activo = 1
                   AND YEAR(g.fecha) = YEAR(CURDATE()) AND MONTH(g.fecha) = MONTH(CURDATE())) AS gastos_mes,
                (SELECT COUNT(*) FROM citas_veterinarias c JOIN mascotas m ON m.id_mascota = c.id_mascota
                 WHERE m.id_usuario = ? AND m.activo = 1 AND c.estado = 'programada' AND c.fecha_hora >= NOW()) AS citas`,
            [idUsuario, idUsuario, idUsuario]
        );

        res.json({
            usuario: {
                ...usuarioPublico(usuario),
                fecha_registro: usuario.fecha_registro,
                ultimo_acceso: usuario.ultimo_acceso,
                tiene_contrasena: tieneContrasena(usuario),
                con_google: usuario.contrasena_hash.startsWith('google$'),
                tema: (await configuracionDe(idUsuario)).tema,
            },
            mascotas,
            resumen: { ...resumen, gastos_mes: Number(resumen.gastos_mes) },
        });
    } catch (error) {
        console.error('Error al cargar el perfil:', error.message);
        res.status(500).json({ message: 'No se pudo cargar tu perfil.' });
    }
}


// PUT /usuario/perfil (foto_perfil opcional; quitar_foto=1 la borra)
// Para cambiar el correo se pide la contraseña actual
export async function editarPerfil(req, res) {
    try {
        const idUsuario = req.usuario.id_usuario;
        const usuario = await usuarioCompleto(idUsuario);

        const datos = {
            nombres: texto(req.body.nombres, 80),
            apellidos: texto(req.body.apellidos, 80),
            correo: texto(req.body.correo, 120).toLowerCase(),
            telefono: texto(req.body.telefono, 20) || null,
            direccion: texto(req.body.direccion, 150) || null,
            ciudad: texto(req.body.ciudad, 80) || null,
        };

        if (!datos.nombres || !datos.apellidos || !datos.correo) {
            return res.status(400).json({ message: 'Nombres, apellidos y correo son obligatorios.' });
        }

        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(datos.correo)) {
            return res.status(400).json({ message: 'El correo no es válido.' });
        }

        if (datos.telefono && !/^[0-9+()\s-]{7,20}$/.test(datos.telefono)) {
            return res.status(400).json({ message: 'El teléfono solo puede tener números, espacios, +, ( ) y -.' });
        }

        if (datos.correo !== usuario.correo) {
            if (tieneContrasena(usuario)
                && !(await verificarHash(String(req.body.contrasena_actual ?? ''), usuario.contrasena_hash))) {
                return res.status(400).json({ message: 'Para cambiar el correo escribe tu contraseña actual.' });
            }

            const [otros] = await consulta(
                'SELECT 1 FROM usuarios WHERE correo = ? AND id_usuario <> ? LIMIT 1',
                [datos.correo, idUsuario]
            );

            if (otros.length) {
                return res.status(409).json({ message: 'Ya existe otra cuenta con ese correo.' });
            }
        }

        const foto = req.files?.foto_perfil;

        if (foto) {
            const error = errorFoto(foto);
            if (error) {
                return res.status(400).json({ message: error });
            }
            datos.foto_perfil = await guardarFoto(foto, 'perfiles');
        } else if (booleano(req.body.quitar_foto)) {
            datos.foto_perfil = null;
        }

        await consulta('UPDATE usuarios SET ? WHERE id_usuario = ?', [datos, idUsuario]);

        const actualizado = await usuarioCompleto(idUsuario);

        res.json({
            message: 'Tu perfil se actualizó.',
            usuario: { ...usuarioPublico(actualizado), tema: (await configuracionDe(idUsuario)).tema },
        });
    } catch (error) {
        console.error('Error al editar el perfil:', error.message);
        res.status(500).json({ message: 'No se pudo guardar tu perfil.' });
    }
}


// PUT /usuario/contrasena { actual, nueva, confirmar }
// Las cuentas de Google pueden crear una contraseña sin escribir la actual
export async function cambiarContrasena(req, res) {
    try {
        const usuario = await usuarioCompleto(req.usuario.id_usuario);
        const nueva = String(req.body.nueva ?? '');

        if (tieneContrasena(usuario) && !(await verificarHash(String(req.body.actual ?? ''), usuario.contrasena_hash))) {
            return res.status(400).json({ message: 'La contraseña actual no es correcta.' });
        }

        if (!contrasenaSegura(nueva)) {
            return res.status(400).json({
                message: 'La nueva contraseña debe tener 8 caracteres, una mayúscula, un número y un carácter especial.',
            });
        }

        if (nueva !== String(req.body.confirmar ?? '')) {
            return res.status(400).json({ message: 'Las contraseñas nuevas no coinciden.' });
        }

        await consulta('UPDATE usuarios SET contrasena_hash = ? WHERE id_usuario = ?', [await crearHash(nueva), usuario.id_usuario]);

        // Por seguridad se cierran las demás sesiones
        await consulta(
            'UPDATE sesiones SET fecha_cierre = NOW() WHERE id_usuario = ? AND token_sesion <> ? AND fecha_cierre IS NULL',
            [usuario.id_usuario, req.token]
        );

        res.json({ message: 'Contraseña actualizada. Se cerraron tus sesiones en otros dispositivos.' });
    } catch (error) {
        console.error('Error al cambiar la contraseña:', error.message);
        res.status(500).json({ message: 'No se pudo cambiar la contraseña.' });
    }
}


/* ==================================
   CONFIGURACIÓN
================================== */

// GET /usuario/configuracion
export async function verConfiguracion(req, res) {
    try {
        const idUsuario = req.usuario.id_usuario;

        const [sesiones] = await consulta(
            `SELECT id_sesion, ip, dispositivo, fecha_inicio, token_sesion = ? AS actual
             FROM sesiones WHERE id_usuario = ? AND fecha_cierre IS NULL
             ORDER BY actual DESC, fecha_inicio DESC LIMIT 20`,
            [req.token, idUsuario]
        );

        const [eliminadas] = await consulta(
            `SELECT m.id_mascota, m.nombre, m.foto, e.nombre AS especie
             FROM mascotas m JOIN especies e ON e.id_especie = m.id_especie
             WHERE m.id_usuario = ? AND m.activo = 0 ORDER BY m.nombre`,
            [idUsuario]
        );

        const usuario = await usuarioCompleto(idUsuario);

        res.json({
            configuracion: await configuracionDe(idUsuario),
            correo: usuario.correo,
            tiene_contrasena: tieneContrasena(usuario),
            correoConfigurado: correoConfigurado(),
            sesiones: sesiones.map((s) => ({ ...s, actual: Boolean(s.actual) })),
            eliminadas,
        });
    } catch (error) {
        console.error('Error al cargar la configuración:', error.message);
        res.status(500).json({ message: 'No se pudo cargar la configuración.' });
    }
}


// PUT /usuario/configuracion { tema, notif_correo, notif_recordatorios, notif_comidas }
export async function guardarConfiguracion(req, res) {
    try {
        const tema = String(req.body.tema ?? 'claro');

        if (!TEMAS.includes(tema)) {
            return res.status(400).json({ message: 'El tema no es válido.' });
        }

        const valores = {
            tema,
            notif_correo: booleano(req.body.notif_correo) ? 1 : 0,
            notif_recordatorios: booleano(req.body.notif_recordatorios) ? 1 : 0,
            notif_comidas: booleano(req.body.notif_comidas) ? 1 : 0,
        };

        await consulta(
            `INSERT INTO configuracion_usuario SET ?
             ON DUPLICATE KEY UPDATE tema = VALUES(tema), notif_correo = VALUES(notif_correo),
                 notif_recordatorios = VALUES(notif_recordatorios), notif_comidas = VALUES(notif_comidas)`,
            [{ ...valores, id_usuario: req.usuario.id_usuario }]
        );

        res.json({ message: 'Configuración guardada.', configuracion: await configuracionDe(req.usuario.id_usuario) });
    } catch (error) {
        console.error('Error al guardar la configuración:', error.message);
        res.status(500).json({ message: 'No se pudo guardar la configuración.' });
    }
}


// POST /usuario/correo-prueba: para comprobar que los avisos llegan
export async function correoDePrueba(req, res) {
    try {
        if (!correoConfigurado()) {
            return res.status(501).json({ message: 'El correo del servidor todavía no está configurado (SMTP en backend/.env).' });
        }

        const { correo, nombres } = req.usuario;

        const enviado = await enviarCorreo({
            para: correo,
            asunto: 'PetCare: correo de prueba',
            texto: `Hola ${nombres}, este es un correo de prueba de PetCare. Si lo recibes, los recordatorios también te llegarán aquí.`,
            html: `<p>Hola ${nombres.replace(/[<>&"]/g, '')},</p>
                   <p>Este es un <strong>correo de prueba</strong> de PetCare. Si lo recibes, los recordatorios de vacunas,
                   citas, medicamentos y comidas también te llegarán aquí. 🐾</p>
                   <p style="color:#777">Si no lo ves en la bandeja de entrada, revisa la carpeta de spam.</p>`,
        });

        if (!enviado) {
            return res.status(502).json({ message: 'No se pudo enviar el correo. Revisa la configuración SMTP del servidor.' });
        }

        res.json({ message: `Enviamos un correo de prueba a ${correo}. Si no aparece, revisa la carpeta de spam.` });
    } catch (error) {
        console.error('Error al enviar correo de prueba:', error.message);
        res.status(500).json({ message: 'No se pudo enviar el correo de prueba.' });
    }
}


/* ==================================
   SESIONES, MASCOTAS ELIMINADAS Y CUENTA
================================== */

// DELETE /usuario/sesiones/:id (cierra una) o DELETE /usuario/sesiones (todas menos la actual)
export async function cerrarSesiones(req, res) {
    try {
        const id = req.params.id ? entero(req.params.id) : null;

        const [resultado] = await consulta(
            `UPDATE sesiones SET fecha_cierre = NOW()
             WHERE id_usuario = ? AND token_sesion <> ? AND fecha_cierre IS NULL ${id ? 'AND id_sesion = ?' : ''}`,
            id ? [req.usuario.id_usuario, req.token, id] : [req.usuario.id_usuario, req.token]
        );

        res.json({
            message: resultado.affectedRows
                ? `Se ${resultado.affectedRows === 1 ? 'cerró 1 sesión' : `cerraron ${resultado.affectedRows} sesiones`}.`
                : 'No había otras sesiones abiertas.',
        });
    } catch (error) {
        console.error('Error al cerrar sesiones:', error.message);
        res.status(500).json({ message: 'No se pudieron cerrar las sesiones.' });
    }
}


// PUT /usuario/mascotas/:id/restaurar: vuelve a mostrar una mascota eliminada con toda su información
export async function restaurarMascota(req, res) {
    try {
        const [resultado] = await consulta(
            'UPDATE mascotas SET activo = 1 WHERE id_mascota = ? AND id_usuario = ? AND activo = 0',
            [entero(req.params.id), req.usuario.id_usuario]
        );

        if (!resultado.affectedRows) {
            return res.status(404).json({ message: 'No se encontró la mascota.' });
        }

        res.json({ message: 'La mascota volvió a tu lista con todo su historial.' });
    } catch (error) {
        console.error('Error al restaurar mascota:', error.message);
        res.status(500).json({ message: 'No se pudo recuperar la mascota.' });
    }
}


// POST /usuario/desactivar { contrasena }: desactiva la cuenta y cierra todas las sesiones
export async function desactivarCuenta(req, res) {
    try {
        const usuario = await usuarioCompleto(req.usuario.id_usuario);

        if (tieneContrasena(usuario)) {
            if (!(await verificarHash(String(req.body.contrasena ?? ''), usuario.contrasena_hash))) {
                return res.status(400).json({ message: 'La contraseña no es correcta.' });
            }
        } else if (String(req.body.confirmacion ?? '').trim().toUpperCase() !== 'DESACTIVAR') {
            return res.status(400).json({ message: 'Escribe DESACTIVAR para confirmar.' });
        }

        await consulta('UPDATE usuarios SET activo = 0 WHERE id_usuario = ?', [usuario.id_usuario]);
        await consulta('UPDATE sesiones SET fecha_cierre = NOW() WHERE id_usuario = ? AND fecha_cierre IS NULL', [usuario.id_usuario]);

        res.json({ message: 'Tu cuenta fue desactivada.' });
    } catch (error) {
        console.error('Error al desactivar la cuenta:', error.message);
        res.status(500).json({ message: 'No se pudo desactivar la cuenta.' });
    }
}
