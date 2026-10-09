import { consulta, entero } from '../utils/apartado.js';
import { errorDocumento, guardarFoto } from '../utils/fotos.js';


// Registros que un gasto puede pagar: columna en gastos, tabla y categoría sugerida
const VINCULOS = {
    cita: { columna: 'id_cita', tabla: 'citas_veterinarias', id: 'id_cita', categoria: 1 },
    vacuna: { columna: 'id_vacuna', tabla: 'vacunas', id: 'id_vacuna', categoria: 5 },
    desparasitacion: { columna: 'id_desparasitacion', tabla: 'desparasitaciones', id: 'id_desparasitacion', categoria: 8 },
    medicamento: { columna: 'id_medicamento', tabla: 'medicamentos', id: 'id_medicamento', categoria: 4 },
    // La compra guarda el gasto en compras_alimento.id_gasto
    compra: { tabla: 'compras_alimento', id: 'id_compra', categoria: 2 },
};

const METODOS = ['efectivo', 'tarjeta', 'transferencia', 'otro'];


/* ==================================
   GET /finanzas
   Gastos de todas las mascotas del usuario (últimos 2 años),
   presupuestos y registros de salud y alimentación sin costo
================================== */

export async function fichaFinanzas(req, res) {
    try {
        const idUsuario = req.usuario.id_usuario;

        const [mascotas] = await consulta(
            `SELECT m.id_mascota, m.nombre, m.foto, e.nombre AS especie
             FROM mascotas m JOIN especies e ON e.id_especie = m.id_especie
             WHERE m.id_usuario = ? AND m.activo = 1 ORDER BY m.nombre`,
            [idUsuario]
        );

        const [categorias] = await consulta('SELECT id_categoria, nombre, icono FROM categorias_gasto ORDER BY id_categoria');

        const [gastos] = await consulta(
            `SELECT g.id_gasto, g.id_mascota, m.nombre AS mascota, g.id_categoria, g.descripcion, g.monto, g.fecha,
                    g.metodo_pago, g.comprobante, g.notas,
                    g.id_cita, g.id_vacuna, g.id_desparasitacion, g.id_medicamento, ca.id_compra,
                    CASE
                        WHEN g.id_cita IS NOT NULL THEN 'cita'
                        WHEN g.id_vacuna IS NOT NULL THEN 'vacuna'
                        WHEN g.id_desparasitacion IS NOT NULL THEN 'desparasitacion'
                        WHEN g.id_medicamento IS NOT NULL THEN 'medicamento'
                        WHEN ca.id_compra IS NOT NULL THEN 'compra'
                    END AS vinculo
             FROM gastos g
             JOIN mascotas m ON m.id_mascota = g.id_mascota
             LEFT JOIN compras_alimento ca ON ca.id_gasto = g.id_gasto
             WHERE m.id_usuario = ? AND m.activo = 1 AND g.fecha >= CURDATE() - INTERVAL 24 MONTH
             ORDER BY g.fecha DESC, g.id_gasto DESC`,
            [idUsuario]
        );

        const [presupuestos] = await consulta(
            `SELECT id_presupuesto, id_categoria, anio, mes, monto_limite FROM presupuestos
             WHERE id_usuario = ? AND anio = YEAR(CURDATE()) AND mes = MONTH(CURDATE())`,
            [idUsuario]
        );

        // Lo que se registró en Salud y Alimentación en los últimos 6 meses y aún no tiene costo
        const [pendientes] = await consulta(
            `SELECT 'cita' AS vinculo, c.id_cita AS id, m.id_mascota, m.nombre AS mascota,
                    CONCAT('Consulta: ', c.motivo) AS descripcion, DATE(c.fecha_hora) AS fecha
             FROM citas_veterinarias c JOIN mascotas m ON m.id_mascota = c.id_mascota
             WHERE m.id_usuario = ? AND m.activo = 1 AND c.estado <> 'cancelada' AND c.fecha_hora <= NOW()
               AND c.fecha_hora >= CURDATE() - INTERVAL 6 MONTH
               AND NOT EXISTS (SELECT 1 FROM gastos g WHERE g.id_cita = c.id_cita)

             UNION ALL
             SELECT 'vacuna', v.id_vacuna, m.id_mascota, m.nombre,
                    CONCAT('Vacuna: ', COALESCE(tv.nombre, v.nombre_vacuna, 'Vacuna')), v.fecha_aplicacion
             FROM vacunas v JOIN mascotas m ON m.id_mascota = v.id_mascota
             LEFT JOIN tipos_vacuna tv ON tv.id_tipo_vacuna = v.id_tipo_vacuna
             WHERE m.id_usuario = ? AND m.activo = 1 AND v.fecha_aplicacion >= CURDATE() - INTERVAL 6 MONTH
               AND NOT EXISTS (SELECT 1 FROM gastos g WHERE g.id_vacuna = v.id_vacuna)

             UNION ALL
             SELECT 'desparasitacion', d.id_desparasitacion, m.id_mascota, m.nombre,
                    CONCAT('Desparasitación: ', d.producto), d.fecha_aplicacion
             FROM desparasitaciones d JOIN mascotas m ON m.id_mascota = d.id_mascota
             WHERE m.id_usuario = ? AND m.activo = 1 AND d.fecha_aplicacion >= CURDATE() - INTERVAL 6 MONTH
               AND NOT EXISTS (SELECT 1 FROM gastos g WHERE g.id_desparasitacion = d.id_desparasitacion)

             UNION ALL
             SELECT 'medicamento', md.id_medicamento, m.id_mascota, m.nombre,
                    CONCAT('Medicamento: ', md.nombre), md.fecha_inicio
             FROM medicamentos md JOIN mascotas m ON m.id_mascota = md.id_mascota
             WHERE m.id_usuario = ? AND m.activo = 1 AND md.fecha_inicio >= CURDATE() - INTERVAL 6 MONTH
               AND NOT EXISTS (SELECT 1 FROM gastos g WHERE g.id_medicamento = md.id_medicamento)

             UNION ALL
             SELECT 'compra', ca.id_compra, m.id_mascota, m.nombre,
                    CONCAT('Compra de alimento: ', a.nombre, ' (', TRIM(TRAILING '.' FROM TRIM(TRAILING '0' FROM ca.cantidad_g / 1000)), ' kg)'),
                    ca.fecha
             FROM compras_alimento ca
             JOIN mascotas m ON m.id_mascota = ca.id_mascota
             JOIN alimentos a ON a.id_alimento = ca.id_alimento
             WHERE m.id_usuario = ? AND m.activo = 1 AND ca.fecha >= CURDATE() - INTERVAL 6 MONTH AND ca.id_gasto IS NULL

             ORDER BY fecha DESC
             LIMIT 60`,
            [idUsuario, idUsuario, idUsuario, idUsuario, idUsuario]
        );

        res.json({
            mascotas,
            categorias,
            gastos: gastos.map((g) => ({ ...g, monto: Number(g.monto) })),
            presupuestos: presupuestos.map((p) => ({ ...p, monto_limite: Number(p.monto_limite) })),
            pendientes: pendientes.map((p) => ({ ...p, categoria: VINCULOS[p.vinculo].categoria })),
        });
    } catch (error) {
        console.error('Error al cargar finanzas:', error.message);
        res.status(500).json({ message: 'No se pudo cargar la información de finanzas.' });
    }
}


/* ==================================
   LEER EL FORMULARIO DE UN GASTO
================================== */

async function mascotaDelUsuario(id, idUsuario) {
    const [filas] = await consulta(
        'SELECT id_mascota FROM mascotas WHERE id_mascota = ? AND id_usuario = ? AND activo = 1',
        [entero(id), idUsuario]
    );
    return filas[0]?.id_mascota || null;
}


async function leerGasto(req, esEdicion) {

    const b = req.body;
    const descripcion = String(b.descripcion ?? '').trim().slice(0, 200);
    const monto = Number(String(b.monto ?? '').replace(',', '.'));
    const fecha = String(b.fecha ?? '').trim();
    const metodo = String(b.metodo_pago ?? 'efectivo').trim() || 'efectivo';

    const [categoria] = (await consulta('SELECT id_categoria FROM categorias_gasto WHERE id_categoria = ?', [entero(b.id_categoria)]))[0];

    if (!categoria) {
        return { error: 'Elige la categoría del gasto.' };
    }

    if (!descripcion) {
        return { error: 'Escribe en qué fue el gasto.' };
    }

    if (!Number.isFinite(monto) || monto <= 0 || monto > 9999999999) {
        return { error: 'El valor del gasto debe ser mayor a $0.' };
    }

    if (!/^\d{4}-\d{2}-\d{2}$/.test(fecha) || Number.isNaN(new Date(`${fecha}T00:00:00`).getTime())) {
        return { error: 'La fecha no es válida.' };
    }

    if (!METODOS.includes(metodo)) {
        return { error: 'El método de pago no es válido.' };
    }

    // Mascota: una, o "todas" para dividir el gasto en partes iguales (solo al crear)
    let mascotas;

    if (!esEdicion && b.id_mascota === 'todas') {
        const [filas] = await consulta('SELECT id_mascota FROM mascotas WHERE id_usuario = ? AND activo = 1', [req.usuario.id_usuario]);
        mascotas = filas.map((f) => f.id_mascota);
    } else {
        const id = await mascotaDelUsuario(b.id_mascota, req.usuario.id_usuario);
        mascotas = id ? [id] : [];
    }

    if (!mascotas.length) {
        return { error: 'Elige la mascota del gasto.' };
    }

    // Registro que paga este gasto: "vacuna:12"
    let vinculo = null;

    if (String(b.vinculo ?? '').trim()) {
        const [tipo, id] = String(b.vinculo).split(':');
        const config = VINCULOS[tipo];

        if (!config || mascotas.length !== 1) {
            return { error: 'El registro relacionado no es válido.' };
        }

        const [filas] = await consulta(
            `SELECT ${config.id} AS id FROM ${config.tabla} WHERE ${config.id} = ? AND id_mascota = ?`,
            [entero(id), mascotas[0]]
        );

        if (!filas[0]) {
            return { error: 'El registro relacionado no es de esta mascota.' };
        }

        vinculo = { tipo, id: filas[0].id };
    }

    // Comprobante opcional (foto o PDF)
    const archivo = req.files?.comprobante;

    if (archivo) {
        const error = errorDocumento(archivo);
        if (error) {
            return { error };
        }
    }

    const notas = String(b.notas ?? '').trim().slice(0, 255) || null;

    return {
        mascotas,
        vinculo,
        archivo,
        datos: { id_categoria: categoria.id_categoria, descripcion, monto: Math.round(monto * 100) / 100, fecha, metodo_pago: metodo, notas },
    };
}


// Liga el gasto con su registro (y quita el vínculo anterior)
async function guardarVinculo(idGasto, vinculo) {

    await consulta(
        'UPDATE gastos SET id_cita = NULL, id_vacuna = NULL, id_desparasitacion = NULL, id_medicamento = NULL WHERE id_gasto = ?',
        [idGasto]
    );
    await consulta('UPDATE compras_alimento SET id_gasto = NULL WHERE id_gasto = ?', [idGasto]);

    if (!vinculo) {
        return;
    }

    if (vinculo.tipo === 'compra') {
        await consulta('UPDATE compras_alimento SET id_gasto = ? WHERE id_compra = ?', [idGasto, vinculo.id]);
    } else {
        await consulta(`UPDATE gastos SET ${VINCULOS[vinculo.tipo].columna} = ? WHERE id_gasto = ?`, [vinculo.id, idGasto]);
    }
}


/* ==================================
   CREAR, EDITAR Y ELIMINAR GASTOS
================================== */

// POST /finanzas/gastos
export async function crearGasto(req, res) {
    try {
        const { error, mascotas, vinculo, archivo, datos } = await leerGasto(req, false);

        if (error) {
            return res.status(400).json({ message: error });
        }

        const comprobante = archivo ? await guardarFoto(archivo, 'comprobantes') : null;

        // Dividido entre varias mascotas: partes iguales y el resto de centavos en la primera
        const parte = Math.floor((datos.monto / mascotas.length) * 100) / 100;
        const resto = Math.round((datos.monto - parte * mascotas.length) * 100) / 100;

        const ids = [];

        for (const [i, idMascota] of mascotas.entries()) {
            const [resultado] = await consulta('INSERT INTO gastos SET ?', [{
                ...datos,
                id_mascota: idMascota,
                monto: i === 0 ? parte + resto : parte,
                comprobante,
                notas: mascotas.length > 1
                    ? [datos.notas, `Gasto compartido entre ${mascotas.length} mascotas`].filter(Boolean).join(' · ').slice(0, 255)
                    : datos.notas,
            }]);
            ids.push(resultado.insertId);
        }

        await guardarVinculo(ids[0], vinculo);

        res.status(201).json({
            ids,
            message: mascotas.length > 1 ? `Gasto dividido entre ${mascotas.length} mascotas.` : 'Gasto registrado.',
        });
    } catch (error) {
        console.error('Error al registrar gasto:', error.message);
        res.status(500).json({ message: 'No se pudo registrar el gasto.' });
    }
}


async function gastoDelUsuario(req) {
    const [filas] = await consulta(
        `SELECT g.id_gasto FROM gastos g JOIN mascotas m ON m.id_mascota = g.id_mascota
         WHERE g.id_gasto = ? AND m.id_usuario = ?`,
        [entero(req.params.id), req.usuario.id_usuario]
    );
    return filas[0]?.id_gasto || null;
}


// PUT /finanzas/gastos/:id
export async function editarGasto(req, res) {
    try {
        const idGasto = await gastoDelUsuario(req);

        if (!idGasto) {
            return res.status(404).json({ message: 'No se encontró el gasto.' });
        }

        const { error, mascotas, vinculo, archivo, datos } = await leerGasto(req, true);

        if (error) {
            return res.status(400).json({ message: error });
        }

        const cambios = { ...datos, id_mascota: mascotas[0] };

        if (archivo) {
            cambios.comprobante = await guardarFoto(archivo, 'comprobantes');
        }

        await consulta('UPDATE gastos SET ? WHERE id_gasto = ?', [cambios, idGasto]);
        await guardarVinculo(idGasto, vinculo);

        res.json({ message: 'Gasto actualizado.' });
    } catch (error) {
        console.error('Error al editar gasto:', error.message);
        res.status(500).json({ message: 'No se pudo actualizar el gasto.' });
    }
}


// DELETE /finanzas/gastos/:id
export async function eliminarGasto(req, res) {
    try {
        const idGasto = await gastoDelUsuario(req);

        if (!idGasto) {
            return res.status(404).json({ message: 'No se encontró el gasto.' });
        }

        // La compra de alimento ligada queda sin gasto (la base de datos lo hace sola)
        await consulta('DELETE FROM gastos WHERE id_gasto = ?', [idGasto]);

        res.json({ message: 'Gasto eliminado.' });
    } catch (error) {
        console.error('Error al eliminar gasto:', error.message);
        res.status(500).json({ message: 'No se pudo eliminar el gasto.' });
    }
}


/* ==================================
   PRESUPUESTO DEL MES
   PUT /finanzas/presupuesto  { id_categoria (vacío = total), monto (0 = quitar) }
================================== */

export async function guardarPresupuesto(req, res) {
    try {
        const idUsuario = req.usuario.id_usuario;
        const idCategoria = String(req.body.id_categoria ?? '').trim() ? entero(req.body.id_categoria) : null;
        const monto = Number(String(req.body.monto ?? '').replace(',', '.') || 0);

        if (idCategoria) {
            const [[existe]] = await consulta('SELECT COUNT(*) AS n FROM categorias_gasto WHERE id_categoria = ?', [idCategoria]);
            if (!existe.n) {
                return res.status(400).json({ message: 'La categoría no existe.' });
            }
        }

        if (!Number.isFinite(monto) || monto < 0 || monto > 9999999999) {
            return res.status(400).json({ message: 'El presupuesto no es válido.' });
        }

        // NULL no cuenta como repetido en la clave única: se borra y se vuelve a crear
        await consulta(
            `DELETE FROM presupuestos WHERE id_usuario = ? AND anio = YEAR(CURDATE()) AND mes = MONTH(CURDATE())
               AND ${idCategoria ? 'id_categoria = ?' : 'id_categoria IS NULL'}`,
            idCategoria ? [idUsuario, idCategoria] : [idUsuario]
        );

        if (monto > 0) {
            await consulta(
                `INSERT INTO presupuestos (id_usuario, id_categoria, anio, mes, monto_limite)
                 VALUES (?, ?, YEAR(CURDATE()), MONTH(CURDATE()), ?)`,
                [idUsuario, idCategoria, monto]
            );
        }

        res.json({ message: monto > 0 ? 'Presupuesto guardado.' : 'Presupuesto quitado.' });
    } catch (error) {
        console.error('Error al guardar presupuesto:', error.message);
        res.status(500).json({ message: 'No se pudo guardar el presupuesto.' });
    }
}
