// =====================================================
// Recordatorios que se repiten (diaria, semanal, mensual, anual):
// cuando pasa su hora, pasan solos a la siguiente vez.
// =====================================================

import { consulta } from './apartado.js';


// "2026-10-09 08:30:00" -> la siguiente fecha (después de "desde") según la repetición
export function siguienteFecha(fechaHora, repeticion, desde = new Date()) {

    const [dia, hora] = fechaHora.replace('T', ' ').split(' ');
    const [anio, mes, d] = dia.split('-').map(Number);
    const [h, m] = hora.split(':').map(Number);

    const fecha = new Date(anio, mes - 1, d, h, m, 0);
    const diaDelMes = d;

    let vueltas = 0;

    do {
        if (repeticion === 'diaria') {
            fecha.setDate(fecha.getDate() + 1);
        } else if (repeticion === 'semanal') {
            fecha.setDate(fecha.getDate() + 7);
        } else if (repeticion === 'mensual') {
            // El 31 pasa al último día de los meses más cortos
            fecha.setDate(1);
            fecha.setMonth(fecha.getMonth() + 1);
            const ultimo = new Date(fecha.getFullYear(), fecha.getMonth() + 1, 0).getDate();
            fecha.setDate(Math.min(diaDelMes, ultimo));
        } else if (repeticion === 'anual') {
            fecha.setFullYear(fecha.getFullYear() + 1);
        } else {
            return null;
        }

        vueltas++;
    } while (fecha <= desde && vueltas < 5000);

    const dos = (n) => String(n).padStart(2, '0');

    return `${fecha.getFullYear()}-${dos(fecha.getMonth() + 1)}-${dos(fecha.getDate())} ${dos(fecha.getHours())}:${dos(fecha.getMinutes())}:00`;
}


// Los que se repiten y ya pasaron hace más de una hora quedan para la próxima vez
export async function avanzarRepetidos(idUsuario = null) {

    const [pasados] = await consulta(
        `SELECT id_recordatorio, DATE_FORMAT(fecha_hora, '%Y-%m-%d %H:%i:%s') AS fecha_hora, repeticion
         FROM recordatorios
         WHERE completado = 0 AND repeticion <> 'ninguna' AND fecha_hora < NOW() - INTERVAL 1 HOUR
           ${idUsuario ? 'AND id_usuario = ?' : ''}`,
        idUsuario ? [idUsuario] : []
    );

    for (const r of pasados) {
        await consulta('UPDATE recordatorios SET fecha_hora = ? WHERE id_recordatorio = ?', [
            siguienteFecha(r.fecha_hora, r.repeticion),
            r.id_recordatorio,
        ]);
    }

    return pasados.length;
}
