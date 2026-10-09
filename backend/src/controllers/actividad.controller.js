import { consulta, crearApartado } from '../utils/apartado.js';
import { iaConfigurada } from '../servicios/ideasIA.js';
import { crearGeneradorIdeas } from '../servicios/ideasMascota.js';
import { actualizarPesoActual } from '../utils/mascotas.js';
import { actualizarAvisosDe } from '../servicios/notificaciones.js';
import { recursos } from './actividad.recursos.js';


/* ==================================
   PASEOS: actividad y recordatorio automáticos
================================== */

async function despuesDeGuardarPaseo(idPaseo, datos, mascota, usuario) {

    // Un paseo realizado queda registrado como actividad (una sola vez)
    if (datos.estado === 'realizado') {
        const [ya] = await consulta('SELECT id_actividad FROM actividades_fisicas WHERE id_paseo = ? LIMIT 1', [idPaseo]);

        if (!ya.length) {
            await consulta(
                `INSERT INTO actividades_fisicas (id_mascota, id_paseo, tipo, fecha_hora, duracion_min, intensidad, notas)
                 VALUES (?, ?, 'Paseo', ?, ?, 'media', ?)`,
                [mascota.id_mascota, idPaseo, datos.fecha_hora, datos.duracion_min || 30, datos.lugar]
            );
        }
    }

    // Un paseo programado a futuro tiene su recordatorio (aparece en el Inicio)
    await consulta("DELETE FROM recordatorios WHERE id_paseo = ? AND tipo = 'paseo'", [idPaseo]);

    if (datos.estado === 'programado' && new Date(datos.fecha_hora.replace(' ', 'T')) > new Date()) {
        await consulta(
            `INSERT INTO recordatorios (id_usuario, id_mascota, id_paseo, tipo, titulo, descripcion, fecha_hora)
             VALUES (?, ?, ?, 'paseo', ?, ?, ?)`,
            [
                usuario.id_usuario,
                mascota.id_mascota,
                idPaseo,
                `Paseo con ${mascota.nombre}`.slice(0, 150),
                datos.lugar,
                datos.fecha_hora,
            ]
        );
    }
}


async function despuesDeGuardar(clave, id, datos, extras, mascota, usuario) {

    if (clave === 'pesos') {
        await actualizarPesoActual(mascota.id_mascota);
    }

    if (clave === 'paseos') {
        await despuesDeGuardarPaseo(id, datos, mascota, usuario);
        actualizarAvisosDe(usuario.id_usuario);
    }
}


async function despuesDeEliminar(clave, registro, mascota) {

    if (clave === 'pesos') {
        await actualizarPesoActual(mascota.id_mascota);
    }
    // Al borrar un paseo, su recordatorio se borra solo (la base de datos lo hace en cascada)
}


/* ==================================
   IDEAS CON IA (actividades, paseos, peso y meta)
================================== */

// POST /actividad/:idMascota/ideas/generar   { seccion }
export const generarIdeasActividad = crearGeneradorIdeas('actividad');


/* ==================================
   CONTROLADORES
   GET    /actividad/:idMascota
   POST   /actividad/:idMascota/:recurso
   PUT    /actividad/:idMascota/:recurso/:id
   DELETE /actividad/:idMascota/:recurso/:id
================================== */

const actividad = crearApartado({
    nombre: 'actividad física',
    recursos,
    // La página necesita saber si la IA está configurada
    alCargar: (mascota, respuesta) => {
        respuesta.iaConfigurada = iaConfigurada();
    },
    despuesDeGuardar,
    despuesDeEliminar,
});

export const fichaActividad = actividad.ficha;
export const crearRegistro = actividad.crear;
export const editarRegistro = actividad.editar;
export const eliminarRegistro = actividad.eliminar;
