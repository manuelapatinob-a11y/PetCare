import { connection } from '../config/mysql/dbmysql.js';
import { errorFoto, guardarFoto } from '../utils/fotos.js';


/* ==================================
   AYUDAS
================================== */

function texto(valor, maximo) {
    return String(valor ?? '').trim().slice(0, maximo);
}

function entero(valor) {
    const numero = Number(valor);
    return Number.isInteger(numero) && numero > 0 ? numero : null;
}

// Los checkbox de un formulario llegan como "on", "true" o "1"
function booleano(valor) {
    return ['1', 'true', 'on', 'si', 'sí'].includes(String(valor ?? '').toLowerCase());
}

// Columnas que se envían al navegador (la fecha como texto AAAA-MM-DD)
const columnasMascota = `
    m.id_mascota, m.id_especie, m.id_raza, m.nombre, m.sexo,
    DATE_FORMAT(m.fecha_nacimiento, '%Y-%m-%d') AS fecha_nacimiento,
    m.color, m.peso_actual, m.esterilizado, m.microchip, m.alergias,
    m.observaciones, m.foto, m.activo, m.fecha_registro,
    e.nombre AS especie, r.nombre AS raza
`;

function formatearMascota(mascota) {
    return {
        ...mascota,
        peso_actual: mascota.peso_actual === null ? null : Number(mascota.peso_actual),
        esterilizado: Boolean(mascota.esterilizado),
        activo: Boolean(mascota.activo),
    };
}


/* ==================================
   CATÁLOGOS
================================== */

// GET /mascotas/especies
export async function listarEspecies(req, res) {
    try {
        const [especies] = await connection.query(
            'SELECT id_especie, nombre FROM especies ORDER BY id_especie'
        );
        res.json(especies);
    } catch (error) {
        console.error('Error al listar especies:', error.message);
        res.status(500).json({ message: 'No se pudieron cargar las especies.' });
    }
}

// GET /mascotas/razas?especie=1
export async function listarRazas(req, res) {
    try {
        const especie = entero(req.query.especie);

        const [razas] = await connection.query(
            `SELECT id_raza, id_especie, nombre, tamano
             FROM razas
             ${especie ? 'WHERE id_especie = ?' : ''}
             ORDER BY nombre`,
            especie ? [especie] : []
        );
        res.json(razas);
    } catch (error) {
        console.error('Error al listar razas:', error.message);
        res.status(500).json({ message: 'No se pudieron cargar las razas.' });
    }
}


/* ==================================
   MASCOTAS DEL USUARIO
================================== */

// GET /mascotas: mascotas activas del usuario que inició sesión
export async function listarMascotas(req, res) {
    try {
        const [mascotas] = await connection.query(
            `SELECT ${columnasMascota}
             FROM mascotas m
             JOIN especies e ON e.id_especie = m.id_especie
             LEFT JOIN razas r ON r.id_raza = m.id_raza
             WHERE m.id_usuario = ? AND m.activo = 1
             ORDER BY m.fecha_registro DESC`,
            [req.usuario.id_usuario]
        );
        res.json(mascotas.map(formatearMascota));
    } catch (error) {
        console.error('Error al listar mascotas:', error.message);
        res.status(500).json({ message: 'No se pudieron cargar tus mascotas.' });
    }
}


// Lee y valida el formulario de una mascota (al crear y al editar)
async function leerMascota(req) {
    const datos = {
        id_especie: entero(req.body.id_especie),
        id_raza: entero(req.body.id_raza),
        nombre: texto(req.body.nombre, 60),
        sexo: texto(req.body.sexo, 10).toLowerCase(),
        fecha_nacimiento: texto(req.body.fecha_nacimiento, 10) || null,
        color: texto(req.body.color, 50) || null,
        peso_actual: req.body.peso_actual === undefined || req.body.peso_actual === ''
            ? null
            : Number(req.body.peso_actual),
        esterilizado: booleano(req.body.esterilizado) ? 1 : 0,
        microchip: texto(req.body.microchip, 50) || null,
        alergias: texto(req.body.alergias, 2000) || null,
        observaciones: texto(req.body.observaciones, 2000) || null,
    };

    if (!datos.nombre || !datos.id_especie) {
        return { error: 'El nombre y la especie son obligatorios.' };
    }

    if (!['macho', 'hembra'].includes(datos.sexo)) {
        return { error: 'Selecciona si es macho o hembra.' };
    }

    if (datos.fecha_nacimiento) {
        const fecha = new Date(`${datos.fecha_nacimiento}T00:00:00`);

        if (!/^\d{4}-\d{2}-\d{2}$/.test(datos.fecha_nacimiento) || Number.isNaN(fecha.getTime())) {
            return { error: 'La fecha de nacimiento no es válida.' };
        }

        if (fecha > new Date()) {
            return { error: 'La fecha de nacimiento no puede ser futura.' };
        }
    }

    if (datos.peso_actual !== null
        && (!Number.isFinite(datos.peso_actual) || datos.peso_actual <= 0 || datos.peso_actual > 999.99)) {
        return { error: 'El peso debe estar entre 0.01 y 999.99 kg.' };
    }

    const [especies] = await connection.query(
        'SELECT id_especie FROM especies WHERE id_especie = ?',
        [datos.id_especie]
    );

    if (!especies[0]) {
        return { error: 'La especie no existe.' };
    }

    if (datos.id_raza) {
        const [razas] = await connection.query(
            'SELECT id_raza FROM razas WHERE id_raza = ? AND id_especie = ?',
            [datos.id_raza, datos.id_especie]
        );

        if (!razas[0]) {
            return { error: 'La raza no corresponde a la especie.' };
        }
    }

    const foto = req.files?.foto;

    if (foto && errorFoto(foto)) {
        return { error: errorFoto(foto) };
    }

    return { datos, foto };
}


async function buscarMascotaCompleta(id) {
    const [filas] = await connection.query(
        `SELECT ${columnasMascota}
         FROM mascotas m
         JOIN especies e ON e.id_especie = m.id_especie
         LEFT JOIN razas r ON r.id_raza = m.id_raza
         WHERE m.id_mascota = ?`,
        [id]
    );
    return formatearMascota(filas[0]);
}


// POST /mascotas: registra una mascota (activo y fecha_registro los pone la base de datos)
export async function crearMascota(req, res) {
    try {
        const { datos, foto, error } = await leerMascota(req);

        if (error) {
            return res.status(400).json({ message: error });
        }

        const [resultado] = await connection.query('INSERT INTO mascotas SET ?', [{
            ...datos,
            id_usuario: req.usuario.id_usuario,
            foto: foto ? guardarFoto(foto, 'mascotas') : null,
        }]);

        res.status(201).json(await buscarMascotaCompleta(resultado.insertId));
    } catch (error) {
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(409).json({ message: 'Ya existe una mascota con ese número de microchip.' });
        }

        console.error('Error al registrar la mascota:', error.message);
        res.status(500).json({ message: 'No se pudo registrar la mascota.' });
    }
}


// PUT /mascotas/:id: edita la ficha (la foto solo cambia si se sube otra o se pide quitarla)
export async function editarMascota(req, res) {
    try {
        const id = entero(req.params.id);

        const [propias] = await connection.query(
            'SELECT id_mascota FROM mascotas WHERE id_mascota = ? AND id_usuario = ? AND activo = 1',
            [id, req.usuario.id_usuario]
        );

        if (!propias[0]) {
            return res.status(404).json({ message: 'No se encontró la mascota.' });
        }

        const { datos, foto, error } = await leerMascota(req);

        if (error) {
            return res.status(400).json({ message: error });
        }

        if (foto) {
            datos.foto = guardarFoto(foto, 'mascotas');
        } else if (booleano(req.body.quitar_foto)) {
            datos.foto = null;
        }

        await connection.query('UPDATE mascotas SET ? WHERE id_mascota = ?', [datos, id]);

        res.json(await buscarMascotaCompleta(id));
    } catch (error) {
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(409).json({ message: 'Ya existe una mascota con ese número de microchip.' });
        }

        console.error('Error al editar la mascota:', error.message);
        res.status(500).json({ message: 'No se pudo guardar la mascota.' });
    }
}


// DELETE /mascotas/:id: la marca como inactiva para no perder su historial
export async function eliminarMascota(req, res) {
    try {
        const id = entero(req.params.id);

        const [resultado] = await connection.query(
            'UPDATE mascotas SET activo = 0 WHERE id_mascota = ? AND id_usuario = ? AND activo = 1',
            [id, req.usuario.id_usuario]
        );

        if (resultado.affectedRows === 0) {
            return res.status(404).json({ message: 'No se encontró la mascota.' });
        }

        res.json({ message: 'Mascota eliminada.' });
    } catch (error) {
        console.error('Error al eliminar la mascota:', error.message);
        res.status(500).json({ message: 'No se pudo eliminar la mascota.' });
    }
}
