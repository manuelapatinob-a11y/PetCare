// =====================================================
// Motor común de los apartados por mascota (Salud, Alimentación...).
// Cada apartado describe sus "recursos" (tabla, campos, validaciones)
// y este archivo se encarga de leer, validar, guardar y borrar.
//
// Tipos de campo:
//   texto (max), largo, fecha, fechaHora, hora, enum (valores),
//   decimal (min, max), entero (min, max), bool,
//   archivo (foto o PDF de hasta 5 MB), foto (solo imagen de hasta 2 MB),
//   ref (tabla, id: un registro de la misma mascota),
//   tipoVacuna (catálogo según la especie)
//
// Opciones de cada recurso:
//   tabla, id, orden, select, filtro, limite, carpeta,
//   campos, extras (campos que no son columnas),
//   fijos (valores que siempre se guardan),
//   sinCrear (solo se puede editar o borrar, no crear desde un formulario),
//   validar(datos, extras), antesDeGuardar(datos, mascota, extras)
// =====================================================

import { connection } from '../config/mysql/dbmysql.js';
import { errorDocumento, errorFoto, guardarFoto } from './fotos.js';


/* ==================================
   AYUDAS
================================== */

// Fechas como texto ("2026-10-09" y "2026-10-09T15:30:00") para no tener
// problemas de zona horaria en el navegador
function fechasComoTexto(campo, siguiente) {
    if (campo.type === 'DATE') {
        return campo.string();
    }

    if (campo.type === 'DATETIME' || campo.type === 'TIMESTAMP') {
        const valor = campo.string();
        return valor ? valor.replace(' ', 'T') : valor;
    }

    return siguiente();
}

export function consulta(sql, valores) {
    return connection.query({ sql, values: valores, typeCast: fechasComoTexto });
}

function nombreLegible(campo) {
    return campo.replace(/^id_/, '').replaceAll('_', ' ');
}

export function entero(valor) {
    const numero = Number(valor);
    return Number.isInteger(numero) && numero > 0 ? numero : null;
}

function fechaValida(texto) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(texto)) {
        return false;
    }

    // Rechaza fechas imposibles como el 30 de febrero
    const [anio, mes, dia] = texto.split('-').map(Number);
    const fecha = new Date(anio, mes - 1, dia);

    return fecha.getFullYear() === anio && fecha.getMonth() === mes - 1 && fecha.getDate() === dia;
}

// Los decimales llegan de MySQL como texto: se convierten a número
export function convertirNumeros(fila, recurso) {
    const campos = { ...recurso.campos, ...(recurso.extras || {}), ...(recurso.calculados || {}) };

    for (const [nombre, config] of Object.entries(campos)) {
        if (config.tipo === 'decimal' && fila[nombre] !== null && fila[nombre] !== undefined) {
            fila[nombre] = Number(fila[nombre]);
        }

        if (config.tipo === 'bool') {
            fila[nombre] = Boolean(fila[nombre]);
        }
    }

    return fila;
}

// La mascota tiene que ser del usuario que inició sesión
export async function buscarMascota(req) {
    const [filas] = await consulta(
        `SELECT m.id_mascota, m.id_especie, m.nombre, m.sexo, m.fecha_nacimiento, m.peso_actual,
                m.esterilizado, m.microchip, m.alergias, m.observaciones, m.foto,
                e.nombre AS especie, r.nombre AS raza
         FROM mascotas m
         JOIN especies e ON e.id_especie = m.id_especie
         LEFT JOIN razas r ON r.id_raza = m.id_raza
         WHERE m.id_mascota = ? AND m.id_usuario = ? AND m.activo = 1`,
        [entero(req.params.idMascota), req.usuario.id_usuario]
    );

    const mascota = filas[0];

    if (mascota) {
        mascota.peso_actual = mascota.peso_actual === null ? null : Number(mascota.peso_actual);
        mascota.esterilizado = Boolean(mascota.esterilizado);
    }

    return mascota || null;
}


/* ==================================
   LEER Y VALIDAR UN FORMULARIO
================================== */

async function leerDatos(recurso, req, mascota, esEdicion) {
    const datos = {};
    const extras = {};
    const archivos = {};

    const todos = [
        ...Object.entries(recurso.campos).map(([n, c]) => [n, c, datos]),
        ...Object.entries(recurso.extras || {}).map(([n, c]) => [n, c, extras]),
    ];

    for (const [nombre, config, destino] of todos) {
        const textoCrudo = String(req.body[nombre] ?? '').trim();
        const etiqueta = nombreLegible(nombre);
        let valor = null;

        switch (config.tipo) {
            case 'texto':
                valor = textoCrudo.slice(0, config.max) || null;
                break;

            case 'largo':
                valor = textoCrudo.slice(0, 5000) || null;
                break;

            case 'fecha':
                if (textoCrudo) {
                    if (!fechaValida(textoCrudo)) {
                        return { error: `La fecha "${etiqueta}" no es válida.` };
                    }
                    valor = textoCrudo;
                }
                break;

            case 'fechaHora':
                if (textoCrudo) {
                    const partes = textoCrudo.replace(' ', 'T').match(/^(\d{4}-\d{2}-\d{2})T(\d{2}:\d{2})(:\d{2})?$/);

                    if (!partes || !fechaValida(partes[1])) {
                        return { error: `La fecha y hora "${etiqueta}" no es válida.` };
                    }
                    valor = `${partes[1]} ${partes[2]}${partes[3] || ':00'}`;
                }
                break;

            case 'hora':
                if (textoCrudo) {
                    const partes = textoCrudo.match(/^([01]\d|2[0-3]):([0-5]\d)(:[0-5]\d)?$/);

                    if (!partes) {
                        return { error: `La hora "${etiqueta}" no es válida.` };
                    }
                    valor = `${partes[1]}:${partes[2]}:00`;
                }
                break;

            case 'enum':
                if (textoCrudo) {
                    if (!config.valores.includes(textoCrudo.toLowerCase())) {
                        return { error: `El valor de "${etiqueta}" no es válido.` };
                    }
                    valor = textoCrudo.toLowerCase();
                }
                break;

            case 'decimal':
            case 'entero':
                if (textoCrudo) {
                    const numero = Number(textoCrudo.replace(',', '.'));
                    const valido = Number.isFinite(numero)
                        && (config.tipo === 'decimal' || Number.isInteger(numero))
                        && numero >= config.min && numero <= config.max;

                    if (!valido) {
                        return { error: `El valor de "${etiqueta}" no es válido.` };
                    }
                    valor = numero;
                }
                break;

            case 'bool':
                valor = ['1', 'true', 'on', 'si', 'sí'].includes(textoCrudo.toLowerCase()) ? 1 : 0;
                break;

            case 'archivo':
            case 'foto': {
                const archivo = req.files?.[nombre];

                if (archivo) {
                    const error = config.tipo === 'foto' ? errorFoto(archivo) : errorDocumento(archivo);
                    if (error) {
                        return { error };
                    }
                    archivos[nombre] = archivo;
                } else if (esEdicion) {
                    // Al editar sin subir uno nuevo, se deja el archivo anterior
                    continue;
                }
                break;
            }

            case 'ref':
                // Un registro de otra tabla que tiene que ser de la misma mascota
                if (textoCrudo) {
                    const [filas] = await consulta(
                        `SELECT ${config.id} AS id FROM ${config.tabla} WHERE ${config.id} = ? AND id_mascota = ?`,
                        [entero(textoCrudo), mascota.id_mascota]
                    );
                    if (!filas[0]) {
                        return { error: config.mensaje || `"${etiqueta}" no existe.` };
                    }
                    valor = filas[0].id;
                }
                break;

            case 'tipoVacuna':
                if (textoCrudo) {
                    const [filas] = await consulta(
                        'SELECT id_tipo_vacuna FROM tipos_vacuna WHERE id_tipo_vacuna = ? AND id_especie = ?',
                        [entero(textoCrudo), mascota.id_especie]
                    );
                    if (!filas[0]) {
                        return { error: 'La vacuna no corresponde a la especie de la mascota.' };
                    }
                    valor = filas[0].id_tipo_vacuna;
                }
                break;
        }

        if (config.requerido && (valor === null || valor === undefined) && !archivos[nombre]) {
            return { error: `El campo "${etiqueta}" es obligatorio.` };
        }

        destino[nombre] = valor;
    }

    const error = recurso.validar?.(datos, extras) || await recurso.antesDeGuardar?.(datos, mascota, extras);

    if (error) {
        return { error };
    }

    Object.assign(datos, recurso.fijos || {});

    // Los archivos se guardan solo si todo lo demás es válido
    for (const [nombre, archivo] of Object.entries(archivos)) {
        datos[nombre] = guardarFoto(archivo, recurso.carpeta || 'documentos');
    }

    return { datos, extras };
}


/* ==================================
   CREAR LOS CONTROLADORES DE UN APARTADO
================================== */

// opciones:
//   nombre: para los mensajes ("salud", "alimentación")
//   recursos: configuración de cada tipo de registro
//   alCargar(mascota, respuesta): agrega datos extra a la ficha
//   despuesDeGuardar(clave, id, datos, extras, mascota, usuario)
//   despuesDeEliminar(clave, registro, mascota, usuario)
export function crearApartado({ nombre, recursos, alCargar, despuesDeGuardar, despuesDeEliminar }) {

    // GET /:idMascota: todos los registros de la mascota
    async function ficha(req, res) {
        try {
            const mascota = await buscarMascota(req);

            if (!mascota) {
                return res.status(404).json({ message: 'No se encontró la mascota.' });
            }

            const respuesta = { mascota };

            for (const [clave, recurso] of Object.entries(recursos)) {
                const [filas] = await consulta(
                    `${recurso.select || `SELECT r.* FROM ${recurso.tabla} r`}
                     WHERE r.id_mascota = ? ${recurso.filtro ? `AND ${recurso.filtro}` : ''}
                     ORDER BY ${recurso.orden}
                     ${recurso.limite ? `LIMIT ${recurso.limite}` : ''}`,
                    [mascota.id_mascota]
                );
                respuesta[clave] = filas.map((fila) => convertirNumeros(fila, recurso));
            }

            await alCargar?.(mascota, respuesta);

            res.json(respuesta);
        } catch (error) {
            console.error(`Error al cargar ${nombre}:`, error.message);
            res.status(500).json({ message: `No se pudo cargar la información de ${nombre}.` });
        }
    }


    async function guardar(req, res, esEdicion) {
        try {
            const clave = req.params.recurso;
            const recurso = recursos[clave];

            if (!recurso) {
                return res.status(404).json({ message: 'Tipo de registro desconocido.' });
            }

            if (!esEdicion && recurso.sinCrear) {
                return res.status(405).json({ message: 'Este tipo de registro no se crea desde aquí.' });
            }

            const mascota = await buscarMascota(req);

            if (!mascota) {
                return res.status(404).json({ message: 'No se encontró la mascota.' });
            }

            const { datos, extras, error } = await leerDatos(recurso, req, mascota, esEdicion);

            if (error) {
                return res.status(400).json({ message: error });
            }

            let id;

            if (esEdicion) {
                id = entero(req.params.id);

                const [resultado] = await consulta(
                    `UPDATE ${recurso.tabla} SET ? WHERE ${recurso.id} = ? AND id_mascota = ?`,
                    [datos, id, mascota.id_mascota]
                );

                if (resultado.affectedRows === 0) {
                    return res.status(404).json({ message: 'No se encontró el registro.' });
                }
            } else {
                const [resultado] = await consulta(
                    `INSERT INTO ${recurso.tabla} SET ?`,
                    [{ ...datos, id_mascota: mascota.id_mascota }]
                );
                id = resultado.insertId;
            }

            await despuesDeGuardar?.(clave, id, datos, extras, mascota, req.usuario);

            res.status(esEdicion ? 200 : 201).json({ id, message: 'Guardado correctamente.' });
        } catch (error) {
            console.error(`Error al guardar en ${nombre}:`, error.message);
            res.status(500).json({ message: 'No se pudo guardar el registro.' });
        }
    }


    // DELETE /:idMascota/:recurso/:id
    async function eliminar(req, res) {
        try {
            const clave = req.params.recurso;
            const recurso = recursos[clave];

            if (!recurso) {
                return res.status(404).json({ message: 'Tipo de registro desconocido.' });
            }

            const mascota = await buscarMascota(req);

            if (!mascota) {
                return res.status(404).json({ message: 'No se encontró la mascota.' });
            }

            const id = entero(req.params.id);

            const [filas] = await consulta(
                `SELECT * FROM ${recurso.tabla} WHERE ${recurso.id} = ? AND id_mascota = ?`,
                [id, mascota.id_mascota]
            );

            if (!filas[0]) {
                return res.status(404).json({ message: 'No se encontró el registro.' });
            }

            await consulta(`DELETE FROM ${recurso.tabla} WHERE ${recurso.id} = ?`, [id]);

            await despuesDeEliminar?.(clave, filas[0], mascota, req.usuario);

            res.json({ message: 'Eliminado correctamente.' });
        } catch (error) {
            console.error(`Error al eliminar en ${nombre}:`, error.message);
            res.status(500).json({ message: 'No se pudo eliminar el registro.' });
        }
    }


    return {
        ficha,
        crear: (req, res) => guardar(req, res, false),
        editar: (req, res) => guardar(req, res, true),
        eliminar,
    };
}
