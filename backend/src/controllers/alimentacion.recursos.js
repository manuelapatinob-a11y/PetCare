// =====================================================
// Configuración de cada tipo de registro del apartado de alimentación.
// Los tipos de campo y opciones están explicados en utils/apartado.js
// =====================================================

import { consulta } from '../utils/apartado.js';

const ORIGEN = ['veterinario', 'propietario'];

const TIPOS_ALIMENTO = ['pienso', 'humeda', 'casera', 'dieta_especial', 'premio', 'golosina', 'suplemento'];

// Un alimento de la misma mascota
const ALIMENTO = {
    tipo: 'ref', tabla: 'alimentos', id: 'id_alimento',
    mensaje: 'El alimento seleccionado no existe.',
};


export const recursos = {

    // Alimentos que consume, con sus existencias calculadas:
    // inicial + compras - lo servido en las comidas
    alimentos: {
        tabla: 'alimentos',
        id: 'id_alimento',
        carpeta: 'alimentos',
        orden: "en_uso DESC, FIELD(tipo, 'pienso', 'humeda', 'casera', 'dieta_especial', 'premio', 'golosina', 'suplemento'), nombre",
        select: `SELECT r.*,
                    r.stock_inicial_g
                    + COALESCE((SELECT SUM(c.cantidad_g) FROM compras_alimento c WHERE c.id_alimento = r.id_alimento), 0)
                    - COALESCE((SELECT SUM(ra.cantidad_g) FROM registros_alimentacion ra WHERE ra.id_alimento = r.id_alimento), 0)
                    AS existencias_g,
                    (SELECT SUM(ra.cantidad_g) / 7 FROM registros_alimentacion ra
                     WHERE ra.id_alimento = r.id_alimento AND ra.fecha_hora >= NOW() - INTERVAL 7 DAY)
                    AS consumo_diario_g
                 FROM alimentos r`,
        calculados: {
            existencias_g: { tipo: 'decimal' },
            consumo_diario_g: { tipo: 'decimal' },
        },
        campos: {
            nombre: { tipo: 'texto', max: 120, requerido: true },
            marca: { tipo: 'texto', max: 100 },
            tipo: { tipo: 'enum', valores: TIPOS_ALIMENTO, requerido: true },
            ingredientes: { tipo: 'largo' },
            foto: { tipo: 'foto' },
            fecha_inicio: { tipo: 'fecha' },
            fecha_fin: { tipo: 'fecha' },
            en_uso: { tipo: 'bool' },
            stock_inicial_g: { tipo: 'decimal', min: 0, max: 9999999 },
            alerta_minima_g: { tipo: 'decimal', min: 0, max: 9999999 },
            observaciones: { tipo: 'largo' },
        },
        validar: (d) => {
            d.stock_inicial_g ??= 0;

            return d.fecha_fin && d.fecha_inicio && d.fecha_fin < d.fecha_inicio
                ? 'La fecha en que dejó de comerlo no puede ser antes del inicio.'
                : null;
        },
    },

    restricciones: {
        tabla: 'restricciones_alimentarias',
        id: 'id_restriccion',
        carpeta: 'alimentos',
        orden: "FIELD(motivo, 'toxico', 'alergia', 'intolerancia', 'indicacion_medica', 'otro'), alimento",
        campos: {
            alimento: { tipo: 'texto', max: 120, requerido: true },
            motivo: { tipo: 'enum', valores: ['alergia', 'intolerancia', 'toxico', 'indicacion_medica', 'otro'], requerido: true },
            reaccion: { tipo: 'largo' },
            foto: { tipo: 'foto' },
            origen: { tipo: 'enum', valores: ORIGEN, requerido: true },
            fecha: { tipo: 'fecha' },
            observaciones: { tipo: 'largo' },
        },
    },

    // Comidas de los últimos 90 días: servida (cantidad_g), consumida, tiempo y apetito
    comidas: {
        tabla: 'registros_alimentacion',
        id: 'id_registro',
        orden: 'fecha_hora DESC',
        filtro: 'r.fecha_hora >= CURDATE() - INTERVAL 90 DAY',
        limite: 1000,
        campos: {
            fecha_hora: { tipo: 'fechaHora', requerido: true },
            id_alimento: ALIMENTO,
            alimento: { tipo: 'texto', max: 120 },
            id_horario: {
                tipo: 'ref', tabla: 'horarios_comida', id: 'id_horario',
                mensaje: 'El horario seleccionado no existe.',
            },
            cantidad_g: { tipo: 'decimal', min: 0.1, max: 99999, requerido: true },
            cantidad_consumida_g: { tipo: 'decimal', min: 0, max: 99999 },
            duracion_min: { tipo: 'entero', min: 0, max: 600 },
            apetito: { tipo: 'enum', valores: ['normal', 'poco', 'ansioso', 'rechazo'], requerido: true },
            notas: { tipo: 'texto', max: 255 },
        },
        validar: (d) => (d.cantidad_consumida_g !== null && d.cantidad_consumida_g > d.cantidad_g
            ? 'Lo consumido no puede ser más que lo servido.'
            : null),
        // El nombre del alimento se toma del alimento elegido
        antesDeGuardar: async (d) => {
            if (d.id_alimento) {
                const [filas] = await consulta('SELECT nombre, marca FROM alimentos WHERE id_alimento = ?', [d.id_alimento]);
                d.alimento = [filas[0].nombre, filas[0].marca].filter(Boolean).join(' - ').slice(0, 120);
            }

            if (!d.alimento) {
                return 'Elige el alimento o escribe cuál fue.';
            }

            d.consumio_todo = d.cantidad_consumida_g === null || d.cantidad_consumida_g >= d.cantidad_g ? 1 : 0;
            return null;
        },
    },

    horarios: {
        tabla: 'horarios_comida',
        id: 'id_horario',
        orden: 'hora',
        campos: {
            hora: { tipo: 'hora', requerido: true },
            tipo: { tipo: 'enum', valores: ['comida', 'snack'], requerido: true },
            id_alimento: ALIMENTO,
            porcion_g: { tipo: 'decimal', min: 0.1, max: 99999, requerido: true },
            descripcion: { tipo: 'texto', max: 150 },
            id_plan: {
                tipo: 'ref', tabla: 'planes_alimenticios', id: 'id_plan',
                mensaje: 'El plan seleccionado no existe.',
            },
        },
    },

    planes: {
        tabla: 'planes_alimenticios',
        id: 'id_plan',
        orden: 'activo DESC, fecha_inicio DESC',
        campos: {
            nombre: { tipo: 'texto', max: 100, requerido: true },
            tipo_alimento: { tipo: 'texto', max: 100, requerido: true },
            marca: { tipo: 'texto', max: 100 },
            porcion_diaria_g: { tipo: 'decimal', min: 1, max: 99999 },
            calorias_diarias: { tipo: 'entero', min: 1, max: 99999 },
            fecha_inicio: { tipo: 'fecha', requerido: true },
            fecha_fin: { tipo: 'fecha' },
            activo: { tipo: 'bool' },
        },
        // Si en la lista se eligió "otro", aquí viene cuál
        extras: {
            tipo_alimento_otro: { tipo: 'texto', max: 100 },
        },
        validar: (d, extras) => {
            if (d.tipo_alimento !== 'otro') {
                return null;
            }

            if (!extras.tipo_alimento_otro) {
                return 'Escribe qué tipo de alimento es.';
            }

            d.tipo_alimento = extras.tipo_alimento_otro;
            return null;
        },
    },

    agua: {
        tabla: 'consumo_agua',
        id: 'id_agua',
        orden: 'fecha DESC, id_agua DESC',
        limite: 180,
        campos: {
            fecha: { tipo: 'fecha', requerido: true },
            ofrecida_ml: { tipo: 'decimal', min: 0, max: 50000 },
            consumida_ml: { tipo: 'decimal', min: 0, max: 50000 },
            veces_bebe: { tipo: 'entero', min: 0, max: 500 },
            cambio_sed: { tipo: 'enum', valores: ['normal', 'aumentada', 'disminuida'], requerido: true },
            notas: { tipo: 'texto', max: 255 },
        },
    },

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

    // Cada compra suma existencias (el gasto se registra en Finanzas)
    compras: {
        tabla: 'compras_alimento',
        id: 'id_compra',
        orden: 'fecha DESC, id_compra DESC',
        select: `SELECT r.*, a.nombre AS nombre_alimento, a.marca AS marca_alimento
                 FROM compras_alimento r
                 JOIN alimentos a ON a.id_alimento = r.id_alimento`,
        campos: {
            id_alimento: { ...ALIMENTO, requerido: true },
            fecha: { tipo: 'fecha', requerido: true },
            cantidad_g: { tipo: 'decimal', min: 1, max: 9999999, requerido: true },
            lugar: { tipo: 'texto', max: 120 },
        },
    },

    // Seguimiento nutricional: recomendaciones del veterinario
    recomendaciones: {
        tabla: 'recomendaciones',
        id: 'id_recomendacion',
        orden: 'fecha DESC',
        filtro: "r.categoria = 'alimentacion'",
        fijos: { categoria: 'alimentacion', origen: 'veterinario' },
        campos: {
            titulo: { tipo: 'texto', max: 150, requerido: true },
            contenido: { tipo: 'largo', requerido: true },
            profesional: { tipo: 'texto', max: 120 },
            fecha: { tipo: 'fecha', requerido: true },
        },
    },
};
