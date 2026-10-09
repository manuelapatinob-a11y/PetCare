import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

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

// Guarda el archivo en uploads/<subcarpeta> y devuelve la ruta pública
export function guardarFoto(archivo, subcarpeta) {
    const carpeta = path.join(carpetaUploads, subcarpeta);
    fs.mkdirSync(carpeta, { recursive: true });

    const nombre = `${crypto.randomUUID()}${tiposDocumento[archivo.mimetype]}`;
    fs.writeFileSync(path.join(carpeta, nombre), archivo.data);

    return `/uploads/${subcarpeta}/${nombre}`;
}
