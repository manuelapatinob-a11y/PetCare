// =====================================================
// Notificaciones de PetCare: campanita en la página y correo.
//
// - Recordatorios de próximas vacunas, desparasitaciones, citas,
//   medicamentos en curso, la agenda (paseos, revisiones) y las
//   comidas y snacks del horario de alimentación.
// - Cada aviso se crea una sola vez (clave_evento única por usuario).
// - Los correos se agrupan: un solo correo con todos los avisos nuevos,
//   entre las 7 a. m. y las 9 p. m. Si no salen, se reintentan.
// =====================================================

import { avanzarRepetidos } from '../utils/repeticion.js';
import { consulta } from '../utils/apartado.js';
import { enviarCorreo } from '../utils/correo.js';
import { revisarTodasLasExistencias } from './existencias.js';

// Días de anticipación para vacunas, desparasitaciones y citas
const DIAS_ANTES = 3;

// Horario en que se envían correos
const HORA_DESDE = 7;
const HORA_HASTA = 21;


function escapar(texto) {
    return String(texto ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

function fechaLarga(texto) {
    const [anio, mes, dia] = texto.slice(0, 10).split('-').map(Number);
    return new Date(anio, mes - 1, dia).toLocaleDateString('es-CO', { weekday: 'long', day: 'numeric', month: 'long' });
}

function hora(texto) {
    return new Date(texto.replace(' ', 'T')).toLocaleTimeString('es-CO', { hour: 'numeric', minute: '2-digit' });
}

// "hoy", "mañana" o "en 3 días"
function cuando(dias) {
    return dias === 0 ? 'hoy' : dias === 1 ? 'mañana' : `en ${dias} días`;
}


/* ==================================
   CREAR UNA NOTIFICACIÓN
================================== */

// Devuelve true si se creó (false si ya existía ese aviso)
export async function crearNotificacion({ idUsuario, categoria, titulo, mensaje, enlace = null, clave = null }) {
    const [resultado] = await consulta(
        `INSERT IGNORE INTO notificaciones (id_usuario, tipo, categoria, titulo, mensaje, enlace, clave_evento)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
            idUsuario,
            categoria === 'alimento' ? 'sistema' : 'recordatorio',
            categoria,
            String(titulo).slice(0, 150),
            String(mensaje).slice(0, 255),
            enlace,
            clave,
        ]
    );
    return resultado.affectedRows > 0;
}


/* ==================================
   RECORDATORIOS
================================== */

// Usuarios que quieren recordatorios (si no configuraron nada, sí quieren)
function filtroUsuarios(idUsuario) {
    return {
        sql: `u.activo = 1 AND COALESCE(cu.notif_recordatorios, 1) = 1 ${idUsuario ? 'AND u.id_usuario = ?' : ''}`,
        valores: idUsuario ? [idUsuario] : [],
    };
}

const UNIR_USUARIO = `
    JOIN mascotas m ON m.id_mascota = x.id_mascota AND m.activo = 1
    JOIN usuarios u ON u.id_usuario = m.id_usuario
    LEFT JOIN configuracion_usuario cu ON cu.id_usuario = u.id_usuario`;


// Crea los recordatorios que correspondan hoy (de un usuario o de todos)
export async function generarRecordatorios(idUsuario = null) {

    const filtro = filtroUsuarios(idUsuario);
    let creadas = 0;

    // Los recordatorios que se repiten y ya pasaron quedan para la próxima vez
    await avanzarRepetidos(idUsuario);

    // ---- Vacunas próximas ----
    const [vacunas] = await consulta(
        `SELECT x.id_vacuna AS id, DATE_FORMAT(x.proxima_dosis, '%Y-%m-%d') AS fecha,
                DATEDIFF(x.proxima_dosis, CURDATE()) AS dias,
                COALESCE(tv.nombre, x.nombre_vacuna, 'Vacuna') AS nombre,
                m.id_mascota, m.nombre AS mascota, u.id_usuario
         FROM vacunas x
         LEFT JOIN tipos_vacuna tv ON tv.id_tipo_vacuna = x.id_tipo_vacuna
         ${UNIR_USUARIO}
         WHERE x.proxima_dosis BETWEEN CURDATE() AND CURDATE() + INTERVAL ${DIAS_ANTES} DAY AND ${filtro.sql}`,
        filtro.valores
    );

    for (const v of vacunas) {
        creadas += await crearNotificacion({
            idUsuario: v.id_usuario,
            categoria: 'vacuna',
            titulo: `Vacuna de ${v.mascota} ${cuando(v.dias)}`,
            mensaje: `${v.nombre} · ${fechaLarga(v.fecha)}`,
            enlace: `salud/salud.html?mascota=${v.id_mascota}`,
            clave: `vacuna:${v.id}:${v.fecha}:${v.dias === 0 ? 'hoy' : 'pronto'}`,
        });
    }

    // ---- Desparasitaciones próximas ----
    const [desparasitaciones] = await consulta(
        `SELECT x.id_desparasitacion AS id, x.tipo, x.producto,
                DATE_FORMAT(x.proxima_aplicacion, '%Y-%m-%d') AS fecha,
                DATEDIFF(x.proxima_aplicacion, CURDATE()) AS dias,
                m.id_mascota, m.nombre AS mascota, u.id_usuario
         FROM desparasitaciones x
         ${UNIR_USUARIO}
         WHERE x.proxima_aplicacion BETWEEN CURDATE() AND CURDATE() + INTERVAL ${DIAS_ANTES} DAY AND ${filtro.sql}`,
        filtro.valores
    );

    for (const d of desparasitaciones) {
        creadas += await crearNotificacion({
            idUsuario: d.id_usuario,
            categoria: 'desparasitacion',
            titulo: `Desparasitación de ${d.mascota} ${cuando(d.dias)}`,
            mensaje: `${d.tipo === 'interna' ? 'Interna' : 'Externa'}: ${d.producto} · ${fechaLarga(d.fecha)}`,
            enlace: `salud/salud.html?mascota=${d.id_mascota}`,
            clave: `desparasitacion:${d.id}:${d.fecha}:${d.dias === 0 ? 'hoy' : 'pronto'}`,
        });
    }

    // ---- Citas veterinarias (el día anterior y el mismo día) ----
    const [citas] = await consulta(
        `SELECT x.id_cita AS id, DATE_FORMAT(x.fecha_hora, '%Y-%m-%d %H:%i:%s') AS fecha_hora,
                DATEDIFF(x.fecha_hora, CURDATE()) AS dias, x.motivo, x.clinica,
                m.id_mascota, m.nombre AS mascota, u.id_usuario
         FROM citas_veterinarias x
         ${UNIR_USUARIO}
         WHERE x.estado = 'programada' AND x.fecha_hora >= NOW()
           AND DATE(x.fecha_hora) <= CURDATE() + INTERVAL 1 DAY AND ${filtro.sql}`,
        filtro.valores
    );

    for (const c of citas) {
        creadas += await crearNotificacion({
            idUsuario: c.id_usuario,
            categoria: 'cita',
            titulo: `Cita de ${c.mascota} ${cuando(c.dias)} a las ${hora(c.fecha_hora)}`,
            mensaje: [c.motivo, c.clinica].filter(Boolean).join(' · '),
            enlace: `salud/salud.html?mascota=${c.id_mascota}`,
            clave: `cita:${c.id}:${c.fecha_hora.slice(0, 10)}:${c.dias === 0 ? 'hoy' : 'pronto'}`,
        });
    }

    // ---- Medicamentos en curso (un aviso cada día, desde las 7 a. m.) ----
    if (new Date().getHours() >= HORA_DESDE) {
        const [medicamentos] = await consulta(
            `SELECT x.id_medicamento AS id, x.nombre, x.dosis, x.frecuencia, x.via,
                    DATE_FORMAT(x.fecha_fin, '%Y-%m-%d') AS fecha_fin,
                    DATE_FORMAT(CURDATE(), '%Y-%m-%d') AS hoy,
                    m.id_mascota, m.nombre AS mascota, u.id_usuario
             FROM medicamentos x
             ${UNIR_USUARIO}
             WHERE x.fecha_inicio <= CURDATE() AND (x.fecha_fin IS NULL OR x.fecha_fin >= CURDATE())
               AND ${filtro.sql}`,
            filtro.valores
        );

        for (const md of medicamentos) {
            creadas += await crearNotificacion({
                idUsuario: md.id_usuario,
                categoria: 'medicamento',
                titulo: `Medicamento de ${md.mascota} hoy`,
                mensaje: `${md.nombre}: ${md.dosis}, ${md.frecuencia}${md.via ? ` (${md.via})` : ''}`
                    + (md.fecha_fin === md.hoy ? ' · Hoy es el último día' : ''),
                enlace: `salud/salud.html?mascota=${md.id_mascota}`,
                clave: `medicamento:${md.id}:${md.hoy}`,
            });
        }
    }

    // ---- Agenda: paseos, revisiones y otros recordatorios de las próximas 24 horas ----
    const [recordatorios] = await consulta(
        `SELECT x.id_recordatorio AS id, x.tipo, x.titulo, x.descripcion,
                DATE_FORMAT(x.fecha_hora, '%Y-%m-%d %H:%i:%s') AS fecha_hora,
                DATEDIFF(x.fecha_hora, CURDATE()) AS dias,
                u.id_usuario, x.id_mascota
         FROM recordatorios x
         JOIN usuarios u ON u.id_usuario = x.id_usuario
         LEFT JOIN configuracion_usuario cu ON cu.id_usuario = u.id_usuario
         LEFT JOIN mascotas m ON m.id_mascota = x.id_mascota
         WHERE x.completado = 0 AND x.fecha_hora BETWEEN NOW() AND NOW() + INTERVAL 1 DAY
           AND (m.id_mascota IS NULL OR m.activo = 1) AND ${filtro.sql}`,
        filtro.valores
    );

    for (const r of recordatorios) {
        const pagina = { paseo: 'actividadfisica/actividadfisica.html', cita: 'salud/salud.html' }[r.tipo] || 'recordatorios/recordatorios.html';

        creadas += await crearNotificacion({
            idUsuario: r.id_usuario,
            categoria: 'recordatorio',
            titulo: `${r.titulo} · ${cuando(r.dias)} a las ${hora(r.fecha_hora)}`,
            mensaje: r.descripcion || 'Recordatorio de tu agenda',
            enlace: `${pagina}${r.id_mascota ? `?mascota=${r.id_mascota}` : ''}`,
            clave: `recordatorio:${r.id}:${r.fecha_hora}`,
        });
    }

    return creadas;
}


/* ==================================
   COMIDAS Y SNACKS (cada 5 minutos)
================================== */

// Minutos de anticipación para avisar la próxima comida o snack
const MINUTOS_ANTES_COMIDA = 30;

// Avisa las comidas y snacks del horario que vienen en la próxima media hora
// (si ya se registró esa comida hoy, no avisa)
export async function generarRecordatoriosComida(idUsuario = null) {

    const [horarios] = await consulta(
        `SELECT x.id_horario AS id, x.tipo, x.descripcion, x.porcion_g,
                TIME_FORMAT(x.hora, '%H:%i') AS hora, DATE_FORMAT(CURDATE(), '%Y-%m-%d') AS hoy,
                a.nombre AS alimento, a.marca,
                m.id_mascota, m.nombre AS mascota, u.id_usuario
         FROM horarios_comida x
         LEFT JOIN alimentos a ON a.id_alimento = x.id_alimento
         JOIN mascotas m ON m.id_mascota = x.id_mascota AND m.activo = 1
         JOIN usuarios u ON u.id_usuario = m.id_usuario AND u.activo = 1
         LEFT JOIN configuracion_usuario cu ON cu.id_usuario = u.id_usuario
         WHERE x.hora BETWEEN CURTIME() AND ADDTIME(CURTIME(), SEC_TO_TIME(? * 60))
           AND COALESCE(cu.notif_recordatorios, 1) = 1
           AND COALESCE(cu.notif_comidas, 1) = 1
           AND NOT EXISTS (
               SELECT 1 FROM registros_alimentacion ra
               WHERE ra.id_horario = x.id_horario AND DATE(ra.fecha_hora) = CURDATE()
           )
           ${idUsuario ? 'AND u.id_usuario = ?' : ''}`,
        idUsuario ? [MINUTOS_ANTES_COMIDA, idUsuario] : [MINUTOS_ANTES_COMIDA]
    );

    let creadas = 0;

    for (const h of horarios) {
        const alimento = [h.alimento, h.marca].filter(Boolean).join(' - ');
        const horaTexto = hora(`${h.hoy}T${h.hora}:00`);
        const esSnack = h.tipo === 'snack';

        creadas += await crearNotificacion({
            idUsuario: h.id_usuario,
            categoria: esSnack ? 'snack' : 'comida',
            titulo: `${esSnack ? 'Snack' : 'Comida'} de ${h.mascota} a las ${horaTexto}${h.descripcion ? ` (${h.descripcion})` : ''}`,
            mensaje: `Servir ${Number(h.porcion_g).toLocaleString('es-CO')} g${alimento ? ` de ${alimento}` : ''}. Cuando le des la comida, regístrala en Alimentación.`,
            enlace: `alimentacion/Alimentacion.html?mascota=${h.id_mascota}`,
            clave: `comida:${h.id}:${h.hoy}`,
        });
    }

    return creadas;
}


/* ==================================
   CORREO CON LOS AVISOS NUEVOS
================================== */

const ICONOS = {
    vacuna: '💉', desparasitacion: '🐛', cita: '🩺', medicamento: '💊', recordatorio: '⏰', alimento: '🍽️',
    comida: '🥣', snack: '🦴',
};

// Envía un correo por usuario con sus avisos pendientes (de un usuario o de todos)
export async function enviarCorreosPendientes(idUsuario = null) {

    const ahora = new Date().getHours();

    if (ahora < HORA_DESDE || ahora >= HORA_HASTA) {
        return 0;
    }

    // Avisos de los últimos 3 días sin enviar, de usuarios que quieren correos
    const [pendientes] = await consulta(
        `SELECT n.id_notificacion, n.categoria, n.titulo, n.mensaje,
                u.id_usuario, u.correo, u.nombres
         FROM notificaciones n
         JOIN usuarios u ON u.id_usuario = n.id_usuario AND u.activo = 1
         LEFT JOIN configuracion_usuario cu ON cu.id_usuario = u.id_usuario
         WHERE n.correo_enviado IS NULL AND n.categoria IS NOT NULL
           AND n.fecha_envio >= NOW() - INTERVAL 3 DAY
           AND COALESCE(cu.notif_correo, 1) = 1
           ${idUsuario ? 'AND u.id_usuario = ?' : ''}
         ORDER BY u.id_usuario, n.fecha_envio`,
        idUsuario ? [idUsuario] : []
    );

    // Agrupar por usuario
    const porUsuario = new Map();

    for (const p of pendientes) {
        if (!porUsuario.has(p.id_usuario)) {
            porUsuario.set(p.id_usuario, { correo: p.correo, nombres: p.nombres, avisos: [] });
        }
        porUsuario.get(p.id_usuario).avisos.push(p);
    }

    let enviados = 0;

    for (const usuario of porUsuario.values()) {
        const { avisos } = usuario;
        const asunto = avisos.length === 1
            ? `🐾 ${avisos[0].titulo}`
            : `🐾 Tienes ${avisos.length} recordatorios de PetCare`;

        const ok = await enviarCorreo({
            para: usuario.correo,
            asunto,
            texto: `Hola, ${usuario.nombres}.\n\n${avisos.map((a) => `- ${a.titulo}: ${a.mensaje}`).join('\n')}\n\nPetCare`,
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 560px; color: #1f1a3d;">
                    <h2 style="color: #7046e8;">🐾 Recordatorios de PetCare</h2>
                    <p>Hola, ${escapar(usuario.nombres)}. Esto es lo que viene para tus mascotas:</p>
                    ${avisos.map((a) => `
                        <div style="margin: 10px 0; padding: 12px 14px; border-radius: 12px; background: #f7f5fe;">
                            <strong>${ICONOS[a.categoria] || '🔔'} ${escapar(a.titulo)}</strong><br>
                            <span style="color: #4a4760;">${escapar(a.mensaje)}</span>
                        </div>
                    `).join('')}
                    <p style="color: #8a879c; font-size: 12px;">
                        También los ves en la campanita de PetCare. Puedes desactivar estos correos desde la campanita.
                    </p>
                </div>
            `,
        });

        if (ok) {
            await consulta(
                'UPDATE notificaciones SET correo_enviado = NOW() WHERE id_notificacion IN (?)',
                [avisos.map((a) => a.id_notificacion)]
            );
            enviados++;
        }
    }

    return enviados;
}


/* ==================================
   REVISIÓN AUTOMÁTICA
================================== */

// Para un usuario después de que guarda algo (no bloquea la respuesta)
export function actualizarAvisosDe(idUsuario) {
    generarRecordatorios(idUsuario)
        .then(() => generarRecordatoriosComida(idUsuario))
        .then(() => enviarCorreosPendientes(idUsuario))
        .catch((error) => console.error('Error al actualizar avisos:', error.message));
}

async function ciclo() {
    try {
        await revisarTodasLasExistencias();
        await generarRecordatorios();
        await enviarCorreosPendientes();
    } catch (error) {
        console.error('Error en la revisión de notificaciones:', error.message);
    }
}

// Las comidas y snacks tienen hora exacta: se revisan cada 5 minutos
async function cicloComidas() {
    try {
        if (await generarRecordatoriosComida()) {
            await enviarCorreosPendientes();
        }
    } catch (error) {
        console.error('Error en los recordatorios de comida:', error.message);
    }
}

// Al iniciar el servidor y luego cada hora (comidas: cada 5 minutos)
export function iniciarNotificaciones() {
    setTimeout(ciclo, 30 * 1000);
    setInterval(ciclo, 60 * 60 * 1000);
    setInterval(cicloComidas, 5 * 60 * 1000);
}
