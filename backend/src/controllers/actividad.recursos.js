// =====================================================
// Configuración de cada tipo de registro del apartado de actividad física.
// Los tipos de campo y opciones están explicados en utils/apartado.js
// =====================================================

export const recursos = {

    // Actividades realizadas del último año
    actividades: {
        tabla: 'actividades_fisicas',
        id: 'id_actividad',
        orden: 'fecha_hora DESC',
        filtro: 'r.fecha_hora >= CURDATE() - INTERVAL 365 DAY',
        limite: 2000,
        campos: {
            tipo: { tipo: 'texto', max: 60, requerido: true },
            fecha_hora: { tipo: 'fechaHora', requerido: true },
            duracion_min: { tipo: 'entero', min: 1, max: 1440, requerido: true },
            distancia_km: { tipo: 'decimal', min: 0, max: 999 },
            pasos: { tipo: 'entero', min: 0, max: 1000000 },
            calorias: { tipo: 'entero', min: 0, max: 100000 },
            intensidad: { tipo: 'enum', valores: ['baja', 'media', 'alta'], requerido: true },
            id_paseo: {
                tipo: 'ref', tabla: 'paseos', id: 'id_paseo',
                mensaje: 'El paseo seleccionado no existe.',
            },
            notas: { tipo: 'texto', max: 255 },
        },
        // Si en la lista se eligió "otro", aquí viene cuál
        extras: {
            tipo_otro: { tipo: 'texto', max: 60 },
        },
        validar: (d, extras) => {
            if (d.tipo !== 'otro') {
                return null;
            }

            if (!extras.tipo_otro) {
                return 'Escribe qué actividad fue.';
            }

            d.tipo = extras.tipo_otro;
            return null;
        },
    },

    // Agenda de paseos
    paseos: {
        tabla: 'paseos',
        id: 'id_paseo',
        orden: 'fecha_hora DESC',
        campos: {
            fecha_hora: { tipo: 'fechaHora', requerido: true },
            duracion_min: { tipo: 'entero', min: 1, max: 1440 },
            lugar: { tipo: 'texto', max: 150 },
            estado: { tipo: 'enum', valores: ['programado', 'realizado', 'cancelado'], requerido: true },
            notas: { tipo: 'texto', max: 255 },
        },
    },


    // Control de peso (la misma tabla que usa Alimentación)
    pesos: {
        tabla: 'control_peso',
        id: 'id_peso',
        orden: 'fecha DESC, id_peso DESC',
        campos: {
            fecha: { tipo: 'fecha', requerido: true },
            peso_kg: { tipo: 'decimal', min: 0.01, max: 999.99, requerido: true },
            condicion_corporal: { tipo: 'entero', min: 1, max: 9 },
            energia: { tipo: 'enum', valores: ['baja', 'normal', 'alta'] },
            pelo_piel: { tipo: 'texto', max: 255 },
            notas: { tipo: 'texto', max: 255 },
        },
    },

    // Meta de actividad: la más reciente es la actual
    metas: {
        tabla: 'metas_actividad',
        id: 'id_meta',
        orden: 'fecha_inicio DESC, id_meta DESC',
        campos: {
            minutos_dia: { tipo: 'entero', min: 1, max: 600, requerido: true },
            paseos_semana: { tipo: 'entero', min: 0, max: 100 },
            pasos_dia: { tipo: 'entero', min: 0, max: 200000 },
            fecha_inicio: { tipo: 'fecha', requerido: true },
            notas: { tipo: 'texto', max: 255 },
        },
    },

    // Ideas generadas con IA (se crean con POST /actividad/:idMascota/ideas/generar);
    // aquí solo se marcan como útiles o no, o se borran
    ideas: {
        tabla: 'recomendaciones',
        id: 'id_recomendacion',
        orden: 'fecha DESC, id_recomendacion',
        filtro: "r.origen = 'ia' AND r.seccion IN ('actividades', 'paseos', 'peso', 'meta')",
        sinCrear: true,
        campos: {
            util: { tipo: 'entero', min: 0, max: 1 },
            // Cuándo se agregó a las actividades o a la agenda de paseos
            aplicada: { tipo: 'fecha' },
        },
    },
};
