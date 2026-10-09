import { consulta, crearApartado } from '../utils/apartado.js';
import { actualizarAvisosDe } from '../servicios/notificaciones.js';
import { recursos } from './salud.recursos.js';


/* ==================================
   ACCIONES AUTOMÁTICAS DESPUÉS DE GUARDAR
================================== */

async function despuesDeGuardar(clave, id, datos, extras, mascota, usuario) {

    // Vacunas, desparasitaciones y medicamentos generan recordatorios
    if (['vacunas', 'desparasitaciones', 'medicamentos'].includes(clave)) {
        actualizarAvisosDe(usuario.id_usuario);
    }

    if (clave !== 'citas') {
        return;
    }

    // El costo de la consulta se guarda como gasto veterinario de la cita
    await consulta('DELETE FROM gastos WHERE id_cita = ? AND id_categoria = 1', [id]);

    if (extras.costo) {
        await consulta(
            `INSERT INTO gastos (id_mascota, id_categoria, id_cita, descripcion, monto, fecha)
             VALUES (?, 1, ?, ?, ?, DATE(?))`,
            [mascota.id_mascota, id, `Consulta: ${datos.motivo}`.slice(0, 200), extras.costo, datos.fecha_hora]
        );
    }

    // La próxima revisión se convierte en un recordatorio
    await consulta(
        "DELETE FROM recordatorios WHERE id_cita = ? AND tipo = 'cita' AND titulo LIKE 'Revisión de %'",
        [id]
    );

    if (datos.proxima_revision) {
        await consulta(
            `INSERT INTO recordatorios (id_usuario, id_mascota, id_cita, tipo, titulo, descripcion, fecha_hora)
             VALUES (?, ?, ?, 'cita', ?, ?, ?)`,
            [
                usuario.id_usuario,
                mascota.id_mascota,
                id,
                `Revisión de ${mascota.nombre}`.slice(0, 150),
                `Seguimiento de: ${datos.motivo}`.slice(0, 255),
                `${datos.proxima_revision} 09:00:00`,
            ]
        );
    }

    // La cita (y su revisión) generan recordatorios
    actualizarAvisosDe(usuario.id_usuario);
}


/* ==================================
   DATOS EXTRA DE LA FICHA
================================== */

async function alCargar(mascota, respuesta) {

    // Historial médico: la unión de toda la información (también gastos y alimentación)
    const [historial] = await consulta(
        'SELECT * FROM v_historial_mascota WHERE id_mascota = ? ORDER BY fecha DESC, tipo',
        [mascota.id_mascota]
    );
    respuesta.historial = historial;

    // Catálogos para los formularios
    const [tiposVacuna] = await consulta(
        'SELECT id_tipo_vacuna, nombre, descripcion, frecuencia_meses FROM tipos_vacuna WHERE id_especie = ? ORDER BY nombre',
        [mascota.id_especie]
    );
    respuesta.catalogos = { tiposVacuna };
}


/* ==================================
   CONTROLADORES
   GET    /salud/:idMascota
   POST   /salud/:idMascota/:recurso
   PUT    /salud/:idMascota/:recurso/:id
   DELETE /salud/:idMascota/:recurso/:id
================================== */

const salud = crearApartado({ nombre: 'salud', recursos, alCargar, despuesDeGuardar });

export const fichaSalud = salud.ficha;
export const crearRegistro = salud.crear;
export const editarRegistro = salud.editar;
export const eliminarRegistro = salud.eliminar;
