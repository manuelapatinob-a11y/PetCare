import { consulta } from './apartado.js';

// El peso más reciente del control de peso pasa a ser el peso actual de la mascota
// (se usa en Alimentación y en Actividad física)
export async function actualizarPesoActual(idMascota) {
    await consulta(
        `UPDATE mascotas SET peso_actual = (
            SELECT peso_kg FROM control_peso WHERE id_mascota = ?
            ORDER BY fecha DESC, id_peso DESC LIMIT 1
         ) WHERE id_mascota = ?`,
        [idMascota, idMascota]
    );
}
