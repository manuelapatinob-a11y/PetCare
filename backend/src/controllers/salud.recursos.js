// =====================================================
// Configuración de cada tipo de registro del apartado de salud.
// Los tipos de campo y opciones están explicados en utils/apartado.js
// =====================================================

const ORIGEN = ['veterinario', 'propietario'];

// Una cita de la misma mascota
const CITA = {
    tipo: 'ref', tabla: 'citas_veterinarias', id: 'id_cita',
    mensaje: 'La cita seleccionada no existe.',
};

export const recursos = {

    vacunas: {
        tabla: 'vacunas',
        id: 'id_vacuna',
        orden: 'fecha_aplicacion DESC',
        select: `SELECT r.*, tv.nombre AS tipo_vacuna
                 FROM vacunas r
                 LEFT JOIN tipos_vacuna tv ON tv.id_tipo_vacuna = r.id_tipo_vacuna`,
        campos: {
            id_tipo_vacuna: { tipo: 'tipoVacuna' },
            nombre_vacuna: { tipo: 'texto', max: 100 },
            fecha_aplicacion: { tipo: 'fecha', requerido: true },
            proxima_dosis: { tipo: 'fecha' },
            clinica: { tipo: 'texto', max: 150 },
            veterinario: { tipo: 'texto', max: 120 },
            lote: { tipo: 'texto', max: 50 },
            observaciones: { tipo: 'largo' },
        },
        validar: (d) => (!d.id_tipo_vacuna && !d.nombre_vacuna
            ? 'Elige la vacuna o escribe su nombre.'
            : null),
    },

    desparasitaciones: {
        tabla: 'desparasitaciones',
        id: 'id_desparasitacion',
        orden: 'fecha_aplicacion DESC',
        campos: {
            tipo: { tipo: 'enum', valores: ['interna', 'externa'], requerido: true },
            producto: { tipo: 'texto', max: 120, requerido: true },
            dosis: { tipo: 'texto', max: 60 },
            fecha_aplicacion: { tipo: 'fecha', requerido: true },
            proxima_aplicacion: { tipo: 'fecha' },
            observaciones: { tipo: 'largo' },
        },
    },

    enfermedades: {
        tabla: 'enfermedades',
        id: 'id_enfermedad',
        orden: "FIELD(estado, 'activa', 'controlada', 'curada'), fecha_diagnostico DESC",
        campos: {
            nombre: { tipo: 'texto', max: 150, requerido: true },
            fecha_diagnostico: { tipo: 'fecha' },
            estado: { tipo: 'enum', valores: ['activa', 'controlada', 'curada'], requerido: true },
            cronica: { tipo: 'bool' },
            origen: { tipo: 'enum', valores: ORIGEN, requerido: true },
            observaciones: { tipo: 'largo' },
        },
    },

    sintomas: {
        tabla: 'sintomas',
        id: 'id_sintoma',
        orden: 'fecha_inicio DESC',
        campos: {
            descripcion: { tipo: 'texto', max: 200, requerido: true },
            fecha_inicio: { tipo: 'fecha', requerido: true },
            frecuencia: { tipo: 'texto', max: 80 },
            evolucion: { tipo: 'enum', valores: ['mejorando', 'igual', 'empeorando', 'resuelto'], requerido: true },
            cambios: { tipo: 'largo' },
            observaciones: { tipo: 'largo' },
            id_cita: CITA,
        },
    },

    antecedentes: {
        tabla: 'antecedentes',
        id: 'id_antecedente',
        orden: 'fecha DESC, fecha_registro DESC',
        campos: {
            tipo: {
                tipo: 'enum',
                valores: ['alergia', 'reaccion', 'lesion', 'accidente', 'cirugia', 'observacion'],
                requerido: true,
            },
            descripcion: { tipo: 'texto', max: 200, requerido: true },
            fecha: { tipo: 'fecha' },
            gravedad: { tipo: 'enum', valores: ['leve', 'moderada', 'grave'] },
            origen: { tipo: 'enum', valores: ORIGEN, requerido: true },
            observaciones: { tipo: 'largo' },
        },
    },

    medicamentos: {
        tabla: 'medicamentos',
        id: 'id_medicamento',
        orden: '(fecha_fin IS NULL OR fecha_fin >= CURDATE()) DESC, fecha_inicio DESC',
        campos: {
            nombre: { tipo: 'texto', max: 120, requerido: true },
            dosis: { tipo: 'texto', max: 60, requerido: true },
            frecuencia: { tipo: 'texto', max: 60, requerido: true },
            via: { tipo: 'texto', max: 40 },
            fecha_inicio: { tipo: 'fecha', requerido: true },
            fecha_fin: { tipo: 'fecha' },
            efectos_observados: { tipo: 'largo' },
            notas: { tipo: 'largo' },
            id_cita: CITA,
        },
        validar: (d) => (d.fecha_fin && d.fecha_fin < d.fecha_inicio
            ? 'La fecha de finalización no puede ser antes del inicio.'
            : null),
    },

    citas: {
        tabla: 'citas_veterinarias',
        id: 'id_cita',
        orden: 'fecha_hora DESC',
        // El costo de la consulta se guarda como un gasto ligado a la cita
        select: `SELECT r.*,
                    (SELECT g.monto FROM gastos g
                     WHERE g.id_cita = r.id_cita AND g.id_categoria = 1
                     ORDER BY g.id_gasto LIMIT 1) AS costo
                 FROM citas_veterinarias r`,
        campos: {
            // 1. Datos de la cita
            fecha_hora: { tipo: 'fechaHora', requerido: true },
            motivo: { tipo: 'texto', max: 200, requerido: true },
            tipo: {
                tipo: 'enum',
                valores: ['control', 'vacunacion', 'urgencia', 'seguimiento', 'cirugia', 'otro'],
                requerido: true,
            },
            tipo_otro: { tipo: 'texto', max: 100 },
            estado: { tipo: 'enum', valores: ['programada', 'completada', 'cancelada'], requerido: true },
            clinica: { tipo: 'texto', max: 150 },
            // 2. Motivo y síntomas
            sintomas_descripcion: { tipo: 'largo' },
            sintomas_inicio: { tipo: 'fecha' },
            cambios_observados: { tipo: 'largo' },
            evolucion_sintomas: { tipo: 'largo' },
            // 3. Atención veterinaria
            veterinario: { tipo: 'texto', max: 120 },
            pruebas_realizadas: { tipo: 'largo' },
            resultados: { tipo: 'largo' },
            diagnostico: { tipo: 'largo' },
            origen_informacion: { tipo: 'enum', valores: ORIGEN, requerido: true },
            // 4. Tratamiento e indicaciones
            cuidados_casa: { tipo: 'largo' },
            restricciones: { tipo: 'largo' },
            proxima_revision: { tipo: 'fecha' },
            // 5. Seguimiento
            evolucion_posterior: { tipo: 'largo' },
            tratamiento_cumplido: { tipo: 'enum', valores: ['si', 'parcial', 'no'] },
            sintomas_nuevos: { tipo: 'largo' },
            notas: { tipo: 'largo' },
        },
        // Campos que no son columnas de la tabla
        extras: {
            costo: { tipo: 'decimal', min: 0, max: 9999999999 },
        },
        validar: (d) => {
            // Si el tipo es "otro" hay que decir cuál; si no, ese campo no aplica
            if (d.tipo !== 'otro') {
                d.tipo_otro = null;
                return null;
            }

            return d.tipo_otro ? null : 'Escribe qué tipo de cita es.';
        },
    },

    documentos: {
        tabla: 'documentos_medicos',
        id: 'id_documento',
        orden: 'fecha DESC',
        carpeta: 'documentos',
        campos: {
            tipo: { tipo: 'enum', valores: ['informe', 'receta', 'factura', 'analisis', 'otro'], requerido: true },
            titulo: { tipo: 'texto', max: 150, requerido: true },
            fecha: { tipo: 'fecha', requerido: true },
            archivo: { tipo: 'archivo', requerido: true },
            notas: { tipo: 'largo' },
            id_cita: CITA,
        },
    },

};
