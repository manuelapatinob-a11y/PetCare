import { consulta, crearApartado } from '../utils/apartado.js';
import { actualizarPesoActual } from '../utils/mascotas.js';
import { revisarExistencias } from '../servicios/existencias.js';
import { actualizarAvisosDe } from '../servicios/notificaciones.js';
import { recursos } from './alimentacion.recursos.js';

/* ==================================
   ACCIONES AUTOMÁTICAS
================================== */

async function despuesDeGuardar(clave, id, datos, extras, mascota, usuario) {

    if (clave === 'pesos') {
        await actualizarPesoActual(mascota.id_mascota);
    }

    if (clave === 'planes' && datos.activo) {
        // Solo puede haber un plan de alimentación activo
        await consulta(
            'UPDATE planes_alimenticios SET activo = 0 WHERE id_mascota = ? AND id_plan <> ?',
            [mascota.id_mascota, id]
        );
    }

    // Comer, comprar o cambiar el alimento cambia las existencias
    if (clave === 'comidas' || clave === 'compras') {
        await revisarExistencias(datos.id_alimento, mascota, usuario);
    }

    if (clave === 'alimentos') {
        await revisarExistencias(id, mascota, usuario);
    }

    // Avisos del alimento que se acaba y de la próxima comida
    if (['comidas', 'compras', 'alimentos', 'horarios'].includes(clave)) {
        actualizarAvisosDe(usuario.id_usuario);
    }
}


async function despuesDeEliminar(clave, registro, mascota, usuario) {

    if (clave === 'pesos') {
        await actualizarPesoActual(mascota.id_mascota);
    }

    if (clave === 'comidas' || clave === 'compras') {
        await revisarExistencias(registro.id_alimento, mascota, usuario);
    }
}


/* ==================================
   DATOS EXTRA DE LA FICHA (solo lectura)
================================== */

async function alCargar(mascota, respuesta) {

    // Síntomas registrados en Salud (para relacionarlos con cambios de alimento)
    const [sintomas] = await consulta(
        `SELECT id_sintoma, descripcion, fecha_inicio, evolucion FROM sintomas
         WHERE id_mascota = ? AND fecha_inicio >= CURDATE() - INTERVAL 180 DAY
         ORDER BY fecha_inicio DESC`,
        [mascota.id_mascota]
    );
    respuesta.sintomas = sintomas;
}


/* ==================================
   CONTROLADORES
   GET    /alimentacion/:idMascota
   POST   /alimentacion/:idMascota/:recurso
   PUT    /alimentacion/:idMascota/:recurso/:id
   DELETE /alimentacion/:idMascota/:recurso/:id
================================== */

const alimentacion = crearApartado({
    nombre: 'alimentación',
    recursos,
    alCargar,
    despuesDeGuardar,
    despuesDeEliminar,
});

export const fichaAlimentacion = alimentacion.ficha;
export const crearRegistro = alimentacion.crear;
export const editarRegistro = alimentacion.editar;
export const eliminarRegistro = alimentacion.eliminar;
