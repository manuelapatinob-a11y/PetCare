// =====================================================
// Alerta cuando se está acabando un alimento.
// La usan el apartado de alimentación (al guardar comidas, compras
// o alimentos) y la revisión automática de cada hora (servicios/notificaciones.js).
// El aviso aparece en la campanita y sale en el correo de recordatorios.
// =====================================================

import { consulta } from '../utils/apartado.js';
import { crearNotificacion } from './notificaciones.js';

// Días que debe alcanzar el alimento antes de avisar
const DIAS_MINIMOS = 5;


function gramos(valor) {
    const numero = Math.max(Number(valor), 0);
    return numero >= 1000
        ? `${(numero / 1000).toLocaleString('es-CO', { maximumFractionDigits: 2 })} kg`
        : `${numero.toLocaleString('es-CO', { maximumFractionDigits: 0 })} g`;
}



// Revisa las existencias de un alimento.
// - Si se está acabando: crea una notificación (una sola vez hasta que se reponga);
//   el correo lo envía el resumen de notificaciones.
// - Si se repuso: la alerta queda lista para la próxima vez.
export async function revisarExistencias(idAlimento, mascota, usuario) {
    if (!idAlimento) {
        return;
    }

    const [[alimento]] = await consulta(
        `SELECT a.id_alimento, a.nombre, a.marca, a.en_uso, a.alerta_minima_g, a.stock_inicial_g,
            a.alerta_enviada,
            a.stock_inicial_g
            + COALESCE((SELECT SUM(c.cantidad_g) FROM compras_alimento c WHERE c.id_alimento = a.id_alimento), 0)
            - COALESCE((SELECT SUM(r.cantidad_g) FROM registros_alimentacion r WHERE r.id_alimento = a.id_alimento), 0)
            AS existencias,
            (SELECT SUM(r.cantidad_g) / 7 FROM registros_alimentacion r
             WHERE r.id_alimento = a.id_alimento AND r.fecha_hora >= NOW() - INTERVAL 7 DAY) AS consumo_diario,
            (SELECT COUNT(*) FROM compras_alimento c WHERE c.id_alimento = a.id_alimento) AS compras
         FROM alimentos a
         WHERE a.id_alimento = ? AND a.id_mascota = ?`,
        [idAlimento, mascota.id_mascota]
    );

    // Solo alimentos en uso de los que se lleva control de existencias
    if (!alimento || !alimento.en_uso || (Number(alimento.stock_inicial_g) <= 0 && !alimento.compras)) {
        return;
    }

    const existencias = Math.max(Number(alimento.existencias), 0);
    const consumo = Number(alimento.consumo_diario) || 0;
    const dias = consumo ? Math.floor(existencias / consumo) : null;

    const bajo = (alimento.alerta_minima_g !== null && existencias <= Number(alimento.alerta_minima_g))
        || (dias !== null && dias <= DIAS_MINIMOS);

    // Se repuso: todo listo para la próxima alerta
    if (!bajo) {
        if (alimento.alerta_enviada) {
            await consulta('UPDATE alimentos SET alerta_enviada = NULL WHERE id_alimento = ?', [idAlimento]);
        }
        return;
    }

    // Ya se avisó en este periodo
    if (alimento.alerta_enviada) {
        return;
    }

    const nombre = [alimento.nombre, alimento.marca].filter(Boolean).join(' - ');
    const cuanto = dias !== null
        ? `quedan ${gramos(existencias)}, alcanza para unos ${dias} ${dias === 1 ? 'día' : 'días'}`
        : `quedan ${gramos(existencias)}`;

    await crearNotificacion({
        idUsuario: usuario.id_usuario,
        categoria: 'alimento',
        titulo: `Se está acabando el alimento de ${mascota.nombre}`,
        mensaje: `${nombre}: ${cuanto}. Es buen momento para comprar más.`,
        enlace: `alimentacion/Alimentacion.html?mascota=${mascota.id_mascota}`,
        clave: `alimento:${idAlimento}:${new Date().toISOString()}`,
    });

    await consulta('UPDATE alimentos SET alerta_enviada = NOW() WHERE id_alimento = ?', [idAlimento]);
}


// Revisa todos los alimentos en uso de todas las mascotas activas
// (para avisar aunque no se haya registrado nada nuevo)
export async function revisarTodasLasExistencias() {
    const [alimentos] = await consulta(
        `SELECT a.id_alimento, m.id_mascota, m.nombre AS nombre_mascota,
                u.id_usuario, u.correo, u.nombres
         FROM alimentos a
         JOIN mascotas m ON m.id_mascota = a.id_mascota AND m.activo = 1
         JOIN usuarios u ON u.id_usuario = m.id_usuario AND u.activo = 1
         WHERE a.en_uso = 1`
    );

    for (const a of alimentos) {
        try {
            await revisarExistencias(
                a.id_alimento,
                { id_mascota: a.id_mascota, nombre: a.nombre_mascota },
                { id_usuario: a.id_usuario, correo: a.correo, nombres: a.nombres }
            );
        } catch (error) {
            console.error('Error al revisar existencias:', error.message);
        }
    }
}

