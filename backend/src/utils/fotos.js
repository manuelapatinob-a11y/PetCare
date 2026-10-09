import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { connection } from '../config/mysql/dbmysql.js';

// Carpeta donde se guardan los archivos subidos (backend/uploads)
export const carpetaUploads = fileURLToPath(new URL('../../uploads', import.meta.url));

const tiposImagen = {
    'image/jpeg': '.jpg',
    'image/png': '.png',
    'image/webp': '.webp',
};

// Documentos médicos: fotos o PDF
const tiposDocumento = {
    ...tiposImagen,
    'application/pdf': '.pdf',
};

function errorArchivo(archivo, tipos, maximoMB, mensajeTipo) {
    if (!tipos[archivo.mimetype]) {
        return mensajeTipo;
    }

    if (archivo.truncated || archivo.size > maximoMB * 1024 * 1024) {
        return `El archivo no puede pesar más de ${maximoMB} MB.`;
    }

    return null;
}

// Devuelve un mensaje de error si la foto no es válida, o null si está bien
export function errorFoto(archivo) {
    return errorArchivo(archivo, tiposImagen, 2, 'La foto debe ser JPG, PNG o WEBP.');
}

// Igual que errorFoto, pero acepta PDF y archivos de hasta 5 MB
export function errorDocumento(archivo) {
    return errorArchivo(archivo, tiposDocumento, 5, 'El archivo debe ser una foto (JPG, PNG, WEBP) o un PDF.');
}

// Guarda el archivo y devuelve la ruta pública (/uploads/<subcarpeta>/<nombre>).
// Se guarda en la tabla "archivos" de la base de datos (así no se pierde en
// servidores gratuitos que borran su disco al reiniciar) y también en
// backend/uploads como copia local.
export async function guardarFoto(archivo, subcarpeta) {
    const nombre = `${crypto.randomUUID()}${tiposDocumento[archivo.mimetype]}`;
    const ruta = `/uploads/${subcarpeta}/${nombre}`;

    await connection.query(
        'INSERT INTO archivos (ruta, tipo, datos, tamano) VALUES (?, ?, ?, ?)',
        [ruta, archivo.mimetype, archivo.data, archivo.data.length]
    );

    try {
        const carpeta = path.join(carpetaUploads, subcarpeta);
        fs.mkdirSync(carpeta, { recursive: true });
        fs.writeFileSync(path.join(carpeta, nombre), archivo.data);
    } catch {
        // Sin disco disponible: basta con la copia en la base de datos
    }

    return ruta;
}


// GET /uploads/...: si el archivo no está en el disco, se busca en la base de datos
export async function servirArchivo(req, res, next) {
    try {
        const ruta = `/uploads${decodeURIComponent(req.path)}`;

        const [[archivo]] = await connection.query(
            'SELECT tipo, datos FROM archivos WHERE ruta = ?',
            [ruta]
        );

        if (!archivo) {
            return next();
        }

        res.set('Content-Type', archivo.tipo);
        res.set('Cache-Control', 'public, max-age=31536000, immutable');
        res.send(archivo.datos);
    } catch (error) {
        next(error);
    }
}
