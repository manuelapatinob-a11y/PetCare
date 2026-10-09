// =====================================================
// Configuración de cada tipo de registro del apartado de
// entrenamiento y comportamiento.
// Los tipos de campo y opciones están explicados en utils/apartado.js
// =====================================================

import { CATEGORIAS_RUTINA, DIAS } from '../servicios/ideasIA.js';

export const recursos = {

    // Comandos y habilidades que está aprendiendo
    entrenamientos: {
        tabla: 'entrenamientos',
        id: 'id_entrenamiento',
        orden: 'fecha DESC, id_entrenamiento DESC',
        campos: {
            comando: { tipo: 'texto', max: 100, requerido: true },
            fecha: { tipo: 'fecha', requerido: true },
            duracion_min: { tipo: 'entero', min: 1, max: 600 },
            nivel_progreso: { tipo: 'enum', valores: ['iniciado', 'en_progreso', 'dominado'], requerido: true },
            notas: { tipo: 'largo' },
        },
    },

    // Diario de comportamiento del último año
    diario: {
        tabla: 'diario_comportamiento',
        id: 'id_diario',
        orden: 'fecha_hora DESC, id_diario DESC',
        filtro: 'r.fecha_hora >= CURDATE() - INTERVAL 365 DAY',
        limite: 1000,
        campos: {
            fecha_hora: { tipo: 'fechaHora', requerido: true },
            tipo: { tipo: 'enum', valores: ['positivo', 'neutral', 'a_mejorar'], requerido: true },
            estado_animo: {
                tipo: 'enum', requerido: true,
                valores: ['feliz', 'tranquilo', 'energico', 'ansioso', 'triste', 'agresivo'],
            },
            comportamiento: { tipo: 'texto', max: 150, requerido: true },
            intensidad: { tipo: 'enum', valores: ['leve', 'moderada', 'fuerte'] },
            detonante: { tipo: 'texto', max: 150 },
            respuesta: { tipo: 'texto', max: 255 },
            descripcion: { tipo: 'largo' },
        },
    },

    // Rutinas: la activa es la que se muestra como "rutina de hoy"
    rutinas: {
        tabla: 'rutinas',
        id: 'id_rutina',
        orden: 'activa DESC, fecha_creacion DESC',
        campos: {
            nombre: { tipo: 'texto', max: 100, requerido: true },
            objetivo: { tipo: 'texto', max: 100 },
            descripcion: { tipo: 'largo' },
            activa: { tipo: 'bool' },
        },
    },

    // Actividades de cada rutina
    pasosRutina: {
        tabla: 'rutina_actividades',
        id: 'id_rutina_actividad',
        orden: 'hora, FIELD(dia_semana, \'todos\', \'lunes\', \'martes\', \'miercoles\', \'jueves\', \'viernes\', \'sabado\', \'domingo\')',
        campos: {
            id_rutina: {
                tipo: 'ref', tabla: 'rutinas', id: 'id_rutina', requerido: true,
                mensaje: 'La rutina seleccionada no existe.',
            },
            dia_semana: { tipo: 'enum', valores: DIAS, requerido: true },
            hora: { tipo: 'hora', requerido: true },
            actividad: { tipo: 'texto', max: 150, requerido: true },
            categoria: { tipo: 'enum', valores: CATEGORIAS_RUTINA, requerido: true },
            duracion_min: { tipo: 'entero', min: 1, max: 600 },
            detalle: { tipo: 'texto', max: 255 },
        },
    },

    // Ideas de entrenamiento y consejos de comportamiento generados con IA
    // (se crean con POST /entrenamiento/:idMascota/ideas/generar);
    // aquí solo se marcan como útiles o no, o se borran
    ideas: {
        tabla: 'recomendaciones',
        id: 'id_recomendacion',
        orden: 'fecha DESC, id_recomendacion',
        filtro: "r.origen = 'ia' AND r.seccion IN ('entrenamiento', 'comportamiento')",
        sinCrear: true,
        campos: {
            util: { tipo: 'entero', min: 0, max: 1 },
            // Cuándo se agregó al entrenamiento o a una rutina
            aplicada: { tipo: 'fecha' },
        },
    },
};
